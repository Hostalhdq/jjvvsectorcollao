/* Verificación de la clave de administración (variable ADMIN_CLAVE de Vercel),
   enviada en el encabezado "x-clave-admin". */

import { timingSafeEqual, createHash } from "node:crypto";

export function claveCorrecta(recibida) {
  const real = process.env.ADMIN_CLAVE;
  if (!real || real.length < 8 || !recibida) return false;
  const a = createHash("sha256").update(String(recibida)).digest();
  const b = createHash("sha256").update(real).digest();
  return timingSafeEqual(a, b);
}
