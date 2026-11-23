/* Fotos y videos de los reportes, guardados en Vercel Blob como archivos PRIVADOS:
   nadie puede verlos con un enlace, solo los administradores desde /admin.html.

   GET  /api/fotos                    → { disponible } (público: ¿está conectado el almacenamiento?)
   POST /api/fotos?reporte=<id>       → sube un archivo (cuerpo = el archivo). Público, pero solo
                                        para reportes recién creados y con un máximo por reporte.
   GET  /api/fotos?ruta=<ruta>        → entrega el archivo. Requiere la clave de administración. */

import { randomUUID } from "node:crypto";
import { put, get } from "@vercel/blob";
import { redis, hayBaseDeDatos, claveFotos, leerFotos } from "../lib/redis.js";
import { responder } from "../lib/http.js";
import { claveCorrecta } from "../lib/clave.js";

const MAX_BYTES = 4 * 1024 * 1024;      // Vercel acepta hasta ~4,5 MB por envío
const MAX_POR_REPORTE = 6;
const MAX_POR_HORA = 60;                 // por conexión
const VENTANA_MS = 2 * 60 * 60 * 1000;   // solo se agregan fotos a reportes de las últimas 2 horas

export function hayAlmacenamiento() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/* Reconoce el tipo de archivo por su contenido (no se confía en lo que dice el navegador) */
function tipoDeArchivo(b) {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { tipo: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { tipo: "image/png", ext: "png" };
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return { tipo: "image/webp", ext: "webp" };
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return { tipo: "video/webm", ext: "webm" };
  if (b.toString("ascii", 4, 8) === "ftyp") {
    const marca = b.toString("ascii", 8, 12);
    if (["heic", "heix", "mif1", "msf1", "hevc"].includes(marca)) return { tipo: "image/heic", ext: "heic" };
    if (marca === "qt  ") return { tipo: "video/quicktime", ext: "mov" };
    return { tipo: "video/mp4", ext: "mp4" };
  }
  return null;
}

async function leerArchivo(req) {
  const partes = [];
  let total = 0;
  for await (const parte of req) {
    total += parte.length;
    if (total > MAX_BYTES) throw Object.assign(new Error("grande"), { grande: true });
    partes.push(parte);
  }
  return Buffer.concat(partes);
}

async function guardarEnBlob(ruta, archivo, tipo) {
  const opciones = { contentType: tipo, addRandomSuffix: true };
  try {
    return { ...(await put(ruta, archivo, { ...opciones, access: "private" })), acceso: "private" };
  } catch (errorPrivado) {
    // Si el almacenamiento se creó como "público", se guarda igual (el enlace solo lo ve el panel)
    try {
      return { ...(await put(ruta, archivo, { ...opciones, access: "public" })), acceso: "public" };
    } catch {
      throw errorPrivado;
    }
  }
}

async function subir(req, res) {
  if (!hayBaseDeDatos()) return responder(res, 503, { error: "La base de datos aún no está conectada." });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "desconocida";
  const claveLimite = `limite-fotos:${ip}`;
  const envios = await redis("INCR", claveLimite);
  if (envios === 1) await redis("EXPIRE", claveLimite, 3600);
  if (envios > MAX_POR_HORA) {
    return responder(res, 429, { error: "Se enviaron demasiadas fotos desde esta conexión. Inténtalo en una hora." });
  }

  const id = String(req.query?.reporte || new URL(req.url, "http://x").searchParams.get("reporte") || "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return responder(res, 400, { error: "Falta el reporte." });

  const guardado = await redis("HGET", "reportes", id);
  if (!guardado) return responder(res, 404, { error: "No existe ese reporte." });
  const reporte = JSON.parse(guardado);
  if (Date.now() - Date.parse(reporte.creado) > VENTANA_MS) {
    return responder(res, 403, { error: "Ya pasó el plazo para agregar fotos a este reporte." });
  }
  if ((await redis("LLEN", claveFotos(id))) >= MAX_POR_REPORTE) {
    return responder(res, 400, { error: `Se aceptan hasta ${MAX_POR_REPORTE} fotos o videos por reporte.` });
  }

  let archivo;
  try { archivo = await leerArchivo(req); }
  catch (e) {
    if (e.grande) return responder(res, 413, { error: "El archivo pesa más de 4 MB." });
    throw e;
  }
  const clase = tipoDeArchivo(archivo);
  if (!clase) return responder(res, 415, { error: "Solo se aceptan fotos (JPG, PNG, WebP, HEIC) o videos (MP4, MOV, WebM)." });

  const blob = await guardarEnBlob(`reportes/${id}/${randomUUID()}.${clase.ext}`, archivo, clase.tipo);
  const foto = { ruta: blob.pathname, url: blob.url, acceso: blob.acceso, tipo: clase.tipo, bytes: archivo.length, subida: new Date().toISOString() };
  await redis("RPUSH", claveFotos(id), JSON.stringify(foto));
  return responder(res, 201, { ok: true });
}

async function entregar(req, res, ruta) {
  if (!claveCorrecta(req.headers["x-clave-admin"])) return responder(res, 401, { error: "Clave incorrecta." });
  const id = (ruta.match(/^reportes\/([0-9a-f-]{36})\//) || [])[1];
  if (!id) return responder(res, 400, { error: "Ruta no válida." });

  // Solo se entregan archivos registrados en la base (evita leer cualquier otro archivo del almacenamiento)
  const foto = leerFotos(await redis("LRANGE", claveFotos(id), 0, -1)).find((f) => f.ruta === ruta);
  if (!foto) return responder(res, 404, { error: "No existe esa foto." });

  const resultado = await get(foto.url, { access: foto.acceso || "private" });
  if (!resultado || resultado.statusCode !== 200) return responder(res, 404, { error: "No existe esa foto." });
  res.statusCode = 200;
  res.setHeader("Content-Type", resultado.blob.contentType || foto.tipo);
  res.setHeader("Cache-Control", "private, no-store");
  const lector = resultado.stream.getReader();
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    res.write(Buffer.from(value));
  }
  res.end();
}

export default async function handler(req, res) {
  try {
    const ruta = req.query?.ruta || new URL(req.url, "http://x").searchParams.get("ruta");

    if (req.method === "GET" && !ruta) {
      return responder(res, 200, { disponible: hayAlmacenamiento() && hayBaseDeDatos() });
    }
    if (!hayAlmacenamiento()) {
      return responder(res, 503, { error: "El almacenamiento de fotos aún no está conectado." });
    }
    if (req.method === "GET") return await entregar(req, res, String(ruta));
    if (req.method === "POST") return await subir(req, res);

    res.setHeader("Allow", "GET, POST");
    return responder(res, 405, { error: "Método no permitido." });
  } catch (e) {
    console.error(e);
    return responder(res, 500, { error: "No se pudo guardar la foto. Inténtalo de nuevo." });
  }
}

/* El cuerpo es el archivo tal cual: que Vercel no intente leerlo como JSON */
export const config = { api: { bodyParser: false } };
