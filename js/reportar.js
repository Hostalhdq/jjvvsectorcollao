/* Formulario de reporte de rebalse (basado en la Ficha de Registro de Rebalse). */

const form = document.getElementById("formulario");
const selectJunta = document.getElementById("junta");
opcionesJuntas(selectJunta, false);

// Fecha y hora actuales por defecto
const ahora = new Date();
ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
document.getElementById("fecha").value = ahora.toISOString().slice(0, 16);

// Número de reclamo solo si reclamó
form.querySelectorAll('input[name="reclamo"]').forEach((r) =>
  r.addEventListener("change", () => {
    document.getElementById("campo-reclamo").classList.toggle("oculto", form.reclamo.value !== "si");
  })
);

// Aviso sobre fotos mientras no exista almacenamiento en línea
document.getElementById("aviso-fotos").textContent = SITIO.whatsapp
  ? "Las fotos se envían por WhatsApp al terminar el reporte."
  : "Por ahora las fotos no se suben al sitio. Guárdalas: la directiva de tu junta te las pedirá.";

// Mapa para marcar el punto. Si el mapa no carga (mala señal), el formulario sigue funcionando.
let marcador = null;
let posicion = null;
let mapa = null;
if (typeof L !== "undefined") {
  mapa = L.map("mapa-reporte").setView([CENTRO_MAPA.lat, CENTRO_MAPA.lng], CENTRO_MAPA.zoom);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(mapa);
  mapa.on("click", (e) => marcar(e.latlng.lat, e.latlng.lng));
} else {
  document.getElementById("mapa-reporte").outerHTML =
    '<p class="ayuda">El mapa no se pudo cargar. Usa el botón de ubicación o basta con la dirección.</p>';
}

function marcar(lat, lng) {
  posicion = { lat, lng };
  if (!mapa) return;
  if (marcador) marcador.setLatLng([lat, lng]);
  else marcador = L.marker([lat, lng]).addTo(mapa);
}

document.getElementById("mi-ubicacion").addEventListener("click", () => {
  if (!navigator.geolocation) return alert("Tu teléfono no permite compartir la ubicación. Toca el mapa para marcar el punto.");
  navigator.geolocation.getCurrentPosition(
    (p) => {
      marcar(p.coords.latitude, p.coords.longitude);
      if (mapa) mapa.setView([p.coords.latitude, p.coords.longitude], 17);
      else alert("Ubicación guardada.");
    },
    () => alert("No pudimos obtener tu ubicación. Toca el mapa para marcar el punto."),
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

function validar() {
  const errores = [];
  if (!form.fecha.value) errores.push("la fecha y hora");
  if (!form.junta.value) errores.push("tu junta de vecinos");
  if (!form.direccion.value.trim()) errores.push("la dirección o punto de referencia");
  if (!form.tipo.value) errores.push("qué rebalsó");
  if (!form.llovia.value) errores.push("si llovía ese día");
  if (!form.nombre.value.trim()) errores.push("tu nombre");
  if (!form.autoriza.checked) errores.push("la autorización");
  return errores;
}

function textoReporte(r) {
  const llovia = { no: "No, estaba seco", poco: "Llovía poco", mucho: "Llovía fuerte" }[r.llovia];
  return [
    "REPORTE DE REBALSE · Unión de Juntas de Vecinos del Sector Collao",
    `Fecha: ${r.fecha.replace("T", " ")}`,
    `Junta: ${nombreJunta(r.junta)}`,
    `Dirección: ${r.direccion}`,
    r.lat != null ? `Mapa: https://www.openstreetmap.org/?mlat=${r.lat.toFixed(6)}&mlon=${r.lng.toFixed(6)}#map=18/${r.lat.toFixed(6)}/${r.lng.toFixed(6)}` : "",
    `Tipo: ${NOMBRES_TIPO[r.tipo]}`,
    `¿Llovía?: ${llovia}`,
    r.danos ? `Daños: ${r.danos}` : "",
    `Reclamo a Essbio: ${r.reclamo === "si" ? "Sí, N° " + (r.numeroReclamo || "(sin número)") : "No"}`,
    `Nombre: ${r.nombre}`,
    r.telefono ? `Teléfono: ${r.telefono}` : "",
    `Fotos/videos: ${r.cantidadFotos}`,
    "Autoriza uso ante autoridades: Sí",
  ].filter(Boolean).join("\n");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const caja = document.getElementById("errores");
  const errores = validar();
  if (errores.length) {
    caja.textContent = "Falta completar: " + errores.join(", ") + ".";
    caja.classList.remove("oculto");
    caja.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  caja.classList.add("oculto");

  const reporte = {
    fecha: form.fecha.value,
    junta: form.junta.value,
    direccion: form.direccion.value.trim(),
    lat: posicion ? posicion.lat : null,
    lng: posicion ? posicion.lng : null,
    tipo: form.tipo.value,
    red: tipoRed(form.tipo.value),
    llovia: form.llovia.value,
    danos: form.danos.value.trim(),
    reclamo: form.reclamo.value,
    numeroReclamo: form.numeroReclamo.value.trim(),
    nombre: form.nombre.value.trim(),
    telefono: form.telefono.value.trim(),
    cantidadFotos: form.fotos.files.length,
    autoriza: true,
  };

  const boton = form.querySelector('button[type="submit"]');
  boton.disabled = true;
  boton.textContent = "Enviando…";

  let resultado;
  try {
    resultado = await guardarReporte(reporte);
  } catch (error) {
    boton.disabled = false;
    boton.textContent = "Enviar reporte";
    caja.textContent = error.message;
    caja.classList.remove("oculto");
    return;
  }

  const texto = textoReporte(reporte);
  const detalle = document.getElementById("gracias-detalle");
  if (resultado.remoto) {
    detalle.textContent = (resultado.visible
      ? "Ya aparece en el mapa y en los contadores."
      : "Los administradores lo revisarán y luego aparecerá en el mapa.")
      + (SITIO.whatsapp ? " Si tienes fotos o video, envíalos por WhatsApp con el botón de abajo." : "");
  } else {
    detalle.textContent = "No pudimos conectarnos con el servidor, así que el reporte quedó guardado solo en este teléfono. Para que llegue a la Unión de Juntas de Vecinos, envíalo con uno de estos botones y adjunta tus fotos o video.";
  }

  if (SITIO.whatsapp) {
    const wa = document.getElementById("enviar-whatsapp");
    wa.href = `https://wa.me/${SITIO.whatsapp}?text=${encodeURIComponent(texto)}`;
    wa.classList.remove("oculto");
  }
  if (SITIO.correo) {
    const correo = document.getElementById("enviar-correo");
    correo.href = `mailto:${SITIO.correo}?subject=${encodeURIComponent("Reporte de rebalse")}&body=${encodeURIComponent(texto)}`;
    correo.classList.remove("oculto");
  }

  if (!resultado.remoto && !SITIO.whatsapp && !SITIO.correo) {
    detalle.textContent = "No pudimos conectarnos con el servidor. Copia este texto y envíalo a la directiva de tu junta, junto con tus fotos o video.";
    const pre = document.getElementById("texto-reporte");
    pre.textContent = texto;
    pre.classList.remove("oculto");
  }

  form.classList.add("oculto");
  const gracias = document.getElementById("gracias");
  gracias.classList.remove("oculto");
  gracias.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
