/* Reportes de rebalse.
   POST: guarda un reporte (público, sin clave).
   GET:  entrega los reportes visibles SIN datos personales y con la
         ubicación redondeada a la cuadra (~100 m). */

import { randomUUID } from "node:crypto";
import { redis, hayBaseDeDatos, todosLosReportes } from "../lib/redis.js";
import { responder, leerCuerpo } from "../lib/http.js";

const TIPOS = ["camara-publica", "camara-domiciliaria", "sumidero", "calle-anegada"];
const LLUVIA = ["no", "poco", "mucho"];
const MAX_POR_HORA = 20;

function texto(valor, largo) {
  return String(valor ?? "").trim().slice(0, largo);
}

/* Solo se aceptan coordenadas dentro del Gran Concepción */
function coordenada(valor, min, max) {
  const n = Number(valor);
  return valor != null && valor !== "" && Number.isFinite(n) && n >= min && n <= max ? n : null;
}

function aCuadra(valor) {
  return valor == null ? null : Math.round(valor * 1000) / 1000;
}

export function versionPublica(r) {
  return {
    fecha: r.fecha, junta: r.junta, tipo: r.tipo, red: r.red, llovia: r.llovia,
    lat: aCuadra(r.lat), lng: aCuadra(r.lng),
  };
}

function validar(c) {
  const r = {
    fecha: texto(c.fecha, 20),
    junta: texto(c.junta, 60),
    direccion: texto(c.direccion, 200),
    lat: coordenada(c.lat, -37.2, -36.5),
    lng: coordenada(c.lng, -73.4, -72.7),
    tipo: texto(c.tipo, 30),
    llovia: texto(c.llovia, 10),
    danos: texto(c.danos, 2000),
    reclamo: c.reclamo === "si" ? "si" : "no",
    numeroReclamo: texto(c.numeroReclamo, 40),
    nombre: texto(c.nombre, 100),
    telefono: texto(c.telefono, 30),
    cantidadFotos: Math.max(0, Math.min(50, parseInt(c.cantidadFotos, 10) || 0)),
    autoriza: c.autoriza === true,
  };
  if (r.lat == null || r.lng == null) { r.lat = null; r.lng = null; }
  r.red = r.tipo === "sumidero" || r.tipo === "calle-anegada" ? "aguas-lluvias" : "alcantarillado";

  const faltan = [];
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(r.fecha)) faltan.push("la fecha y hora");
  if (!/^[a-z0-9-]+$/.test(r.junta)) faltan.push("la junta de vecinos");
  if (!r.direccion) faltan.push("la dirección");
  if (!TIPOS.includes(r.tipo)) faltan.push("qué rebalsó");
  if (!LLUVIA.includes(r.llovia)) faltan.push("si llovía ese día");
  if (!r.nombre) faltan.push("tu nombre");
  if (!r.autoriza) faltan.push("la autorización");
  return { reporte: r, faltan };
}

export default async function handler(req, res) {
  if (!hayBaseDeDatos()) {
    return responder(res, 503, { error: "La base de datos aún no está conectada." });
  }

  try {
    if (req.method === "GET") {
      const visibles = (await todosLosReportes()).filter((r) => r.visible);
      return responder(res, 200, { reportes: visibles.map(versionPublica) });
    }

    if (req.method === "POST") {
      // Límite simple contra envíos masivos: 20 reportes por hora por conexión
      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "desconocida";
      const claveLimite = `limite:${ip}`;
      const envios = await redis("INCR", claveLimite);
      if (envios === 1) await redis("EXPIRE", claveLimite, 3600);
      if (envios > MAX_POR_HORA) {
        return responder(res, 429, { error: "Se enviaron demasiados reportes desde esta conexión. Inténtalo en una hora." });
      }

      let cuerpo;
      try { cuerpo = await leerCuerpo(req); }
      catch { return responder(res, 400, { error: "El reporte llegó incompleto. Inténtalo de nuevo." }); }

      const { reporte, faltan } = validar(cuerpo);
      if (faltan.length) {
        return responder(res, 400, { error: "Falta completar: " + faltan.join(", ") + "." });
      }

      const id = randomUUID();
      // Con MODERAR_REPORTES=si, los reportes esperan aprobación antes de salir en el mapa
      const visible = process.env.MODERAR_REPORTES !== "si";
      const guardado = { ...reporte, id, creado: new Date().toISOString(), visible };
      await redis("HSET", "reportes", id, JSON.stringify(guardado));
      return responder(res, 201, { id, visible });
    }

    res.setHeader("Allow", "GET, POST");
    return responder(res, 405, { error: "Método no permitido." });
  } catch (e) {
    console.error(e);
    return responder(res, 500, { error: "No se pudo guardar. Inténtalo de nuevo en unos minutos." });
  }
}
