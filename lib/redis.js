/* Cliente mínimo para Upstash Redis (API REST), sin dependencias.
   Vercel crea las variables al conectar la base en Storage. */

function credenciales() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

export function hayBaseDeDatos() {
  const { url, token } = credenciales();
  return Boolean(url && token);
}

export async function redis(...comando) {
  const { url, token } = credenciales();
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(comando),
  });
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok || datos.error) throw new Error(`Redis: ${datos.error || resp.status}`);
  return datos.result;
}

/* Varios comandos en una sola llamada. Devuelve el resultado de cada uno. */
export async function redisVarios(comandos) {
  if (!comandos.length) return [];
  const { url, token } = credenciales();
  const resp = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(comandos),
  });
  const datos = await resp.json().catch(() => null);
  if (!resp.ok || !Array.isArray(datos)) throw new Error(`Redis: ${resp.status}`);
  return datos.map((d) => (d && !d.error ? d.result : null));
}

/* Fotos de un reporte: lista "fotos:<id>" con un JSON por foto */
export const claveFotos = (id) => `fotos:${id}`;

export function leerFotos(lista) {
  return (lista || []).map((t) => { try { return JSON.parse(t); } catch { return null; } }).filter(Boolean);
}

/* Todos los reportes guardados, como objetos */
export async function todosLosReportes() {
  const plano = (await redis("HGETALL", "reportes")) || [];
  const lista = [];
  for (let i = 1; i < plano.length; i += 2) {
    try { lista.push(JSON.parse(plano[i])); } catch { /* registro dañado */ }
  }
  return lista.sort((a, b) => (b.creado || "").localeCompare(a.creado || ""));
}
