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

## Guardar los reportes (Firebase)

Mientras `FIREBASE_CONFIG` esté vacío en `js/datos.js`, el formulario funciona igual: guarda
el reporte en el celular del vecino y le ofrece enviarlo por WhatsApp o correo
(configurar `SITIO.whatsapp` y `SITIO.correo`).

Para guardarlos en línea y que aparezcan en el mapa y los contadores:

1. Crear un proyecto en console.firebase.google.com y activar **Firestore**.
2. Registrar una app web y copiar su configuración en `FIREBASE_CONFIG` en `js/datos.js`.
3. Publicar las reglas de `firestore.rules` (Firestore → Reglas).
4. Los reportes llegan a dos colecciones:
   - `reportes`: reporte completo con nombre, teléfono y dirección. Solo administradores.
   - `reportes_publicos`: sin datos personales y con la ubicación redondeada a la cuadra.
     Aparece en el mapa cuando un administrador cambia `aprobado` a `true`.

## Privacidad

- El mapa público muestra la ubicación aproximada (cuadra), nunca la dirección ni el nombre.
- Nombre, teléfono y dirección quedan solo para los administradores.
- Cada reporte pide autorización explícita para usarlo ante autoridades y tribunales.
- Las fotos se revisan antes de publicarse, sin rostros ni patentes.

## Administración

- Un administrador general y un editor por junta.
- Compromisos y documentos se actualizan después de cada reunión de la mesa.
- Respaldo mensual de los reportes en una planilla (Firestore → exportar), porque son evidencia.

## Pendientes

- [ ] Nombre definitivo y dominio.
- [ ] Presidente/a y contacto de cada junta.
- [ ] Correo y WhatsApp de la Coordinadora.
- [ ] Subir los documentos (Plan Maestro, actas, fallo, notas, ficha, catastro).
- [ ] Configurar Firebase y subida de fotos (Firebase Storage).
- [ ] Calendario de reuniones.
