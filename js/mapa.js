/* Mapa de puntos críticos: puntos conocidos + reportes aprobados. */

const COLORES = { "alcantarillado": "#8e44ad", "aguas-lluvias": "#2980b9" };

if (typeof L === "undefined") {
  document.getElementById("mapa").outerHTML =
    '<p class="aviso">El mapa no se pudo cargar. Revisa tu conexión a internet y recarga la página.</p>';
  throw new Error("Leaflet no disponible");
}

const mapa = L.map("mapa").setView([CENTRO_MAPA.lat, CENTRO_MAPA.lng], CENTRO_MAPA.zoom);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
}).addTo(mapa);

const capa = L.layerGroup().addTo(mapa);
opcionesJuntas(document.getElementById("f-junta"), true);

let puntos = [];

async function cargar() {
  const conocidos = PUNTOS_CONOCIDOS.map((p) => ({ ...p, red: p.tipo, conocido: true }));
  const reportes = (await reportesPublicos().catch(() => [])).filter((r) => r.lat != null);
  puntos = conocidos.concat(reportes);
  pintar();
}

function pintar() {
  const junta = document.getElementById("f-junta").value;
  const red = document.getElementById("f-red").value;
  const desde = document.getElementById("f-desde").value;
  const hasta = document.getElementById("f-hasta").value;

  const visibles = puntos.filter((p) => {
    const dia = (p.fecha || "").slice(0, 10);
    return (!junta || p.junta === junta)
      && (!red || p.red === red)
      && (!desde || dia >= desde)
      && (!hasta || dia <= hasta);
  });

  capa.clearLayers();
  visibles.forEach((p) => {
    const color = COLORES[p.red] || "#555";
    const titulo = p.conocido ? p.titulo : NOMBRES_TIPO[p.tipo] || "Rebalse";
    const llovia = p.llovia ? `<br>¿Llovía?: ${{ no: "No", poco: "Poco", mucho: "Fuerte" }[p.llovia]}` : "";
    L.circleMarker([p.lat, p.lng], {
      radius: p.conocido ? 12 : 9, color, fillColor: color, fillOpacity: 0.6, weight: 2,
    }).bindPopup(
      `<strong>${escaparHTML(titulo)}</strong><br>${escaparHTML(nombreJunta(p.junta))}`
      + `<br>${escaparHTML((p.fecha || "").slice(0, 10))}${llovia}`
      + (p.detalle ? `<br>${escaparHTML(p.detalle)}` : "")
    ).addTo(capa);
  });

  const reportes = visibles.filter((p) => !p.conocido).length;
  document.getElementById("resumen-mapa").textContent =
    `Mostrando ${reportes} rebalse(s) reportado(s) y ${visibles.length - reportes} punto(s) conocido(s).`;
}

["f-junta", "f-red", "f-desde", "f-hasta"].forEach((id) =>
  document.getElementById(id).addEventListener("change", pintar)
);

cargar();
