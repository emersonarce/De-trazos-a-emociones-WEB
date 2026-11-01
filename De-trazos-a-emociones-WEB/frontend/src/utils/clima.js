// "Clima emocional" del Historial: ubica cada análisis entre emociones más
// agradables (arriba) y más difíciles (abajo); la distancia al centro es la
// intensidad. Es una simplificación orientativa para ver cambios en el tiempo,
// no una medida clínica.
import { intensityInfo, valenciaEmocion } from './emociones.js';

// +1 agradable, -1 difícil, 0 neutra/no reconocida (la misma clasificación de
// emociones que las caras y la alerta).
export { valenciaEmocion };

export const PERIODOS = { '3m': 90, todo: null };
const MAX_PUNTOS = 12;

// sessions: del más reciente al más antiguo (como llegan del backend).
// Devuelve los puntos en orden cronológico: { analisis, fecha, emocion, intensidad, valor }
// con valor entre -3 (difícil, alta) y +3 (agradable, alta).
export function puntosClima(sessions = [], periodo = 'todo', ahora = Date.now()) {
  const dias = PERIODOS[periodo];
  const desde = dias ? ahora - dias * 86400000 : -Infinity;
  return sessions
    .filter((s) => new Date(s.fecha).getTime() >= desde)
    .slice(0, MAX_PUNTOS)
    .reverse()
    .map((s) => {
      const emocion = s.resultado_ia?.emocion_predominante || '';
      const inten = intensityInfo(s.resultado_ia?.intensidad || '');
      return { analisis: s, fecha: s.fecha, emocion, intensidad: inten.label, valor: valenciaEmocion(emocion) * inten.valor };
    });
}

// Frase breve sobre la tendencia: compara la mitad más reciente con la anterior.
export function resumenClima(puntos = []) {
  if (puntos.length < 2) return null;
  const mitad = Math.floor(puntos.length / 2);
  const promedio = (lista) => lista.reduce((a, p) => a + p.valor, 0) / lista.length;
  const diferencia = promedio(puntos.slice(puntos.length - mitad)) - promedio(puntos.slice(0, mitad));
  if (diferencia >= 1) return { tipo: 'mejora', texto: 'Los dibujos más recientes reflejan emociones más agradables que los anteriores.' };
  if (diferencia <= -1) return { tipo: 'baja', texto: 'Los dibujos más recientes reflejan emociones más difíciles que los anteriores. Puede ser un buen momento para conversar con calma.' };
  return { tipo: 'estable', texto: 'El clima emocional de los dibujos se mantiene parecido en este periodo.' };
}
