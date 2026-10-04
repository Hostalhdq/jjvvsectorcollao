# Collao Unido · Coordinadora de Juntas de Vecinos de Collao

Sitio web de las 12 juntas de vecinos de Collao (Concepción) para resolver juntas el
problema de alcantarillado y aguas lluvias del sector. Meta: octubre 2026 a septiembre 2027.

Sitio en HTML, CSS y JavaScript simples, sin compilación: liviano, rápido en celulares
y gratis de publicar. Pensado primero para celular y con letra grande.

## Secciones

| Página | Archivo |
|---|---|
| Inicio (meta, botón "Reportar rebalse", contadores, novedades) | `index.html` |
| Reportar un rebalse (basado en la Ficha de Registro de Rebalse) | `reportar.html` |
| Mapa de puntos críticos (filtros por junta, fecha y tipo) | `mapa.html` |
| El problema (las dos redes y por qué una afecta a la otra) | `problema.html` |
| Historia 2001–2026 | `historia.html` |
| Compromisos y seguimiento | `compromisos.html` |
| Documentos | `documentos.html` |
| Las juntas | `juntas.html` |

## Cómo actualizar el contenido

Todo el contenido editable está en **`js/datos.js`**: juntas (presidente/a, contacto,
problemas), compromisos y su estado, documentos, cronología, novedades, puntos conocidos
del mapa, correo y WhatsApp de contacto.

- Estados de compromisos: `verificar`, `curso`, `cumplido`, `incumplido`.
- Para publicar un documento, súbelo a la carpeta `documentos/` y pon su ruta en `enlace`.
  De las notas de prensa, publicar un resumen propio y el enlace, no el escaneo completo.
- Las coordenadas de `PUNTOS_CONOCIDOS` son aproximadas: verificarlas.

## Foto de portada

La portada usa un fondo azul. Para poner una foto real del sector (por ejemplo una calle
anegada o una reunión de las juntas), guárdala como `img/portada.jpg`, de unos 1600 px de
ancho. El sitio la usa automáticamente, con un velo azul encima para que el texto se lea.

## Ver el sitio en tu computador

```
python3 -m http.server 8000
```
y abrir http://localhost:8000

## Publicar en Vercel

1. Entrar a vercel.com con la cuenta de GitHub e importar este repositorio.
2. Framework: "Other". Sin comando de build. Publicar.
3. Cuando se compre el dominio (por ejemplo `collaounido.cl` en nic.cl), agregarlo en
   Settings → Domains.

## Guardar los reportes (base de datos en Vercel)

Los reportes se guardan en una base de datos Upstash Redis conectada a Vercel
(plan gratuito). Las funciones del servidor están en `api/`:

- `api/reportes.js`: recibe los reportes y entrega al mapa solo fecha, junta, tipo
  y ubicación redondeada a la cuadra (~100 m). Nunca entrega nombre, teléfono ni dirección.
- `api/admin.js`: entrega los reportes completos, solo con la clave de administración.

**Conectar la base (una sola vez):**

1. En Vercel, entrar al proyecto → pestaña **Storage** → **Create Database** →
   elegir **Upstash for Redis** (plan gratis) → conectarla a este proyecto.
   Vercel crea solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
2. En **Settings → Environment Variables**, agregar `ADMIN_CLAVE` con una clave larga
   (mínimo 8 caracteres) que solo conozcan los administradores.
3. Opcional: agregar `MODERAR_REPORTES` = `si` para que cada reporte espere aprobación
   antes de aparecer en el mapa. Sin esa variable, aparecen de inmediato.
4. Ir a **Deployments** → en el último, menú ⋯ → **Redeploy**.

Mientras la base no esté conectada, o si el vecino no tiene señal, el reporte queda
guardado en su celular y se le ofrece enviarlo por WhatsApp o correo
(configurar `SITIO.whatsapp` y `SITIO.correo` en `js/datos.js`).

**Administración:** entrar a `/admin.html` (no aparece en el menú) con la `ADMIN_CLAVE`.
Ahí se ven los reportes con los datos de cada vecino, se filtran por junta, se ocultan o
muestran en el mapa, y se descarga la planilla CSV para el respaldo mensual.

## Privacidad

- El mapa público muestra la ubicación aproximada (cuadra), nunca la dirección ni el nombre.
- Nombre, teléfono y dirección quedan solo para los administradores.
- Cada reporte pide autorización explícita para usarlo ante autoridades y tribunales.
- Las fotos se revisan antes de publicarse, sin rostros ni patentes.

## Administración

- Un administrador general y un editor por junta (por ahora comparten la `ADMIN_CLAVE`; el panel filtra por junta).
- Compromisos y documentos se actualizan después de cada reunión de la mesa.
- Respaldo mensual de los reportes: botón "Descargar planilla" en `/admin.html`, porque son evidencia.

## Pendientes

- [ ] Nombre definitivo y dominio.
- [ ] Presidente/a y contacto de cada junta.
- [ ] Correo y WhatsApp de la Coordinadora.
- [ ] Subir los documentos (Plan Maestro, actas, fallo, notas, ficha, catastro).
- [ ] Conectar la base de datos en Vercel y definir `ADMIN_CLAVE`.
- [ ] Subida de fotos al sitio (por ejemplo con Vercel Blob).
- [ ] Calendario de reuniones.
