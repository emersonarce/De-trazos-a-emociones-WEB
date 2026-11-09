// Textos que devuelve la IA.
import { nombreEmocion } from './emociones.js';

// minicpm-v a veces mete palabras en chino y puntuación de ancho completo en
// medio del español ("en一方面，el sol"). El backend ya limpia los análisis
// nuevos (backend/services/ia/parseo.js); esto cubre los que se guardaron antes.
const PUNTUACION_ANCHA = { '，': ', ', '、': ', ', '。': '. ', '：': ': ', '；': '; ', '！': '! ', '？': '? ', '（': ' (', '）': ') ' };

export const limpiarTextoIA = (texto) => {
  if (typeof texto !== 'string') return texto;
  return texto
    .replace(/[，、。：；！？（）]/g, (c) => PUNTUACION_ANCHA[c])
    .replace(/[\u3000-\u303F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFF00-\uFFEF]+/g, '')
    .replace(/[ \t]+([,.;:!?)])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

// Copia del resultado con sus textos limpios (para mostrar análisis guardados).
export const limpiarResultadoIA = (r = {}) => {
  const copia = { ...r };
  for (const [clave, valor] of Object.entries(copia)) {
    if (clave === 'raw') continue;
    if (typeof valor === 'string') copia[clave] = limpiarTextoIA(valor);
    else if (Array.isArray(valor)) copia[clave] = valor.map(limpiarTextoIA);
  }
  if (typeof copia.emocion_predominante === 'string') {
    copia.emocion_predominante = nombreEmocion(copia.emocion_predominante);
  }
  return copia;
};

// Divide un texto en párrafos para leerlo mejor. Respeta los saltos que ya
// traiga; si es un solo bloque largo, agrupa las frases de a `porParrafo`.
export const enParrafos = (texto, porParrafo = 3) => {
  const limpio = limpiarTextoIA(texto || '');
  if (!limpio) return [];
  const bloques = limpio.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  if (bloques.length > 1) return bloques;
  const frases = limpio.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡"“])/);
  const parrafos = [];
  for (let i = 0; i < frases.length; i += porParrafo) {
    parrafos.push(frases.slice(i, i + porParrafo).join(' '));
  }
  return parrafos;
};
