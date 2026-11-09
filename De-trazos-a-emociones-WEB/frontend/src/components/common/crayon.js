// Piezas compartidas de las animaciones de trazos (Dashboard y login):
// rayitas de crayón, garabatos sueltos y utilidades de movimiento.

export const TAU = Math.PI * 2;

export const azar = (a, b) => a + Math.random() * (b - a);

export const suave = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// Gira un ángulo hacia el destino por el camino más corto.
export const girarHacia = (a, destino, factor) => {
  let d = (destino - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return a + d * factor;
};

// "#rrggbb" o "rgb(r, g, b)" -> "r, g, b" (para usar en rgba()).
export const aRgb = (valor, porDefecto = '139, 121, 242') => {
  const v = (valor || '').trim();
  const m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).join(', ');
  const n = v.match(/\d+(\.\d+)?/g);
  return n && n.length >= 3 ? n.slice(0, 3).join(', ') : porDefecto;
};

// Rayita de crayón: línea principal y una pasada fina desplazada (textura).
export const pintarMarca = (ctx, { x, y, ang, largo }, grosor, alfa, desplazamiento) => {
  const dx = (Math.cos(ang) * largo) / 2;
  const dy = (Math.sin(ang) * largo) / 2;
  ctx.globalAlpha = 0.9 * alfa;
  ctx.lineWidth = grosor;
  ctx.beginPath();
  ctx.moveTo(x - dx, y - dy);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  const ox = -Math.sin(ang) * desplazamiento;
  const oy = Math.cos(ang) * desplazamiento;
  ctx.globalAlpha = 0.35 * alfa;
  ctx.lineWidth = grosor * 0.45;
  ctx.beginPath();
  ctx.moveTo(x - dx * 0.8 + ox, y - dy * 0.8 + oy);
  ctx.lineTo(x + dx * 0.9 + ox, y + dy * 0.9 + oy);
  ctx.stroke();
};

// Garabatos sueltos: puntos de un trazo corto, centrados en (0, 0).
export const GARABATOS = [
  (s) => Array.from({ length: 14 }, (_, i) => [(i / 13 - 0.5) * 22 * s, Math.sin((i / 13) * TAU * 1.2) * 3.5 * s]),
  (s) => Array.from({ length: 18 }, (_, i) => {
    const a = (i / 17) * TAU * 1.3;
    const r = (2 + i * 0.45) * s;
    return [Math.cos(a) * r, Math.sin(a) * r];
  }),
  (s) => Array.from({ length: 6 }, (_, i) => [(i / 5 - 0.5) * 20 * s, (i % 2 ? 4 : -4) * s]),
  (s) => Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI * (0.15 + 0.7 * (i / 9));
    return [Math.cos(a) * 9 * s, -Math.sin(a) * 6 * s];
  }),
];

export const crearGarabato = (pos, escala, extra = {}) => ({
  ...pos,
  vx: azar(-0.18, 0.18),
  vy: azar(-0.18, 0.18),
  ang: Math.random() * TAU,
  va: azar(-0.005, 0.005),
  puntos: GARABATOS[Math.floor(Math.random() * GARABATOS.length)](azar(0.6, 1) * escala),
  alfa: azar(0.25, 0.45),
  ...extra,
});

export const pintarGarabato = (ctx, g, alfa) => {
  const cos = Math.cos(g.ang);
  const sin = Math.sin(g.ang);
  ctx.globalAlpha = alfa;
  ctx.beginPath();
  g.puntos.forEach(([px, py], i) => {
    const x = g.x + px * cos - py * sin;
    const y = g.y + px * sin + py * cos;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
};

// Deriva lenta con velocidad máxima, como la de los garabatos sueltos.
export const derivar = (g, maxVel = 0.35) => {
  g.vx += azar(-0.015, 0.015);
  g.vy += azar(-0.015, 0.015);
  const v = Math.hypot(g.vx, g.vy);
  if (v > maxVel) {
    g.vx *= maxVel / v;
    g.vy *= maxVel / v;
  }
};

export const rebotar = (p, w, h, margen = 8) => {
  if (p.x < margen) p.vx = Math.abs(p.vx);
  if (p.x > w - margen) p.vx = -Math.abs(p.vx);
  if (p.y < margen) p.vy = Math.abs(p.vy);
  if (p.y > h - margen) p.vy = -Math.abs(p.vy);
};

export const apartarDe = (p, cursor, radio) => {
  if (!cursor) return;
  const dx = p.x - cursor.x;
  const dy = p.y - cursor.y;
  const d = Math.hypot(dx, dy) || 1;
  if (d < radio) {
    const fuerza = (1 - d / radio) * 1.4;
    p.vx += (dx / d) * fuerza;
    p.vy += (dy / d) * fuerza;
  }
};

// Lienzo nítido en pantallas de alta densidad. Devuelve [ancho, alto] en px CSS.
export const ajustarLienzo = (canvas, ctx) => {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [w, h];
};
