/* Panel de administración: revisar, ocultar/mostrar y respaldar reportes. */

const LLUVIA = { no: "No (seco)", poco: "Poco", mucho: "Fuerte" };
let clave = "";
let reportes = [];

try { clave = sessionStorage.getItem("collao_clave") || ""; } catch { /* sin almacenamiento */ }
opcionesJuntas(document.getElementById("f-junta"), true);

function mostrarMensaje(texto) {
  const caja = document.getElementById("mensaje");
  caja.textContent = texto;
  caja.classList.toggle("oculto", !texto);
}

async function llamar(metodo, cuerpo) {
  const resp = await fetch("/api/admin", {
    method: metodo,
    headers: { "x-clave-admin": clave, "Content-Type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    cache: "no-store",
  });
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(datos.error || "Error del servidor.");
  return datos;
}

async function cargar() {
  try {
    reportes = (await llamar("GET")).reportes;
  } catch (e) {
    mostrarMensaje(e.message);
    document.getElementById("panel").classList.add("oculto");
    document.getElementById("ingreso").classList.remove("oculto");
    return;
  }
  try { sessionStorage.setItem("collao_clave", clave); } catch { /* sin almacenamiento */ }
  mostrarMensaje("");
  document.getElementById("ingreso").classList.add("oculto");
  document.getElementById("panel").classList.remove("oculto");
  pintar();
}

function filtrados() {
  const junta = document.getElementById("f-junta").value;
  const visible = document.getElementById("f-visible").value;
  return reportes.filter((r) =>
    (!junta || r.junta === junta) && (!visible || (visible === "si") === Boolean(r.visible))
  );
}

/* Fotos: los archivos son privados, así que se piden con la clave y se muestran desde la memoria */
const fotosCargadas = new Map(); // ruta → dirección temporal (blob:)

function celdaFotos(r) {
  const fotos = r.fotos || [];
  const porPedir = Math.max(0, (r.cantidadFotos || 0) - fotos.length);
  const miniaturas = fotos.map((f, i) => `
    <a class="foto-reporte" data-ruta="${escaparHTML(f.ruta)}" data-tipo="${escaparHTML(f.tipo)}" target="_blank" rel="noopener"
       style="display:inline-block;width:72px;height:72px;margin:4px 4px 0 0;border-radius:6px;overflow:hidden;background:#e5e7eb;vertical-align:top;text-align:center;font-size:.75rem;line-height:72px;color:#374151"
       title="Abrir ${f.tipo.startsWith("video/") ? "video" : "foto"} ${i + 1}">${f.tipo.startsWith("video/") ? "▶ Video" : "Cargando…"}</a>`).join("");
  return (fotos.length ? `<div>${miniaturas}</div>` : "")
    + (porPedir ? `<br><em>${porPedir} foto(s)/video(s) por pedir</em>` : "");
}

async function cargarFotos() {
  for (const enlace of document.querySelectorAll("#tabla a.foto-reporte")) {
    const ruta = enlace.dataset.ruta;
    try {
      let direccion = fotosCargadas.get(ruta);
      if (!direccion) {
        const resp = await fetch(`/api/fotos?ruta=${encodeURIComponent(ruta)}`, { headers: { "x-clave-admin": clave }, cache: "no-store" });
        if (!resp.ok) throw new Error();
        direccion = URL.createObjectURL(await resp.blob());
        fotosCargadas.set(ruta, direccion);
      }
      if (!enlace.isConnected) continue;
      enlace.href = direccion;
      enlace.download = ruta.split("/").pop();
      if (enlace.dataset.tipo.startsWith("image/")) {
        enlace.innerHTML = `<img src="${direccion}" alt="Foto del reporte" style="width:100%;height:100%;object-fit:cover">`;
      }
    } catch {
      enlace.textContent = "No cargó";
    }
  }
}

function pintar() {
  const lista = filtrados();
  const secos = lista.filter((r) => r.llovia === "no").length;
  document.getElementById("resumen").textContent =
    `${lista.length} reporte(s), ${secos} sin lluvia. Total en la base: ${reportes.length}.`;

  document.getElementById("tabla").innerHTML = lista.length ? lista.map((r) => `
    <tr>
      <td data-etiqueta="Fecha">${escaparHTML((r.fecha || "").replace("T", " "))}</td>
      <td data-etiqueta="Junta">${escaparHTML(nombreJunta(r.junta))}</td>
      <td data-etiqueta="Tipo">${escaparHTML(NOMBRES_TIPO[r.tipo] || r.tipo)}</td>
      <td data-etiqueta="¿Llovía?">${escaparHTML(LLUVIA[r.llovia] || r.llovia)}</td>
      <td data-etiqueta="Dirección">${escaparHTML(r.direccion)}</td>
      <td data-etiqueta="Vecino/a">${escaparHTML(r.nombre)}${r.telefono ? `<br>${escaparHTML(r.telefono)}` : ""}</td>
      <td data-etiqueta="Reclamo Essbio">${r.reclamo === "si" ? "Sí " + escaparHTML(r.numeroReclamo) : "No"}</td>
      <td data-etiqueta="Daños">${escaparHTML(r.danos)}${celdaFotos(r)}</td>
      <td data-etiqueta="Mapa">
        <button class="boton boton-secundario" style="min-height:44px;padding:8px 12px;font-size:.9rem" data-id="${escaparHTML(r.id)}" data-visible="${r.visible ? "no" : "si"}">
          ${r.visible ? "Ocultar" : "Mostrar"}
        </button>
        <button class="boton boton-secundario" style="min-height:44px;padding:8px 12px;font-size:.9rem;color:var(--rojo);border-color:var(--rojo)" data-borrar="${escaparHTML(r.id)}">
          Borrar
        </button>
      </td>
    </tr>`).join("")
    : `<tr><td colspan="9">No hay reportes con estos filtros.</td></tr>`;
  cargarFotos();
}

document.getElementById("tabla").addEventListener("click", async (e) => {
  const borrar = e.target.closest("button[data-borrar]");
  if (borrar) {
    const r = reportes.find((x) => x.id === borrar.dataset.borrar);
    const resumen = `${(r.fecha || "").replace("T", " ")} · ${nombreJunta(r.junta)} · ${r.direccion}`;
    if (!confirm(`¿Borrar para siempre este reporte?\n\n${resumen}\n\nNo se puede deshacer. Si solo quieres sacarlo del mapa, usa "Ocultar".`)) return;
    borrar.disabled = true;
    try {
      await llamar("DELETE", { id: r.id });
      reportes = reportes.filter((x) => x.id !== r.id);
      pintar();
    } catch (err) {
      mostrarMensaje(err.message);
      borrar.disabled = false;
    }
    return;
  }

  const boton = e.target.closest("button[data-id]");
  if (!boton) return;
  boton.disabled = true;
  try {
    const visible = boton.dataset.visible === "si";
    await llamar("POST", { id: boton.dataset.id, visible });
    reportes.find((r) => r.id === boton.dataset.id).visible = visible;
    pintar();
  } catch (err) {
    mostrarMensaje(err.message);
    boton.disabled = false;
  }
});

/* Planilla CSV para el respaldo mensual (se abre en Excel o Google Sheets) */
function descargarCSV() {
  const columnas = ["id", "creado", "fecha", "junta", "direccion", "lat", "lng", "tipo", "red", "llovia",
    "danos", "reclamo", "numeroReclamo", "nombre", "telefono", "cantidadFotos", "fotosSubidas", "autoriza", "visible"];
  const celda = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const valor = (r, c) => (c === "junta" ? nombreJunta(r[c]) : c === "fotosSubidas" ? (r.fotos || []).length : r[c]);
  const filas = reportes.map((r) => columnas.map((c) => celda(valor(r, c))).join(";"));
  const csv = "﻿" + [columnas.join(";"), ...filas].join("\r\n");
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  enlace.download = `reportes-collao-${new Date().toISOString().slice(0, 10)}.csv`;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}

document.getElementById("ingreso").addEventListener("submit", (e) => {
  e.preventDefault();
  clave = document.getElementById("clave").value;
  cargar();
});
document.getElementById("f-junta").addEventListener("change", pintar);
document.getElementById("f-visible").addEventListener("change", pintar);
document.getElementById("recargar").addEventListener("click", cargar);
document.getElementById("csv").addEventListener("click", descargarCSV);

if (clave) cargar();
