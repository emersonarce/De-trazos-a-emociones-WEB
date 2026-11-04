// Contexto del niño: datos que acompañan a cada análisis (contexto_nino).
import { textoEdad } from './emociones.js';

// Datos propios del niño (se conservan entre análisis).
export const CAMPOS_NINO = ['nombre', 'edad', 'fecha_nacimiento', 'genero', 'situacion_actual', 'comportamiento', 'diagnostico_previo'];
// Datos de cada dibujo en particular (cambian en cada análisis).
export const CAMPOS_DIBUJO = ['descripcion_dibujo', 'dibujo_espontaneo', 'comento_mientras', 'tiempo_dibujo'];

export const OPCIONES = {
  genero: [['femenino', 'Femenino'], ['masculino', 'Masculino'], ['no especificado', 'Prefiero no decirlo']],
  comportamiento: ['normal', 'retraído', 'agresivo', 'ansioso', 'triste', 'hiperactivo'],
  dibujo_espontaneo: ['espontáneo', 'se le pidió'],
  tiempo_dibujo: ['menos de 5 minutos', '5 a 15 minutos', 'más de 15 minutos'],
  // Lo que el adulto informa; la app no diagnostica. «Otro» abre un campo corto.
  diagnostico_previo: [
    'Ninguno conocido',
    'TDAH (déficit de atención e hiperactividad)',
    'TEA (trastorno del espectro autista)',
    'Dificultad de aprendizaje (dislexia, discalculia…)',
    'Trastorno del lenguaje',
    'Ansiedad',
    'Discapacidad intelectual',
  ],
};

const lleno = (v) => String(v ?? '').trim() !== '';
const capital = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

// Género: los análisis anteriores guardaron «niña» / «niño».
const GENERO_ANTERIOR = { 'niña': 'femenino', 'niño': 'masculino' };
export const normalizarGenero = (g) => GENERO_ANTERIOR[String(g || '').trim().toLowerCase()] || (g || '');
export const textoGenero = (g) => {
  const v = normalizarGenero(g);
  const op = OPCIONES.genero.find(([valor]) => valor === v);
  return op ? op[1] : capital(v);
};

// Diagnóstico previo: qué opción de la lista corresponde a un valor guardado.
// Lo que no esté en la lista (p. ej. texto libre de análisis anteriores) es «Otro».
const sinPunto = (t) => String(t || '').trim().replace(/[.\s]+$/, '').toLowerCase();
export function opcionDiagnostico(valor) {
  if (!lleno(valor)) return { opcion: '', otro: '' };
  const encontrada = OPCIONES.diagnostico_previo.find((op) => sinPunto(op) === sinPunto(valor) || sinPunto(op).split(' (')[0] === sinPunto(valor));
  return encontrada ? { opcion: encontrada, otro: '' } : { opcion: 'otro', otro: String(valor) };
}

// Tiempo que tardó: una de las opciones o el tiempo exacto en horas y minutos
// («12 minutos», «2 horas», «1 hora y 20 minutos»).
const EXACTO = /^(?:(\d{1,2}) horas?)?(?:(?:^| y )(\d{1,3}) minutos?)?$/;
export function opcionTiempo(valor) {
  const v = String(valor || '').trim();
  if (OPCIONES.tiempo_dibujo.includes(v)) return { opcion: v, horas: '', minutos: '' };
  const m = v ? v.match(EXACTO) : null;
  return { opcion: '', horas: m?.[1] || '', minutos: m?.[2] || '' };
}
export function tiempoExacto(horas, minutos) {
  const h = Math.min(parseInt(horas, 10) || 0, 99);
  const min = Math.min(parseInt(minutos, 10) || 0, 999);
  return [
    h > 0 && `${h} ${h === 1 ? 'hora' : 'horas'}`,
    min > 0 && `${min} ${min === 1 ? 'minuto' : 'minutos'}`,
  ].filter(Boolean).join(' y ');
}

// Tiempo exacto en un solo campo «hh:mm»: es una duración, así que no lleva
// a. m. ni p. m. Las cifras entran por la derecha, como en un cronómetro:
// «15» se ve 00:15 (15 minutos) y «130», 01:30. Se guarda igual que antes
// («1 hora y 30 minutos»), así que el análisis y el historial no cambian.
export function mascaraDuracion(entrada) {
  const cifras = String(entrada ?? '').replace(/\D/g, '').replace(/^0+/, '').slice(0, 4);
  if (!cifras) return '';
  const p = cifras.padStart(4, '0');
  return `${p.slice(0, 2)}:${p.slice(2)}`;
}
// «hh:mm» → valor guardado. Si los minutos pasan de 59, se llevan a horas
// (00:90 → «1 hora y 30 minutos»).
export function duracionDesdeTexto(texto) {
  const m = String(texto ?? '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return '';
  const total = Number(m[1]) * 60 + Number(m[2]);
  return tiempoExacto(Math.floor(total / 60), total % 60);
}
// Valor guardado → «hh:mm». Queda vacío si es una de las opciones o no es un
// tiempo exacto.
export function textoDuracion(valor) {
  const { horas, minutos } = opcionTiempo(valor);
  const total = (parseInt(horas, 10) || 0) * 60 + (parseInt(minutos, 10) || 0);
  if (!total) return '';
  const h = Math.min(Math.floor(total / 60), 99);
  return `${String(h).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// Contexto más completo del niño a partir de sus análisis (del más reciente al
// más antiguo): para cada dato, el valor más reciente que no esté vacío. Así no
// se pierde lo que se escribió antes aunque el último análisis se hiciera sin
// contexto (p. ej. un dibujo suelto asignado después al niño).
export function contextoDelNino(analisis = []) {
  const ctx = {};
  for (const campo of CAMPOS_NINO) {
    const con = analisis.find((a) => lleno(a?.contexto_nino?.[campo]));
    ctx[campo] = con ? con.contexto_nino[campo] : '';
  }
  return ctx;
}

// Solo los datos con valor (para que no pisen con vacíos al combinar).
const soloLlenos = (ctx = {}) =>
  Object.fromEntries(Object.entries(ctx || {}).filter(([, v]) => lleno(v)));

// Contexto que se propone al reanalizar: el del propio análisis y, para lo que
// falte, lo más reciente del mismo niño. Sin nombre no se sabe qué otros
// análisis son del mismo niño, así que solo se usa el propio.
export function contextoParaReanalizar(analisis, analisisDelNino = []) {
  const nombre = String(analisis?.contexto_nino?.nombre || '').trim();
  const delMismoNino = nombre
    ? analisisDelNino.filter((a) => String(a?.contexto_nino?.nombre || '').trim() === nombre)
    : [];
  return { ...contextoDelNino(delMismoNino), ...soloLlenos(analisis?.contexto_nino) };
}

// Filas legibles [etiqueta, valor] con los datos presentes, para mostrar.
export function filasContexto(ctx = {}) {
  const filas = [];
  const edad = textoEdad(ctx);
  if (edad) filas.push(['Edad', edad]);
  if (lleno(ctx.genero)) filas.push(['Género', textoGenero(ctx.genero)]);
  if (lleno(ctx.situacion_actual)) filas.push(['Situación actual', ctx.situacion_actual]);
  if (lleno(ctx.comportamiento)) filas.push(['Comportamiento reciente', capital(ctx.comportamiento)]);
  if (lleno(ctx.diagnostico_previo)) filas.push(['Diagnóstico previo', ctx.diagnostico_previo]);
  if (lleno(ctx.descripcion_dibujo)) filas.push(['Descripción del dibujo', ctx.descripcion_dibujo]);
  if (lleno(ctx.dibujo_espontaneo)) filas.push(['El dibujo', capital(ctx.dibujo_espontaneo)]);
  if (lleno(ctx.comento_mientras)) filas.push(['Comentó mientras dibujaba', ctx.comento_mientras]);
  if (lleno(ctx.tiempo_dibujo)) filas.push(['Tiempo que tardó', capital(ctx.tiempo_dibujo)]);
  return filas;
}
