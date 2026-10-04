/* Administración de reportes. Requiere la clave ADMIN_CLAVE (variable de Vercel)
   en el encabezado "x-clave-admin".
   GET:  todos los reportes con datos personales.
   POST: { id, visible } muestra u oculta un reporte en el mapa. */

import { timingSafeEqual, createHash } from "node:crypto";
import { redis, hayBaseDeDatos, todosLosReportes } from "../lib/redis.js";
import { responder, leerCuerpo } from "../lib/http.js";

function claveCorrecta(recibida) {
  const real = process.env.ADMIN_CLAVE;
  if (!real || real.length < 8 || !recibida) return false;
  const a = createHash("sha256").update(String(recibida)).digest();
  const b = createHash("sha256").update(real).digest();
  return timingSafeEqual(a, b);
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
      return responder(res, 200, { reportes: await todosLosReportes() });
    }

    if (req.method === "POST") {
      const { id, visible } = await leerCuerpo(req);
      const actual = await redis("HGET", "reportes", String(id || ""));
      if (!actual) return responder(res, 404, { error: "No existe ese reporte." });
      const reporte = { ...JSON.parse(actual), visible: visible === true };
      await redis("HSET", "reportes", reporte.id, JSON.stringify(reporte));
      return responder(res, 200, { ok: true, visible: reporte.visible });
    }

    res.setHeader("Allow", "GET, POST");
    return responder(res, 405, { error: "Método no permitido." });
  } catch (e) {
    console.error(e);
    return responder(res, 500, { error: "Error del servidor." });
  }
}
