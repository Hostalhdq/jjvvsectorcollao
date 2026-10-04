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

/* Todos los reportes guardados, como objetos */
export async function todosLosReportes() {
  const plano = (await redis("HGETALL", "reportes")) || [];
  const lista = [];
  for (let i = 1; i < plano.length; i += 2) {
    try { lista.push(JSON.parse(plano[i])); } catch { /* registro dañado */ }
  }
  return lista.sort((a, b) => (b.creado || "").localeCompare(a.creado || ""));
}
