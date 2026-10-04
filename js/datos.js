/*
 * DATOS DEL SITIO
 * ----------------
 * Este es el único archivo que hay que editar para actualizar juntas,
 * compromisos, documentos, cronología, novedades y puntos del mapa.
 * Después de cada reunión de la mesa, actualizar "compromisos" y "novedades".
 */

const SITIO = {
  nombre: "Coordinadora de Juntas de Vecinos de Collao",
  nombreCorto: "Collao Unido",
  habitantes: "cerca de 35 mil",
  meta: "Resolver el problema de alcantarillado y aguas lluvias de Collao en 12 meses: octubre 2026 a septiembre 2027.",
  correo: "", // PENDIENTE: correo de contacto de la coordinadora
  whatsapp: "", // PENDIENTE: número de WhatsApp en formato 569XXXXXXXX
};

/* Centro aproximado del sector Collao, Concepción */
const CENTRO_MAPA = { lat: -36.8195, lng: -73.0155, zoom: 15 };

const JUNTAS = [
  { id: "collao-norte", nombre: "Collao Norte", presidente: "David Quiero", contacto: "", problemas: [] },
  { id: "estero-nonguen", nombre: "Estero Nonguén", presidente: "", contacto: "", problemas: [] },
  { id: "ignacio-collao", nombre: "Ignacio Collao", presidente: "", contacto: "", problemas: ["Rebalses de cámaras (nota El Sur, 2022)"] },
  { id: "jardines-de-collao", nombre: "Jardines de Collao", presidente: "", contacto: "", problemas: [] },
  { id: "lagos-de-chile", nombre: "Lagos de Chile", presidente: "", contacto: "", problemas: [] },
  { id: "parque-residencial-collao", nombre: "Parque Residencial Collao", presidente: "", contacto: "", problemas: ["Rebalses frente a la UBB (nota El Sur, 2022)"] },
  { id: "parque-residencial-los-fresnos", nombre: "Parque Residencial Los Fresnos", presidente: "", contacto: "", problemas: ["Afectada por rebalses (nota El Sur, 2022)"] },
  { id: "plaza-acevedo", nombre: "Plaza Acevedo", presidente: "", contacto: "", problemas: [] },
  { id: "protejamos-los-lirios", nombre: "Protejamos los Lirios", presidente: "", contacto: "", problemas: ["Advertencia de capacidad de la red por proyecto de 452 departamentos (2023)"] },
  { id: "puertas-del-mar", nombre: "Puertas del Mar", presidente: "", contacto: "", problemas: [] },
  { id: "vegas-de-nonguen", nombre: "Vegas de Nonguén", presidente: "", contacto: "", problemas: [] },
  { id: "villa-huascar", nombre: "Villa Huáscar", presidente: "", contacto: "", problemas: ["Colector de aguas lluvias obstruido (2025–2026)"] },
];

/* Estados posibles: "verificar", "curso", "cumplido", "incumplido" */
const COMPROMISOS = [
  {
    compromiso: "Cambiar 1.000 m de cañerías entre Los Lirios y Nonguén",
    institucion: "Essbio",
    fecha: "Noviembre 2022",
    plazo: "Con reconstrucción de calle",
    estado: "verificar",
    textoEstado: "Por verificar",
  },
  {
    compromiso: "Cambiar redes frente a Terrazas de Collao",
    institucion: "Essbio",
    fecha: "Septiembre 2022",
    plazo: "Sin plazo",
    estado: "verificar",
    textoEstado: "Por verificar",
  },
  {
    compromiso: "Entregar el resultado de la campaña de humo",
    institucion: "Essbio",
    fecha: "Septiembre 2022",
    plazo: "Sin plazo",
    estado: "verificar",
    textoEstado: "Por verificar",
  },
  {
    compromiso: "Obras de aguas lluvias en Collao (sistemas 24, 31 y 33)",
    institucion: "DOH",
    fecha: "Plan Maestro 2001",
    plazo: "2002–2003",
    estado: "incumplido",
    textoEstado: "Sin evidencia de ejecución",
  },
];

/* Biblioteca de documentos. "enlace" vacío = documento aún no subido.
   Notas de prensa: publicar resumen propio + enlace a la fuente, no el escaneo completo. */
const DOCUMENTOS = [
  { titulo: "Plan Maestro de Aguas Lluvias de Concepción (PM-04)", anio: "2001", categoria: "Estudios oficiales", aporta: "Diagnóstico oficial de Collao y obras de prioridad alta", enlace: "" },
  { titulo: "Fallo por la inundación de Collao", anio: "2006 (fallo 2015 y Corte Suprema)", categoria: "Fallos judiciales", aporta: "El Estado fue condenado por no ejecutar el plan de aguas lluvias", enlace: "" },
  { titulo: "Nota El Sur: refuerzo del muro del estero Nonguén", anio: "2017", categoria: "Prensa", aporta: "Obra de estabilidad, no de capacidad", enlace: "" },
  { titulo: "Actas de reuniones con Essbio (La Mochita y Villa Huáscar)", anio: "2022", categoria: "Actas de reuniones", aporta: "Compromisos de Essbio y su versión de las causas", enlace: "" },
  { titulo: "Nota El Sur: \"Residentes de Collao solicitan cambio de alcantarillado\"", anio: "2022", categoria: "Prensa", aporta: "La etapa 3 del Par Vial no incluye recambio; rebalses en días secos", enlace: "" },
  { titulo: "Ficha de Registro de Rebalse", anio: "2026", categoria: "Herramientas", aporta: "Base del formulario de reporte", enlace: "" },
  { titulo: "Catastro de fallas de Essbio en Collao", anio: "2026", categoria: "Estudios propios", aporta: "Casos de prensa 2016–2026", enlace: "" },
];

/* Cronología. "destacado: true" marca hitos clave. */
const HISTORIA = [
  { anio: "2001", titulo: "Plan Maestro de Aguas Lluvias de Concepción (PM-04)", texto: "El Estado diagnostica oficialmente los problemas de Collao y define obras de prioridad alta, entre ellas los sistemas 24, 31 y 33.", fuente: "Plan Maestro PM-04", destacado: true },
  { anio: "2002–2003", titulo: "Plazo de las obras de aguas lluvias", texto: "Periodo en que debían ejecutarse las obras de prioridad alta en Collao. No hay evidencia de que se hayan ejecutado.", fuente: "Plan Maestro PM-04" },
  { anio: "2006", titulo: "Inundación de Collao", texto: "El sector se inunda gravemente.", fuente: "Fallo judicial", destacado: true },
  { anio: "2015", titulo: "Fallo: el Estado es condenado", texto: "La justicia condena al Estado por no ejecutar el plan de aguas lluvias. La Corte Suprema ratifica la responsabilidad.", fuente: "Fallo 2015 y Corte Suprema", destacado: true },
  { anio: "2017", titulo: "Refuerzo del muro del estero Nonguén", texto: "Se refuerza el muro del estero. Es una obra de estabilidad, no aumenta la capacidad de la red.", fuente: "Diario El Sur, 2017" },
  { anio: "Septiembre 2022", titulo: "Reuniones con Essbio", texto: "En reuniones en La Mochita y Villa Huáscar, Essbio se compromete a cambiar redes frente a Terrazas de Collao y a entregar el resultado de una campaña de humo.", fuente: "Actas de reuniones 2022" },
  { anio: "2022", titulo: "Vecinos piden cambio de alcantarillado", texto: "Se informa que la etapa 3 del Par Vial no incluye recambio de alcantarillado. Vecinos denuncian rebalses incluso en días secos, en Ignacio Collao y frente a la UBB.", fuente: "Diario El Sur, 2022" },
  { anio: "Noviembre 2022", titulo: "Compromiso de 1.000 metros de cañerías", texto: "Essbio se compromete a cambiar 1.000 m de cañerías entre Los Lirios y Nonguén, junto con la reconstrucción de la calle.", fuente: "Actas de reuniones 2022" },
  { anio: "2023", titulo: "Advertencia por proyecto de 452 departamentos", texto: "La junta Protejamos los Lirios advierte que la red no tiene capacidad para un nuevo proyecto de 452 departamentos.", fuente: "Junta de vecinos Protejamos los Lirios" },
  { anio: "2025–2026", titulo: "Colector obstruido en Villa Huáscar", texto: "Se reporta la obstrucción del colector de aguas lluvias.", fuente: "Junta de vecinos Villa Huáscar" },
  { anio: "Octubre 2026", titulo: "Nace la Coordinadora", texto: "Las 12 juntas de vecinos de Collao se unen para hablar con una sola voz y fijan una meta de 12 meses.", fuente: "Coordinadora de Juntas de Vecinos de Collao", destacado: true },
  { anio: "Septiembre 2027", titulo: "Meta", texto: "Plazo que se fija la Coordinadora para tener resuelto el problema o con obras comprometidas y en ejecución.", fuente: "" },
];

const NOVEDADES = [
  { fecha: "Octubre 2026", titulo: "Lanzamos el sitio de la Coordinadora", texto: "Desde hoy puedes reportar cada rebalse desde tu celular. Cada reporte es evidencia." },
];

/* Puntos conocidos en el mapa (no son reportes de vecinos).
   tipo: "alcantarillado" o "aguas-lluvias". Coordenadas APROXIMADAS: verificar. */
const PUNTOS_CONOCIDOS = [
  { titulo: "Rebalses frente a la UBB", junta: "parque-residencial-collao", tipo: "alcantarillado", fecha: "2022-01-01", lat: -36.8215, lng: -73.0138, detalle: "Nota El Sur, 2022. Ubicación aproximada." },
];
