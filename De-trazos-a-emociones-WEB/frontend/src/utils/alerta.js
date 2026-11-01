// Regla de alerta del Dashboard y el Historial («Señal para acompañar»). Es
// orientativa, no un diagnóstico. Avisa si en los dibujos de un niño aparece
// alguna de estas señales (en este orden de prioridad):
//   1. Sus 3 o más dibujos más recientes, seguidos, muestran malestar.
//   2. En los últimos 7 días hay 3 o más dibujos con malestar.
//   3. En los últimos 30 días hay más dibujos con malestar que con bienestar.
//      Hace falta un mínimo de 3 dibujos en ese mes, para no avisar por uno solo.
// Malestar y bienestar salen de la misma clasificación que las caras
// (utils/emociones.js); las emociones neutras no cuentan para ninguno.
import { valenciaEmocion } from './emociones.js';

export const MINIMO_ALERTA = 3;
const DIA_MS = 86400000;

// Devuelve null o { tipo: 'seguidos' | 'semana', cantidad } o { tipo: 'mes', malestar, bienestar }.
export function senalParaAcompanar(analisis = [], ahora = Date.now()) {
  const dibujos = analisis
    .map((a) => ({
      t: new Date(a.fecha).getTime() || 0,
      valencia: valenciaEmocion(a.resultado_ia?.emocion_predominante || ''),
    }))
    .sort((a, b) => b.t - a.t);

  let seguidos = 0;
  while (seguidos < dibujos.length && dibujos[seguidos].valencia < 0) seguidos++;
  if (seguidos >= MINIMO_ALERTA) return { tipo: 'seguidos', cantidad: seguidos };

  const semana = dibujos.filter((d) => d.t >= ahora - 7 * DIA_MS && d.valencia < 0).length;
  if (semana >= MINIMO_ALERTA) return { tipo: 'semana', cantidad: semana };

  const mes = dibujos.filter((d) => d.t >= ahora - 30 * DIA_MS);
  const malestar = mes.filter((d) => d.valencia < 0).length;
  const bienestar = mes.filter((d) => d.valencia > 0).length;
  if (mes.length >= MINIMO_ALERTA && malestar > bienestar) return { tipo: 'mes', malestar, bienestar };

  return null;
}

// «de Sofía», pero «del niño» cuando no hay nombre.
export const deNombre = (nombre = 'el niño') => (/^el /.test(nombre) ? `del ${nombre.slice(3)}` : `de ${nombre}`);

// Qué señal se encontró, en una frase.
export function textoSenal(senal, nombre) {
  if (!senal) return '';
  const de = deNombre(nombre);
  if (senal.tipo === 'seguidos') return `Los últimos ${senal.cantidad} dibujos ${de}, seguidos, muestran emociones que suelen asociarse a malestar.`;
  if (senal.tipo === 'semana') return `En los últimos 7 días, ${senal.cantidad} dibujos ${de} muestran emociones que suelen asociarse a malestar.`;
  return `En los últimos 30 días hubo más dibujos ${de} con malestar (${senal.malestar}) que con bienestar (${senal.bienestar}).`;
}
