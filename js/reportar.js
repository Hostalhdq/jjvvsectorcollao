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

// Fotos: se suben al sitio si el almacenamiento está conectado; si no, se piden después
const MAX_FOTOS = 6;
const MAX_BYTES_FOTO = 4 * 1024 * 1024;
let fotosEnLinea = false;
const avisoFotos = document.getElementById("aviso-fotos");

function avisoSinFotos() {
  avisoFotos.textContent = SITIO.whatsapp
    ? "Las fotos se envían por WhatsApp al terminar el reporte."
    : "Por ahora las fotos no se suben al sitio. Guárdalas: la directiva de tu junta te las pedirá.";
}
avisoSinFotos();

fetch("/api/fotos", { cache: "no-store" })
  .then((r) => (r.ok ? r.json() : {}))
  .then((d) => {
    fotosEnLinea = Boolean(d.disponible);
    if (fotosEnLinea) {
      avisoFotos.textContent = `Hasta ${MAX_FOTOS} fotos o videos cortos (máximo 4 MB cada video). Se guardan en privado: solo los ven los administradores.`;
    }
  })
  .catch(() => { /* sin conexión: se mantiene el aviso */ });

form.fotos.addEventListener("change", () => {
  const n = form.fotos.files.length;
  if (!fotosEnLinea || !n) return;
  avisoFotos.textContent = n > MAX_FOTOS
    ? `Elegiste ${n} archivos. Se subirán solo los primeros ${MAX_FOTOS}.`
    : `${n} archivo(s) listo(s) para subir.`;
});

/* Achica las fotos en el celular (máx. 1600 px, JPG) para que suban rápido con poca señal.
   También borra los datos ocultos de la foto (como la ubicación GPS). */
async function prepararFoto(archivo) {
  if (!archivo.type.startsWith("image/") || typeof createImageBitmap !== "function") return archivo;
  try {
    const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, 1600 / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    imagen.close?.();
    const jpg = await new Promise((ok) => lienzo.toBlob(ok, "image/jpeg", 0.82));
    return jpg || archivo;
  } catch {
    return archivo; // el navegador no pudo leerla: se intenta subir tal cual
  }
}

/* Sube los archivos uno por uno. Devuelve cuántos llegaron y cuáles no. */
async function subirFotos(idReporte, archivos, alAvanzar) {
  let subidas = 0;
  const fallidas = [];
  for (let i = 0; i < archivos.length; i++) {
    alAvanzar(i + 1, archivos.length);
    const archivo = await prepararFoto(archivos[i]);
    if (archivo.size > MAX_BYTES_FOTO) { fallidas.push(`${archivos[i].name} (pesa más de 4 MB)`); continue; }
    try {
      const resp = await fetch(`/api/fotos?reporte=${encodeURIComponent(idReporte)}`, {
        method: "POST",
        headers: { "Content-Type": archivo.type || "application/octet-stream" },
        body: archivo,
      });
      if (resp.ok) subidas++;
      else {
        const datos = await resp.json().catch(() => ({}));
        fallidas.push(`${archivos[i].name}${datos.error ? `: ${datos.error.replace(/\.$/, "")}` : ""}`);
      }
    } catch {
      fallidas.push(`${archivos[i].name} (sin conexión)`);
    }
  }
  return { subidas, fallidas };
}

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
    '<p class="ayuda">El mapa no se pudo cargar. Basta con la dirección.</p>';
}

function marcar(lat, lng) {
  posicion = { lat, lng };
  if (!mapa) return;
  if (marcador) marcador.setLatLng([lat, lng]);
  else marcador = L.marker([lat, lng]).addTo(mapa);
}

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

  // Fotos: se suben después de guardar el reporte, para que el reporte nunca se pierda por una foto
  const archivos = Array.from(form.fotos.files).slice(0, MAX_FOTOS);
  let fotos = null;
  if (resultado.remoto && resultado.id && fotosEnLinea && archivos.length) {
    fotos = await subirFotos(resultado.id, archivos, (i, total) => {
      boton.textContent = `Subiendo foto ${i} de ${total}…`;
    });
  }

  const texto = textoReporte(reporte);
  const detalle = document.getElementById("gracias-detalle");
  if (resultado.remoto) {
    let sobreFotos = "";
    if (fotos) {
      sobreFotos = ` Se subieron ${fotos.subidas} de ${archivos.length} foto(s) o video(s).`;
      if (fotos.fallidas.length) {
        sobreFotos += ` No se pudieron subir: ${fotos.fallidas.join("; ")}. Guárdalas: la directiva de tu junta te las pedirá.`;
      }
    } else if (archivos.length) {
      sobreFotos = SITIO.whatsapp
        ? " Si tienes fotos o video, envíalos por WhatsApp con el botón de abajo."
        : " Guarda tus fotos o video: la directiva de tu junta te los pedirá.";
    }
    detalle.textContent = (resultado.visible
      ? "Ya aparece en el mapa y en los contadores."
      : "Los administradores lo revisarán y luego aparecerá en el mapa.")
      + sobreFotos;
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
