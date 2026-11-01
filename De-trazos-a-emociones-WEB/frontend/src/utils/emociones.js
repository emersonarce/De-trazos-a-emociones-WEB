// Helpers compartidos para representar emociones e intensidades en la UI.
// Centraliza el mapeo emoción -> icono/color para no repetirlo en cada componente.
// Los colores son variables CSS (index.css) para que cambien con el tema claro/oscuro.
// "Icono" es un componente de lucide-react: se pinta con <visual.Icono /> y toma
// el color con style={{ color }} (el atributo stroke no acepta var()).
// "cara" es la misma expresión dibujada con trazos en el Dashboard (trazosCara.js).
// Un color propio por emoción (variables --emo-* de index.css).
import { Laugh, Smile, Frown, Annoyed, Angry, Meh } from 'lucide-react';

const visual = (clave, Icono, cara) => ({
  clave,
  Icono,
  cara,
  color: `var(--emo-${clave})`,
  bg: `var(--emo-${clave}-bg)`,
});

// Minúsculas y sin tildes: el modelo a veces escribe "melancolia" o "alegria".
const sinTildes = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Nombre de la emoción para mostrar. El modelo a veces mete la intensidad en el
// nombre o lo escribe sin tilde ("Melancolia alta" -> "Melancolía"). Los
// análisis nuevos ya llegan limpios del backend; esto cubre los guardados antes.
const CON_TILDE = {
  alegria: 'alegría', melancolia: 'melancolía', frustracion: 'frustración', preocupacion: 'preocupación',
  tension: 'tensión', energia: 'energía', satisfaccion: 'satisfacción', confusion: 'confusión',
  desesperacion: 'desesperación', decepcion: 'decepción', agitacion: 'agitación', estres: 'estrés',
  panico: 'pánico', apatia: 'apatía', emocion: 'emoción', ilusion: 'ilusión',
};
const PALABRAS_INTENSIDAD = /\b(?:de\s+)?(?:intensidad\s+)?(?:muy\s+)?(?:alta|alto|media|medio|baja|bajo|leve|moderada|moderado|intensa|intenso)\b/gi;

export function nombreEmocion(texto) {
  if (typeof texto !== 'string') return texto;
  const sinIntensidad = texto
    .replace(PALABRAS_INTENSIDAD, ' ')
    .replace(/\(\s*\)/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, '')
    .trim();
  const base = sinIntensidad || texto.trim();
  return base.replace(/[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+/g, (palabra) => {
    const correcta = CON_TILDE[sinTildes(palabra)];
    if (!correcta) return palabra;
    return palabra[0] === palabra[0].toUpperCase() ? correcta[0].toUpperCase() + correcta.slice(1) : correcta;
  });
}

export function emotionVisual(emocion = '') {
  const e = sinTildes(emocion);
  if (e.includes('ansiedad') || e.includes('estres') || e.includes('angustia') || e.includes('nervios'))
    return visual('ansiedad', Annoyed, 'molesta');
  if (e.includes('enojo') || e.includes('ira') || e.includes('frustracion') || e.includes('rabia'))
    return visual('enojo', Angry, 'enojo');
  if (e.includes('miedo') || e.includes('temor') || e.includes('susto'))
    return visual('miedo', Frown, 'miedo');
  if (e.includes('tristeza') || e.includes('melancolia') || e.includes('soledad'))
    return visual('tristeza', Frown, 'triste');
  if (e.includes('alegr') || e.includes('felic') || e.includes('feliz') || e.includes('content') || e.includes('euforia') || e.includes('entusiasmo') || e.includes('amor'))
    return visual('alegria', Laugh, 'risa');
  if (e.includes('calma') || e.includes('tranquilidad') || e.includes('paz'))
    return visual('calma', Smile, 'sonrisa');
  // Respaldo neutro (gris azulado), para no caer en un ámbar que se ve marrón.
  return visual('neutra', Meh, 'neutra');
}

export function intensityInfo(intensidad = '') {
  const i = String(intensidad).toLowerCase();
  if (i.includes('alta') || i.includes('alto')) return { label: 'alta', color: 'var(--int-alta)', valor: 3 };
  if (i.includes('baja') || i.includes('bajo') || i.includes('leve')) return { label: 'baja', color: 'var(--int-baja)', valor: 1 };
  return { label: 'media', color: 'var(--int-media)', valor: 2 };
}

// Emociones consideradas negativas, para reglas de alerta orientativas.
export function esEmocionNegativa(emocion = '') {
  const e = sinTildes(emocion);
  return ['ansiedad', 'enojo', 'ira', 'frustracion', 'estres', 'tristeza', 'miedo', 'melancolia', 'soledad', 'angustia']
    .some((neg) => e.includes(neg));
}

// Una fecha sola (YYYY-MM-DD) se lee como fecha local: new Date('2018-03-15')
// la toma como medianoche UTC, que en Colombia todavía es el día anterior.
function aFecha(valor) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor ?? ''));
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(valor);
  return isNaN(d.getTime()) ? null : d;
}

// Edad en años a partir de una fecha de nacimiento (YYYY-MM-DD). null si no es válida.
export function edadDesde(fechaNacimiento, hoy = new Date()) {
  if (!fechaNacimiento) return null;
  const nac = aFecha(fechaNacimiento);
  if (!nac) return null;
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad >= 0 ? edad : null;
}

// Devuelve el texto de edad de un niño: calculada desde la fecha de nacimiento,
// o la edad guardada (registros viejos). Cadena vacía si no hay dato.
export function textoEdad({ fecha_nacimiento, edad } = {}) {
  const calc = edadDesde(fecha_nacimiento);
  if (calc != null) return `${calc} años`;
  if (edad) return `${edad} años`;
  return '';
}

// Con cuántos días de anticipación se avisa un cumpleaños.
export const DIAS_AVISO_CUMPLE = 3;

// Si el cumpleaños es hoy o llega en los próximos `diasAviso` días, devuelve
// { dias (0 = hoy), cuando ('hoy', 'mañana' o 'en N días'), edad que cumple };
// si no, null. Solo para niños (hasta 18 años): así tampoco se celebra un año
// a medio escribir en el campo de fecha (0201, 0020…).
export function infoCumple(fechaNacimiento, diasAviso = DIAS_AVISO_CUMPLE, hoy = new Date()) {
  const nac = fechaNacimiento ? aFecha(fechaNacimiento) : null;
  if (!nac) return null;
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  let proximo = new Date(inicio.getFullYear(), nac.getMonth(), nac.getDate());
  if (proximo < inicio) proximo = new Date(inicio.getFullYear() + 1, nac.getMonth(), nac.getDate());
  const dias = Math.round((proximo - inicio) / 86400000);
  const edad = proximo.getFullYear() - nac.getFullYear();
  if (dias > diasAviso || edad < 1 || edad > 18) return null;
  return { dias, cuando: dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`, edad };
}

export function formatFecha(fecha) {
  const d = fecha ? aFecha(fecha) : null;
  if (!d) return '';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatFechaCorta(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function formatHora(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Fecha y hora completas: "5 de junio de 2026, 14:30".
export function formatFechaHora(fecha) {
  if (!fecha) return '';
  return `${formatFecha(fecha)}, ${formatHora(fecha)}`;
}

// Fecha y hora cortas: "5 jun · 14:30" (útil para distinguir dibujos del mismo día).
export function formatFechaHoraCorta(fecha) {
  if (!fecha) return '';
  return `${formatFechaCorta(fecha)} · ${formatHora(fecha)}`;
}

// Emoción predominante (la más frecuente) de una lista de análisis.
export function emocionPredominante(analisis = []) {
  const conteo = {};
  for (const a of analisis) {
    const e = (a.resultado_ia?.emocion_predominante || '').toLowerCase().trim();
    if (!e) continue;
    conteo[e] = (conteo[e] || 0) + 1;
  }
  let top = null;
  let max = 0;
  for (const e in conteo) {
    if (conteo[e] > max) { max = conteo[e]; top = e; }
  }
  return top;
}
