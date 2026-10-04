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

function pintarEncabezado() {
  const actual = paginaActual();
  const enlaces = PAGINAS.map((p) =>
    `<li><a href="${p.archivo}"${p.archivo === actual ? ' aria-current="page"' : ""}>${p.titulo}</a></li>`
  ).join("");

  const encabezado = document.getElementById("encabezado");
  if (!encabezado) return;
  encabezado.className = "encabezado";
  encabezado.innerHTML = `
    <a class="saltar" href="#contenido">Saltar al contenido</a>
    <div class="contenedor">
      <a class="marca" href="index.html">Collao Unido<small>12 juntas de vecinos, una sola voz</small></a>
      <button class="boton-menu" aria-expanded="false" aria-controls="menu">Menú ☰</button>
      <nav id="menu" class="menu" aria-label="Menú principal"><ul>${enlaces}</ul></nav>
    </div>`;

  const boton = encabezado.querySelector(".boton-menu");
  const menu = encabezado.querySelector(".menu");
  boton.addEventListener("click", () => {
    const abierto = menu.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", abierto);
    boton.textContent = abierto ? "Cerrar ✕" : "Menú ☰";
  });
}

function pintarPie() {
  const pie = document.getElementById("pie");
  if (!pie) return;
  pie.className = "pie";
  const contacto = [
    SITIO.correo ? `Correo: <a href="mailto:${escaparHTML(SITIO.correo)}">${escaparHTML(SITIO.correo)}</a>` : "",
    SITIO.whatsapp ? `WhatsApp: <a href="https://wa.me/${escaparHTML(SITIO.whatsapp)}">+${escaparHTML(SITIO.whatsapp)}</a>` : "",
  ].filter(Boolean).join("<br>");
  pie.innerHTML = `
    <div class="contenedor grilla grilla-2">
      <div>
        <strong>${escaparHTML(SITIO.nombre)}</strong>
        <p>Las 12 juntas de vecinos de Collao, Concepción, trabajando juntas por un alcantarillado y una red de aguas lluvias que funcionen.</p>
        ${contacto ? `<p>${contacto}</p>` : ""}
      </div>
      <div>
        <strong>Juntas participantes</strong>
        <ul>${JUNTAS.map((j) => `<li>${escaparHTML(j.nombre)}</li>`).join("")}</ul>
      </div>
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
