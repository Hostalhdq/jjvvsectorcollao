/* Administración de reportes. Requiere la clave ADMIN_CLAVE (variable de Vercel)
   en el encabezado "x-clave-admin".
   GET:  todos los reportes con datos personales.
   POST: { id, visible } muestra u oculta un reporte en el mapa.
   DELETE: { id } borra un reporte para siempre, con sus fotos. */

import { del } from "@vercel/blob";
import { redis, redisVarios, hayBaseDeDatos, todosLosReportes, claveFotos, leerFotos } from "../lib/redis.js";
import { responder, leerCuerpo } from "../lib/http.js";
import { claveCorrecta } from "../lib/clave.js";

/* Agrega a cada reporte la lista de sus fotos (sin el enlace directo al archivo) */
async function conFotos(reportes) {
  const listas = await redisVarios(reportes.map((r) => ["LRANGE", claveFotos(r.id), 0, -1]));
  return reportes.map((r, i) => ({
    ...r,
    fotos: leerFotos(listas[i]).map(({ ruta, tipo, bytes, subida }) => ({ ruta, tipo, bytes, subida })),
  }));
}

export default async function handler(req, res) {
  if (!process.env.ADMIN_CLAVE) {
    return responder(res, 503, { error: "Falta configurar ADMIN_CLAVE en Vercel." });
  }
  if (!claveCorrecta(req.headers["x-clave-admin"])) {
    return responder(res, 401, { error: "Clave incorrecta." });
  }
  if (!hayBaseDeDatos()) {
    return responder(res, 503, { error: "La base de datos aún no está conectada." });
  }

  try {
    if (req.method === "GET") {
      return responder(res, 200, { reportes: await conFotos(await todosLosReportes()) });
    }

    if (req.method === "POST") {
      const { id, visible } = await leerCuerpo(req);
      const actual = await redis("HGET", "reportes", String(id || ""));
      if (!actual) return responder(res, 404, { error: "No existe ese reporte." });
      const reporte = { ...JSON.parse(actual), visible: visible === true };
      await redis("HSET", "reportes", reporte.id, JSON.stringify(reporte));
      return responder(res, 200, { ok: true, visible: reporte.visible });
    }

    if (req.method === "DELETE") {
      const { id } = await leerCuerpo(req);
      const borrados = await redis("HDEL", "reportes", String(id || ""));
      if (!borrados) return responder(res, 404, { error: "No existe ese reporte." });
      const fotos = leerFotos(await redis("LRANGE", claveFotos(String(id)), 0, -1));
      if (fotos.length && process.env.BLOB_READ_WRITE_TOKEN) {
        try { await del(fotos.map((f) => f.url)); } catch (e) { console.error(e); }
      }
      await redis("DEL", claveFotos(String(id)));
      return responder(res, 200, { ok: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return responder(res, 405, { error: "Método no permitido." });
  } catch (e) {
    console.error(e);
    return responder(res, 500, { error: "Error del servidor." });
  }
}
