// Simulación en canvas para el Dashboard: trazos cortos de crayón que llegan
// dispersos y se acomodan, en el orden del dibujo, hasta formar la cara de la
// emoción. Alrededor flotan garabatos sueltos. Cada trazo lleva su color: al
// pasar a otra emoción explota con el color actual y, a medida que vuelve a
// juntarse, cambia al color de la nueva. La geometría replica los iconos de
// lucide (caja 24x24).
import {
  TAU, azar, girarHacia, aRgb, pintarMarca, crearGarabato, pintarGarabato,
  derivar, rebotar, apartarDe, ajustarLienzo,
} from '../common/crayon';

// --- Geometría de las caras (unidades de la caja 24 x 24) -------------------
const arco = (cx, cy, rx, ry, a0, a1) => (t) => {
  const a = a0 + (a1 - a0) * t;
  return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
};
const linea = ([x0, y0], [x1, y1]) => (t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
const curva = ([x0, y0], [cx, cy], [x1, y1]) => (t) => {
  const u = 1 - t;
  return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
};

// El contorno empieza arriba y gira en sentido horario, como un trazo a mano.
const CONTORNO = { f: arco(12, 12, 10, 10, -Math.PI / 2, 1.5 * Math.PI), cerrado: true };
const ojos = (y = 9) => [{ punto: [9, y] }, { punto: [15, y] }];
// Cejas de preocupación: más altas hacia el centro.
const CEJAS_PREOCUPADAS = [{ f: linea([7.2, 8.4], [10.6, 6.8]) }, { f: linea([13.4, 6.8], [16.8, 8.4]) }];
const ovalo = (cx, cy, rx, ry) => ({ f: arco(cx, cy, rx, ry, 0, TAU), cerrado: true });
// Gota (lágrima o sudor): punta arriba y parte redonda abajo, en (cx, cy).
const gota = (cx, cy, r) => [
  { f: curva([cx, cy - 2.1 * r], [cx + r, cy - r], [cx + r, cy]) },
  { f: arco(cx, cy, r, r, 0, Math.PI) },
  { f: curva([cx - r, cy], [cx - r, cy - r], [cx, cy - 2.1 * r]) },
];
// Corazón chico (ojos de cariño), centrado en (cx, cy).
const corazon = (cx, cy, s = 0.1) => ({
  f: (t) => {
    const a = t * TAU;
    return [cx + s * 16 * Math.sin(a) ** 3, cy - s * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))];
  },
  cerrado: true,
});

// Las mismas caras que los iconos (utils/emociones.js y common/carasEmocion.js).
const CARAS = {
  risa: [CONTORNO, { f: arco(12, 13, 6, 5, 0, Math.PI) }, { f: linea([6, 13], [18, 13]) }, ...ojos()],
  sonrisa: [CONTORNO, { f: curva([8, 14], [12, 18], [16, 14]) }, ...ojos()],
  // Tristeza: boca hacia abajo y una lágrima bajo el ojo.
  triste: [CONTORNO, { f: curva([8, 16], [12, 12], [16, 16]) }, ...ojos(), ...gota(8.6, 12.4, 0.9)],
  neutra: [CONTORNO, { f: linea([8, 15], [16, 15]) }, ...ojos()],
  // Ansiedad: cejas de preocupación, boca temblorosa y una gota de sudor.
  ansiosa: [
    CONTORNO,
    { f: (t) => [8 + 8 * t, 15.6 + 0.85 * Math.sin(t * 3 * 2 * Math.PI)] },
    ...CEJAS_PREOCUPADAS,
    ...ojos(10.4),
    ...gota(21.3, 3.4, 1),
  ],
  // Miedo: cejas de preocupación (más arriba), ojos muy abiertos y boca abierta.
  miedo: [
    CONTORNO,
    { f: linea([7.2, 7.8], [10.6, 6.2]) },
    { f: linea([13.4, 6.2], [16.8, 7.8]) },
    ovalo(9, 10.8, 1.25, 1.25),
    ovalo(15, 10.8, 1.25, 1.25),
    ovalo(12, 16.4, 2.3, 1.6),
  ],
  // Asombro: cejas arriba y boca en «o».
  asombro: [
    CONTORNO,
    { f: curva([7.5, 7.6], [9, 6], [10.5, 7.2]) },
    { f: curva([13.5, 7.2], [15, 6], [16.5, 7.6]) },
    ...ojos(10),
    ovalo(12, 16, 1.9, 2.2),
  ],
  // Cariño: ojos de corazón y sonrisa.
  carino: [CONTORNO, { f: curva([8, 14], [12, 18], [16, 14]) }, corazon(9, 9.6), corazon(15, 9.6)],
  enojo: [
    CONTORNO,
    { f: curva([8, 16], [12, 12], [16, 16]) },
    { f: linea([7.5, 8], [10, 9]) },
    { f: linea([14, 9], [16.5, 8]) },
    ...ojos(10.5),
  ],
};

const largoDe = (f) => {
  let largo = 0;
  let [px, py] = f(0);
  for (let i = 1; i <= 40; i++) {
    const [x, y] = f(i / 40);
    largo += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return largo;
};

// Destinos de los trazos (posición, ángulo y largo) en el orden del dibujo.
// "k" escala tamaños para que se vea igual en cualquier lienzo.
const trazosDeCara = (cara, { cx, cy, tam }, k) => {
  const escala = tam / 24;
  const ox = cx - tam / 2;
  const oy = cy - tam / 2;
  // Trazos menudos y juntos: casi puntos, con un leve sentido de trazo.
  const espaciado = 3.1 * k;
  const marcas = [];
  for (const seg of CARAS[cara] || CARAS.neutra) {
    if (seg.punto) {
      // Ojo: un pequeño garabato de tres rayitas cruzadas.
      const x = ox + seg.punto[0] * escala;
      const y = oy + seg.punto[1] * escala;
      for (const ang of [0.3, 1.4, 2.5]) marcas.push({ x, y, ang, largo: 2.6 * k });
      continue;
    }
    const n = Math.max(3, Math.round((largoDe(seg.f) * escala) / espaciado));
    for (let i = 0; i < n; i++) {
      const t = seg.cerrado ? i / n : i / (n - 1);
      const [x, y] = seg.f(t);
      const [x0, y0] = seg.f(Math.max(0, t - 0.01));
      const [x1, y1] = seg.f(Math.min(1, t + 0.01));
      const ang = Math.atan2(y1 - y0, x1 - x0);
      // Un poco de imprecisión de mano: corrimiento perpendicular y ángulo.
      const corr = azar(-0.6, 0.6) * k;
      marcas.push({
        x: ox + x * escala - Math.sin(ang) * corr,
        y: oy + y * escala + Math.cos(ang) * corr,
        ang: ang + azar(-0.15, 0.15),
        largo: espaciado * azar(0.55, 0.9),
      });
    }
  }
  return marcas;
};

const DURACION_DIBUJO_MS = 1500;

const DURACION_COLOR_MS = 1400; // garabatos sueltos y halo pasan al nuevo color

const mezclar = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
const cssRgb = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;

export function crearSimulacion(canvas, {
  cara,
  // Color de la emoción: un color CSS o "var(--emo-...)". Sin él se usa el
  // color CSS del lienzo.
  color: colorInicial = null,
  reducido = false,
  // Elemento que recibe el puntero (los trazos se apartan del cursor).
  zona = canvas,
  // Dónde va la cara dentro del lienzo: { cx, cy, tam } en píxeles.
  ubicarCara = (w, h) => ({ cx: w / 2, cy: h / 2, tam: Math.min(w, h) * 0.66 }),
  // Garabatos sueltos por píxel cuadrado.
  densidadSueltas = 1 / 11000,
  // (x, y, w, h) => 0..1: baja la opacidad en zonas con texto encima.
  atenuar = null,
}) {
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let k = 1;
  let ubicacion = { cx: 0, cy: 0, tam: 0 };
  let colorActual = colorInicial; // color hacia el que van los trazos
  // Transición de color de los garabatos sueltos y del halo.
  let colorSueltos = { desde: colorInicial, hasta: colorInicial, inicio: 0 };
  let trazos = []; // los que forman la cara
  let sueltos = []; // garabatos que flotan alrededor
  let cursor = null;
  let raf = 0;
  let marco = 0;
  let caraActual = cara;

  const medir = () => {
    [w, h] = ajustarLienzo(canvas, ctx);
    ubicacion = ubicarCara(w, h);
    k = Math.max(0.8, Math.min(2.6, ubicacion.tam / 96));
  };

  // Colores resueltos a [r, g, b]. Se vuelven a leer cada tanto para seguir
  // el tema claro/oscuro (las variables --emo-* cambian con el tema).
  const cacheRgb = new Map();
  const rgbDe = (css) => {
    const clave = css || '';
    if (!cacheRgb.has(clave)) {
      const estilo = getComputedStyle(canvas);
      const variable = /^var\((--[\w-]+)\)$/.exec(clave.trim());
      const valor = variable ? estilo.getPropertyValue(variable[1]) : clave || estilo.color;
      cacheRgb.set(clave, aRgb(valor).split(',').map(Number));
    }
    return cacheRgb.get(clave);
  };
  const leerColor = () => cacheRgb.clear();

  const posicionAlAzar = () => ({ x: 12 + Math.random() * (w - 24), y: 12 + Math.random() * (h - 24) });
  // Para los trazos de la cara: preferir zonas sin texto encima.
  const posicionLibre = () => {
    let p = posicionAlAzar();
    for (let i = 0; i < 6 && atenuar && atenuar(p.x, p.y, w, h) < 0.7; i++) p = posicionAlAzar();
    return p;
  };

  // Programa el dibujo: cada trazo "sale" hacia su sitio en el orden del dibujo.
  const dibujar = (nuevaCara, { desdeActual = false, retraso = 0, duracion = DURACION_DIBUJO_MS, color = colorActual } = {}) => {
    caraActual = nuevaCara;
    colorActual = color;
    const ahoraColor = performance.now();
    colorSueltos = { desde: colorSueltos.hasta, hasta: color, inicio: ahoraColor + retraso };
    const destinos = trazosDeCara(nuevaCara, ubicacion, k);
    const ahora = performance.now();
    const paso = duracion / destinos.length;
    const anteriores = trazos;
    trazos = destinos.map((d, i) => {
      const previo = desdeActual && anteriores.length ? anteriores[i % anteriores.length] : null;
      const inicio = previo || posicionLibre();
      // El trazo conserva el color que tenía (el de la emoción anterior) hasta
      // que se acerca a su nuevo lugar.
      const colorPrevio = previo ? (previo.mezcla >= 0.5 ? previo.colHasta : previo.colDesde) : color;
      return {
        colDesde: colorPrevio,
        colHasta: color,
        mezcla: colorPrevio === color ? 1 : 0,
        d0: null,
        x: inicio.x,
        y: inicio.y,
        ang: previo ? previo.ang : Math.random() * TAU,
        vx: previo ? previo.vx : azar(-0.3, 0.3) * k,
        vy: previo ? previo.vy : azar(-0.3, 0.3) * k,
        va: previo ? previo.va : azar(-0.04, 0.04),
        tx: d.x,
        ty: d.y,
        tang: d.ang,
        largo: d.largo,
        alfa: azar(0.75, 1),
        sale: ahora + retraso + i * paso,
        fase: Math.random() * TAU,
      };
    });
    if (reducido) {
      trazos.forEach((p) => Object.assign(p, { x: p.tx, y: p.ty, ang: p.tang, sale: 0, mezcla: 1 }));
      colorSueltos.inicio = -Infinity;
    }
  };

  const crearSueltos = () => {
    const cantidad = Math.max(5, Math.min(40, Math.round(w * h * densidadSueltas)));
    sueltos = Array.from({ length: cantidad }, () => crearGarabato(posicionAlAzar(), k * 0.6));
  };

  const actualizar = (ahora) => {
    const resp = 0.6 * k;
    for (const p of trazos) {
      if (ahora >= p.sale) {
        // Ya va a su sitio: resorte suave + una leve "respiración".
        const tx = p.tx + Math.sin(ahora / 900 + p.fase) * resp;
        const ty = p.ty + Math.cos(ahora / 1100 + p.fase) * resp;
        p.vx = (p.vx + (tx - p.x) * 0.045) * 0.84;
        p.vy = (p.vy + (ty - p.y) * 0.045) * 0.84;
        p.ang = girarHacia(p.ang, p.tang, 0.12);
        // Cambia de color a medida que se junta: según cuánto le falta para llegar.
        if (p.mezcla < 1) {
          const dist = Math.hypot(p.tx - p.x, p.ty - p.y);
          if (p.d0 === null) p.d0 = Math.max(dist, 1);
          const avance = ahora - p.sale > 1800 ? 1 : 1 - dist / p.d0;
          p.mezcla = Math.max(p.mezcla, Math.min(1, avance * 1.15));
        }
      } else {
        // Todavía suelto: deriva y gira despacio.
        p.vx = (p.vx + azar(-0.025, 0.025)) * 0.98;
        p.vy = (p.vy + azar(-0.025, 0.025)) * 0.98;
        p.ang += p.va;
        rebotar(p, w, h);
      }
      apartarDe(p, cursor, 30 * k);
      p.x += p.vx;
      p.y += p.vy;
    }
    for (const g of sueltos) {
      derivar(g);
      rebotar(g, w, h, 16 * k);
      apartarDe(g, cursor, 30 * k);
      g.vx *= 0.99;
      g.vy *= 0.99;
      g.x += g.vx;
      g.y += g.vy;
      g.ang += g.va;
    }
  };

  // Se desvanece cerca del borde del lienzo (así nunca se nota su recuadro) y
  // donde haya texto encima.
  const alfaBorde = (x, y) =>
    Math.max(0, Math.min(1, (Math.min(x, y, w - x, h - y) - 2) / (16 * k))) *
    (atenuar ? atenuar(x, y, w, h) : 1);

  const pintar = () => {
    ctx.clearRect(0, 0, w, h);
    const { cx, cy, tam } = ubicacion;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Color de los garabatos sueltos y del halo (en transición tras un cambio).
    const ahora = performance.now();
    const tSueltos = Math.min(1, Math.max(0, (ahora - colorSueltos.inicio) / DURACION_COLOR_MS));
    const rgb = mezclar(rgbDe(colorSueltos.desde), rgbDe(colorSueltos.hasta), tSueltos);

    // Halo suave detrás de la cara. Se apaga antes de tocar los bordes del
    // lienzo: si no, el banner lo corta y queda una franja de color abajo.
    {
      const radio = Math.max(10, Math.min(tam * 0.85, cy - 4, h - cy - 4, w - cx - 4));
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radio);
      g.addColorStop(0, `rgba(${rgb.join(', ')}, 0.14)`);
      g.addColorStop(1, `rgba(${rgb.join(', ')}, 0)`);
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(cx - tam, cy - tam, tam * 2, tam * 2);
    }

    ctx.strokeStyle = cssRgb(rgb);
    ctx.lineWidth = 1.5 * Math.min(k, 1.6);
    for (const g of sueltos) pintarGarabato(ctx, g, g.alfa * alfaBorde(g.x, g.y));

    // Trazos de la cara, cada uno con su color, y una segunda pasada fina que
    // imita el crayón.
    for (const p of trazos) {
      ctx.strokeStyle = p.mezcla >= 1 ? cssRgb(rgbDe(p.colHasta)) : cssRgb(mezclar(rgbDe(p.colDesde), rgbDe(p.colHasta), p.mezcla));
      pintarMarca(ctx, p, 1.8 * k, alfaBorde(p.x, p.y) * p.alfa, 0.5 * k);
    }
    ctx.globalAlpha = 1;
  };

  const bucle = (ahora) => {
    marco += 1;
    if (marco % 90 === 0) leerColor();
    if (w > 0 && h > 0) {
      actualizar(ahora);
      pintar();
    }
    raf = requestAnimationFrame(bucle);
  };

  const alMover = (e) => {
    const r = canvas.getBoundingClientRect();
    cursor = { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const alSalir = () => {
    cursor = null;
  };

  // Impulso hacia afuera desde la cara (clic).
  const empujar = (fuerzaMin, fuerzaVar) => {
    const { cx, cy } = ubicacion;
    for (const p of trazos) {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const f = (fuerzaMin + Math.random() * fuerzaVar) * Math.sqrt(k);
      p.vx += (dx / d) * f + azar(-0.75, 0.75);
      p.vy += (dy / d) * f + azar(-0.75, 0.75);
      p.va = azar(-0.15, 0.15);
    }
    for (const g of sueltos) {
      g.vx += azar(-1, 1);
      g.vy += azar(-1, 1);
    }
  };

  // Si cambia el tamaño del lienzo, se recoloca la cara y los garabatos.
  let tiempoResize = 0;
  const observador =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          clearTimeout(tiempoResize);
          tiempoResize = setTimeout(() => {
            const antes = `${w}x${h}`;
            medir();
            if (`${w}x${h}` === antes) return;
            crearSueltos();
            dibujar(caraActual, { desdeActual: true, duracion: 500 });
            if (reducido) pintar();
          }, 150);
        })
      : null;

  // --- Inicio ---
  medir();
  leerColor();
  crearSueltos();
  dibujar(cara, { retraso: 250 });
  observador?.observe(canvas);
  if (reducido) {
    pintar();
  } else {
    zona.addEventListener('pointermove', alMover);
    zona.addEventListener('pointerleave', alSalir);
    raf = requestAnimationFrame(bucle);
  }

  return {
    // Pasa de la cara actual a la nueva, trazo por trazo (p. ej. al cambiar de niño).
    cambiarCara(nuevaCara, nuevoColor = colorActual) {
      leerColor();
      if (nuevaCara === caraActual && nuevoColor === colorActual) {
        if (reducido) pintar();
        return;
      }
      dibujar(nuevaCara, { desdeActual: true, color: nuevoColor });
      if (reducido) pintar();
    },
    // Clic: la cara explota con su color y se vuelve a juntar formando otra
    // emoción; cada trazo cambia de color mientras llega a su sitio.
    transicionar(nuevaCara, nuevoColor) {
      if (reducido) {
        this.cambiarCara(nuevaCara, nuevoColor);
        return;
      }
      leerColor();
      empujar(2.5, 3);
      dibujar(nuevaCara, { desdeActual: true, retraso: 500, duracion: DURACION_DIBUJO_MS * 0.8, color: nuevoColor });
    },
    // Clic: la cara se deshace en trazos sueltos y se vuelve a dibujar.
    dispersar() {
      if (reducido) return;
      empujar(2.5, 3);
      dibujar(caraActual, { desdeActual: true, retraso: 500, duracion: DURACION_DIBUJO_MS * 0.75 });
    },
    destruir() {
      cancelAnimationFrame(raf);
      clearTimeout(tiempoResize);
      observador?.disconnect();
      zona.removeEventListener('pointermove', alMover);
      zona.removeEventListener('pointerleave', alSalir);
    },
  };
}
