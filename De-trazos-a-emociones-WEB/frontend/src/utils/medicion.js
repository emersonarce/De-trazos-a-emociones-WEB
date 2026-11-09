// Medición de color y trazo que el backend calcula sobre la imagen, sin IA
// (resultado_ia.medicion_imagen, ver backend/services/medicionImagen.js).
// Textos y colores para mostrarla en la app y en el PDF.

// Muestra de cada color para la barra y la leyenda.
export const MUESTRA_COLOR = {
  rojo: '#d93a3a', naranja: '#f08a24', amarillo: '#f2c53d', verde: '#43a047', azul: '#2f6fd6',
  morado: '#8a4fd1', rosado: '#ec6fa9', 'marrón': '#8d5a34', gris: '#9aa0a6', negro: '#2b2b2b',
};

export const NOTA_MEDICION =
  'Medición automática sobre la fotografía, sin IA. La luz, las sombras y lo que aparezca fuera de la hoja pueden afectarla.';

const pct = (n) => `${Math.round(Number(n) || 0)} %`;

// Colores con su ancho en la barra (proporcional al total mostrado).
export function coloresMedicion(m) {
  const colores = Array.isArray(m?.colores) ? m.colores.filter((c) => c && c.porcentaje > 0) : [];
  const suma = colores.reduce((s, c) => s + c.porcentaje, 0) || 1;
  return colores.map((c) => ({
    nombre: c.nombre,
    porcentaje: c.porcentaje,
    texto: pct(c.porcentaje),
    ancho: (100 * c.porcentaje) / suma,
    color: MUESTRA_COLOR[c.nombre] || '#9aa0a6',
  }));
}

// Filas [etiqueta, valor] con los indicadores de la medición.
export function filasMedicion(m) {
  if (!m || !Array.isArray(m.colores)) return [];
  const t = m.tonos || {};
  return [
    ['Uso de la hoja', `${pct(m.uso_hoja)} de la hoja tiene trazo o color`],
    ['Tonos', `cálidos ${pct(t.calidos)} · fríos ${pct(t.frios)} · gris y negro ${pct(t.neutros)}`],
    ['Tonos oscuros', `${pct(m.tonos_oscuros)} de lo dibujado`],
    ['Intensidad del color', `${Math.round(m.intensidad_color || 0)} de 100`],
    ['Tipo de trazo', m.trazo === 'relleno'
      ? `predominan las áreas coloreadas (${pct(m.relleno)} de relleno)`
      : `predominan las líneas y contornos (${pct(m.relleno)} de relleno)`],
  ];
}
