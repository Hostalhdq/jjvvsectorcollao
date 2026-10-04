/* Código compartido por todas las páginas: menú, pie, reportes y contadores. */

const PAGINAS = [
  { archivo: "index.html", titulo: "Inicio" },
  { archivo: "reportar.html", titulo: "Reportar rebalse" },
  { archivo: "mapa.html", titulo: "Mapa" },
  { archivo: "problema.html", titulo: "El problema" },
  { archivo: "historia.html", titulo: "Historia" },
  { archivo: "compromisos.html", titulo: "Compromisos" },
  { archivo: "documentos.html", titulo: "Documentos" },
  { archivo: "juntas.html", titulo: "Las juntas" },
];

function escaparHTML(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function paginaActual() {
  const ruta = location.pathname.split("/").pop();
  return ruta === "" ? "index.html" : ruta;
}

/* Íconos de línea (estilo institucional, sin emojis) */
const ICONOS = {
  logo: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#0a56a8"/><path d="M24 8c-6 8-11 13.5-11 19.5a11 11 0 0 0 22 0C35 21.5 30 16 24 8z" fill="#fff"/><path d="M13.6 31c3.6-2.4 7.2 2.4 10.4 0s6.8-2.4 10.4 0" fill="none" stroke="#089ae0" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  ubicacion: `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
  telefono: `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>`,
  correo: `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  grupo: `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5A5 5 0 0 1 21 19"/></svg>`,
  alerta: `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>`,
  candado: `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
  menu: `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  cerrar: `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
};

function pintarEncabezado() {
  const actual = paginaActual();
  const enlaces = PAGINAS.map((p) =>
    `<li><a href="${p.archivo}"${p.archivo === actual ? ' aria-current="page"' : ""}>${p.titulo}</a></li>`
  ).join("");

  const contacto = [
    SITIO.whatsapp ? `<a href="https://wa.me/${escaparHTML(SITIO.whatsapp)}">${ICONOS.telefono} +${escaparHTML(SITIO.whatsapp)}</a>` : "",
    SITIO.correo ? `<a href="mailto:${escaparHTML(SITIO.correo)}">${ICONOS.correo} ${escaparHTML(SITIO.correo)}</a>` : "",
    `<span>${ICONOS.ubicacion} Collao, Concepción</span>`,
    `<span>${ICONOS.grupo} ${JUNTAS.length} juntas de vecinos</span>`,
  ].filter(Boolean).join("");

  const encabezado = document.getElementById("encabezado");
  if (!encabezado) return;
  encabezado.className = "encabezado";
  encabezado.innerHTML = `
    <a class="saltar" href="#contenido">Saltar al contenido</a>
    <div class="contenedor barra-superior">
      <div class="zona-marca">
        <a class="marca" href="index.html" aria-label="Inicio, ${escaparHTML(SITIO.nombre)}">
          ${ICONOS.logo}
          <span><strong>Collao Unido</strong><small>Coordinadora de Juntas de Vecinos de Collao</small></span>
        </a>
        <div class="datos-contacto"><span class="separador" aria-hidden="true"></span>${contacto}</div>
      </div>
      <div class="acciones-encabezado">
        <a class="boton boton-rebalse boton-reportar-mini" href="reportar.html" style="min-height:44px;padding:8px 18px;font-size:.9rem">${ICONOS.alerta} Reportar rebalse</a>
        <button class="boton-menu" aria-expanded="false" aria-controls="menu">${ICONOS.menu} Menú</button>
      </div>
    </div>
    <nav id="menu" class="menu" aria-label="Menú principal"><div class="contenedor"><ul>${enlaces}</ul></div></nav>`;

  const boton = encabezado.querySelector(".boton-menu");
  const menu = encabezado.querySelector(".menu");
  boton.addEventListener("click", () => {
    const abierto = menu.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", abierto);
    boton.innerHTML = abierto ? `${ICONOS.cerrar} Cerrar` : `${ICONOS.menu} Menú`;
  });

  // Miga de pan en las páginas interiores
  const titulo = document.querySelector(".titulo-pagina .contenedor");
  const pagina = PAGINAS.find((p) => p.archivo === actual);
  if (titulo && pagina && actual !== "index.html") {
    titulo.insertAdjacentHTML("afterbegin",
      `<nav class="miga" aria-label="Estás en"><a href="index.html">Inicio</a> › ${escaparHTML(pagina.titulo)}</nav>`);
  }
}

function pintarPie() {
  const pie = document.getElementById("pie");
  if (!pie) return;
  pie.className = "pie";
  const contacto = [
    SITIO.correo ? `<li>${ICONOS.correo} <a href="mailto:${escaparHTML(SITIO.correo)}">${escaparHTML(SITIO.correo)}</a></li>` : "",
    SITIO.whatsapp ? `<li>${ICONOS.telefono} <a href="https://wa.me/${escaparHTML(SITIO.whatsapp)}">+${escaparHTML(SITIO.whatsapp)}</a></li>` : "",
    `<li>${ICONOS.ubicacion} Sector Collao, Concepción, Región del Biobío</li>`,
  ].join("");
  pie.innerHTML = `
    <div class="contenedor">
      <div class="pie-grilla">
        <div>
          <div class="marca-pie">${ICONOS.logo} Collao Unido</div>
          <p>${escaparHTML(SITIO.nombre)}. Las ${JUNTAS.length} juntas de vecinos de Collao, trabajando juntas por un alcantarillado y una red de aguas lluvias que funcionen.</p>
          <ul>${contacto}</ul>
        </div>
        <div>
          <h2>Secciones</h2>
          <ul>${PAGINAS.map((p) => `<li><a href="${p.archivo}">${p.titulo}</a></li>`).join("")}</ul>
        </div>
        <div>
          <h2>Juntas participantes</h2>
          <ul>${JUNTAS.map((j) => `<li><a href="juntas.html#${j.id}">${escaparHTML(j.nombre)}</a></li>`).join("")}</ul>
        </div>
      </div>
      <p class="pie-final">${escaparHTML(SITIO.nombre)} · Sitio ciudadano, sin vínculo con Essbio ni con organismos del Estado.</p>
    </div>`;
}

function nombreJunta(id) {
  const junta = JUNTAS.find((j) => j.id === id);
  return junta ? junta.nombre : id;
}

function opcionesJuntas(select, conTodas) {
  select.innerHTML = (conTodas ? '<option value="">Todas las juntas</option>' : '<option value="">Elige tu junta…</option>')
    + JUNTAS.map((j) => `<option value="${j.id}">${escaparHTML(j.nombre)}</option>`).join("");
}

/* ---------- Almacenamiento de reportes ----------
   Los reportes se envían a /api/reportes (función de Vercel con base de datos
   Upstash Redis). El servidor guarda el reporte completo y solo entrega al
   público fecha, junta, tipo y ubicación redondeada a la cuadra.
   Si no hay conexión o la base aún no está conectada, el reporte queda
   guardado en este celular y se ofrece enviarlo por WhatsApp o correo. */

const CLAVE_LOCAL = "collao_reportes";

function leerLocal() {
  try { return JSON.parse(localStorage.getItem(CLAVE_LOCAL)) || []; }
  catch { return []; }
}

/* Redondea a ~100 m para no mostrar la dirección exacta */
function aCuadra(valor) {
  return valor == null ? null : Math.round(valor * 1000) / 1000;
}

function versionPublica(r) {
  return {
    fecha: r.fecha, junta: r.junta, tipo: r.tipo, red: r.red, llovia: r.llovia,
    lat: aCuadra(r.lat), lng: aCuadra(r.lng),
  };
}

async function guardarReporte(reporte) {
  let resp = null;
  try {
    resp = await fetch("/api/reportes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reporte),
    });
  } catch { /* sin conexión: se guarda en el celular */ }

  if (resp) {
    const datos = await resp.json().catch(() => ({}));
    if (resp.ok) return { remoto: true, id: datos.id, visible: datos.visible };
    // Datos rechazados o demasiados envíos: se muestra el motivo al vecino
    if (resp.status === 400 || resp.status === 429) throw new Error(datos.error || "No se pudo enviar el reporte.");
  }

  const lista = leerLocal();
  const id = "local-" + Date.now();
  lista.push({ ...reporte, id });
  try { localStorage.setItem(CLAVE_LOCAL, JSON.stringify(lista)); } catch { /* sin almacenamiento */ }
  return { remoto: false, id };
}

async function reportesPublicos() {
  try {
    const resp = await fetch("/api/reportes", { cache: "no-store" });
    if (resp.ok) return (await resp.json()).reportes;
  } catch { /* sin conexión */ }
  return leerLocal().map(versionPublica);
}

function tipoRed(tipo) {
  return tipo === "sumidero" || tipo === "calle-anegada" ? "aguas-lluvias" : "alcantarillado";
}

const NOMBRES_TIPO = {
  "camara-publica": "Cámara pública",
  "camara-domiciliaria": "Cámara domiciliaria",
  "sumidero": "Sumidero",
  "calle-anegada": "Calle anegada",
};

async function pintarContadores() {
  const caja = document.getElementById("contadores");
  if (!caja) return;
  const reportes = await reportesPublicos().catch(() => []);
  const sinLluvia = reportes.filter((r) => r.llovia === "no").length;
  const cumplidos = COMPROMISOS.filter((c) => c.estado === "cumplido").length;
  const pendientes = COMPROMISOS.length - cumplidos;
  caja.innerHTML = `
    <div class="tarjeta contador"><span class="numero">${reportes.length}</span><span class="etiqueta">rebalses reportados</span></div>
    <div class="tarjeta contador rojo"><span class="numero">${sinLluvia}</span><span class="etiqueta">rebalses sin lluvia</span></div>
    <div class="tarjeta contador verde"><span class="numero">${cumplidos}</span><span class="etiqueta">compromisos cumplidos</span></div>
    <div class="tarjeta contador rojo"><span class="numero">${pendientes}</span><span class="etiqueta">compromisos pendientes</span></div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  pintarEncabezado();
  pintarPie();
  pintarContadores();
});
