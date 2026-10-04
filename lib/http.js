export function responder(res, estado, cuerpo) {
  res.statusCode = estado;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(cuerpo));
}

export async function leerCuerpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  let texto = "";
  for await (const parte of req) {
    texto += parte;
    if (texto.length > 20000) throw new Error("demasiado grande");
  }
  return JSON.parse(texto || "{}");
}
