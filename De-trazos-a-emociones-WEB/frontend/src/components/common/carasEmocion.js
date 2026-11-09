// Caras propias para las emociones que lucide no trae: miedo, ansiedad, tristeza
// con lágrima, asombro y cariño. Mismo estilo que los iconos de lucide (caja de
// 24 x 24, trazo redondeado) y misma geometría que las caras dibujadas con trazos
// del Dashboard (dashboard/trazosCara.js). Sin JSX para poder usarlas en las
// pruebas de node a través de utils/emociones.js.
import { createElement as h } from 'react';

// Corazón chico (ojos de cariño), centrado en (cx, cy).
const corazon = (cx, cy, s = 0.1) => {
  const puntos = Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * 2 * Math.PI;
    const x = cx + s * 16 * Math.sin(a) ** 3;
    const y = cy - s * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return `M${puntos.join('L')}Z`;
};

// Gota (lágrima o sudor) con la punta hacia arriba y la parte redonda en (cx, cy).
const gota = (cx, cy, r) =>
  `M${cx} ${cy - 2.1 * r}Q${cx + r} ${cy - r} ${cx + r} ${cy}A${r} ${r} 0 0 1 ${cx - r} ${cy}Q${cx - r} ${cy - r} ${cx} ${cy - 2.1 * r}Z`;

const ojo = (x, y) => ['path', { d: `M${x} ${y}h.01` }];
const CEJAS_PREOCUPADAS = [['path', { d: 'M7.2 8.4 10.6 6.8' }], ['path', { d: 'M13.4 6.8 16.8 8.4' }]];

// Cada parte es [etiqueta, atributos, relleno]: las rellenas (lágrima, sudor,
// corazones) se pintan sólidas para que se lean aun en tamaño chico.
const cara = (nombre, partes) => {
  const Cara = ({ size = 24, color = 'currentColor', strokeWidth = 2, className, ...resto }) =>
    h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: '0 0 24 24',
        fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
        className: ['cara-emocion', className].filter(Boolean).join(' '), 'aria-hidden': 'true', ...resto,
      },
      h('circle', { cx: 12, cy: 12, r: 10 }),
      ...partes.map(([etiqueta, atributos, relleno], i) =>
        h(etiqueta, { key: i, ...atributos, ...(relleno && { fill: color, stroke: 'none' }) })),
    );
  Cara.displayName = nombre;
  return Cara;
};

// Tristeza: boca hacia abajo y una lágrima bajo el ojo.
export const CaraTriste = cara('CaraTriste', [
  ['path', { d: 'M16 16s-1.5-2-4-2-4 2-4 2' }],
  ojo(9, 9), ojo(15, 9),
  ['path', { d: gota(8.6, 12.4, 0.9) }, true],
]);

// Miedo: cejas de preocupación (más arriba, sobre los ojos muy abiertos) y boca abierta.
export const CaraMiedo = cara('CaraMiedo', [
  ['path', { d: 'M7.2 7.8 10.6 6.2' }], ['path', { d: 'M13.4 6.2 16.8 7.8' }],
  ['circle', { cx: 9, cy: 10.8, r: 1.25 }], ['circle', { cx: 15, cy: 10.8, r: 1.25 }],
  ['ellipse', { cx: 12, cy: 16.4, rx: 2.3, ry: 1.6 }],
]);

// Ansiedad: cejas de preocupación, boca temblorosa y una gota de sudor.
export const CaraAnsiedad = cara('CaraAnsiedad', [
  ...CEJAS_PREOCUPADAS,
  ojo(9, 10.4), ojo(15, 10.4),
  ['path', { d: 'M8 15.6q.67-1.1 1.33 0t1.33 0 1.33 0 1.33 0 1.33 0 1.33 0' }],
  ['path', { d: gota(21.3, 3.4, 1) }, true],
]);

// Asombro (admiración, sorpresa, curiosidad): cejas arriba y boca en «o».
export const CaraAsombro = cara('CaraAsombro', [
  ['path', { d: 'M7.5 7.6Q9 6 10.5 7.2' }], ['path', { d: 'M13.5 7.2Q15 6 16.5 7.6' }],
  ojo(9, 10), ojo(15, 10),
  ['ellipse', { cx: 12, cy: 16, rx: 1.9, ry: 2.2 }],
]);

// Cariño (amor, ternura): ojos de corazón y sonrisa.
export const CaraCarino = cara('CaraCarino', [
  ['path', { d: 'M8 14s1.5 2 4 2 4-2 4-2' }],
  ['path', { d: corazon(9, 9.6) }, true], ['path', { d: corazon(15, 9.6) }, true],
]);
