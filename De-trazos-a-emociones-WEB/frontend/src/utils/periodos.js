// Periodos de los reportes (pages/Reportes.jsx): todo el historial, o un año,
// mes, semana (de lunes a domingo) o día concretos. Las ventanas son las
// mismas del gráfico del Historial (clima.js).
import { ventanaPeriodo } from './clima.js';

export const NIVELES_REPORTE = [['todo', 'Todo'], ['anio', 'Año'], ['mes', 'Mes'], ['semana', 'Semana'], ['dia', 'Día']];

// Nombre del reporte en el PDF y en el botón de descarga.
export const TITULO_REPORTE = {
  todo: 'Reporte consolidado', anio: 'Reporte anual', mes: 'Reporte mensual', semana: 'Reporte semanal', dia: 'Reporte diario',
};

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const tiempo = (a) => new Date(a.fecha).getTime();

// Fecha local como «AAAA-MM-DD» (el valor de un input de fecha), y al revés,
// a mediodía para que ningún cambio de hora la pase de día.
export const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function deYmd(texto) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null;
}

// Ventana { desde, hasta } (hasta excluido) del periodo que contiene la fecha
// `ref`; null en «Todo», que no filtra.
export const ventanaReporte = (nivel, ref) => (nivel === 'todo' ? null : ventanaPeriodo(nivel, ref));

// Los análisis que caen en la ventana (todos si no hay ventana).
export function analisisDelPeriodo(analisis = [], ventana = null) {
  if (!ventana) return analisis;
  const desde = ventana.desde.getTime();
  const hasta = ventana.hasta.getTime();
  return analisis.filter((a) => tiempo(a) >= desde && tiempo(a) < hasta);
}

// Fecha del análisis más cercano antes (paso -1) o después (paso 1) del
// periodo: las flechas saltan al periodo anterior o siguiente que tenga
// análisis, sin pasar por los vacíos. null si no hay más.
export function fechaVecina(analisis = [], ventana, paso) {
  if (!ventana) return null;
  const desde = ventana.desde.getTime();
  const hasta = ventana.hasta.getTime();
  let mejor = null;
  for (const a of analisis) {
    const t = tiempo(a);
    if (paso < 0 ? t < desde && (mejor === null || t > mejor) : t >= hasta && (mejor === null || t < mejor)) mejor = t;
  }
  return mejor === null ? null : new Date(mejor);
}

// Los días entre dos fechas: «el 3 de noviembre de 2026», «del 2 al 8 de
// noviembre de 2026», «del 28 de septiembre al 4 de octubre de 2026» o «del
// 29 de diciembre de 2025 al 4 de enero de 2026».
export function textoRango(inicio, fin) {
  const a = new Date(inicio);
  const b = new Date(fin);
  const dia = (d) => `${d.getDate()} de ${MESES[d.getMonth()]}`;
  if (a.getFullYear() !== b.getFullYear()) return `del ${dia(a)} de ${a.getFullYear()} al ${dia(b)} de ${b.getFullYear()}`;
  if (a.getMonth() !== b.getMonth()) return `del ${dia(a)} al ${dia(b)} de ${b.getFullYear()}`;
  if (a.getDate() !== b.getDate()) return `del ${a.getDate()} al ${dia(b)} de ${b.getFullYear()}`;
  return `el ${dia(a)} de ${a.getFullYear()}`;
}

// Las fechas del primer y el último análisis de la lista, en palabras.
export function rangoAnalisis(analisis = []) {
  const tiempos = analisis.map(tiempo).filter(Number.isFinite);
  return tiempos.length ? textoRango(Math.min(...tiempos), Math.max(...tiempos)) : '';
}

// El periodo en palabras, igual en la página y en el PDF: «Año 2026»,
// «Noviembre de 2026», «Semana del 2 al 8 de noviembre de 2026», «Martes 3 de
// noviembre de 2026» o, en «Todo», las fechas del primer y el último análisis.
export function textoPeriodo(nivel, ventana, analisis = []) {
  if (!ventana) return capital(rangoAnalisis(analisis) || 'todo el historial');
  const { desde } = ventana;
  if (nivel === 'anio') return `Año ${desde.getFullYear()}`;
  if (nivel === 'mes') return capital(`${MESES[desde.getMonth()]} de ${desde.getFullYear()}`);
  if (nivel === 'semana') return `Semana ${textoRango(desde, new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + 6))}`;
  return capital(`${DIAS[desde.getDay()]} ${desde.getDate()} de ${MESES[desde.getMonth()]} de ${desde.getFullYear()}`);
}

// Nombre del PDF con la fecha del periodo: …-anual-2026.pdf,
// …-mensual-2026-11.pdf, …-semanal-2026-11-02.pdf (el lunes),
// …-diario-2026-11-03.pdf y, en «Todo», …-consolidado-<día en que se genera>.pdf.
export function archivoReporte(nivel, ventana, hoy = new Date()) {
  const tipo = { anio: 'anual', mes: 'mensual', semana: 'semanal', dia: 'diario' }[nivel];
  if (!ventana || !tipo) return `de-trazos-reporte-consolidado-${ymd(hoy)}.pdf`;
  const largo = { anio: 4, mes: 7 }[nivel] || 10; // AAAA, AAAA-MM o AAAA-MM-DD
  return `de-trazos-reporte-${tipo}-${ymd(ventana.desde).slice(0, largo)}.pdf`;
}

// Los análisis de cada mes, del más antiguo al más reciente, para el reporte
// anual: [{ mes: 'Enero', analisis }]. Solo los meses con análisis.
export function porMes(analisis = []) {
  const meses = new Map();
  for (const a of [...analisis].sort((x, y) => tiempo(x) - tiempo(y))) {
    const d = new Date(a.fecha);
    const clave = d.getFullYear() * 12 + d.getMonth();
    if (!meses.has(clave)) meses.set(clave, { mes: capital(MESES[d.getMonth()]), analisis: [] });
    meses.get(clave).analisis.push(a);
  }
  return [...meses.values()];
}
