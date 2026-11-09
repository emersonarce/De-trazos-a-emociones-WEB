// Panel del login y el registro: puntos de los cuatro colores del logo llegan
// dispersos y dibujan sus círculos en grande; se rellenan, se traza la onda y,
// con el logo ya completo, se encoge y se desplaza hasta su lugar en la marca
// (logo + nombre, como en las páginas). Ahí se muestra la marca real
// (componente Logo) y el lienzo se desvanece. Alrededor flotan puntos sueltos.
// Se forma una vez; un clic sobre el panel la deshace y la vuelve a formar.
// Geometría igual a components/common/Logo.jsx (viewBox 48 x 48).
import { TAU, azar, suave, aRgb, derivar, rebotar, apartarDe, ajustarLienzo } from '../common/crayon';

const CIRCULOS = [
  { x: 19, y: 19 },
  { x: 29, y: 19 },
  { x: 29, y: 29 },
  { x: 19, y: 29 },
];
// Índice de color (--rueda-N) de cada círculo, como en Logo.jsx.
const COLOR_DE = [1, 2, 4, 3];
const ORDEN_RELLENO = [0, 1, 3, 2];
const RADIO = 11.5;
const CENTRO = 24;
export const ANCHO_LOGO = 33; // de 7.5 a 40.5 en el viewBox de 48

// Onda del logo: "M11 26 C16 20.5 20 30 24 26 C28 22 32 31.5 37 26".
const bezier = (p0, p1, p2, p3) => (t) => {
  const u = 1 - t;
  return [0, 1].map(
    (i) => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i],
  );
};
const ONDA = [
  ...Array.from({ length: 40 }, (_, i) => bezier([11, 26], [16, 20.5], [20, 30], [24, 26])(i / 40)),
  ...Array.from({ length: 41 }, (_, i) => bezier([24, 26], [28, 22], [32, 31.5], [37, 26])(i / 40)),
];

// Tiempos del ciclo (ms desde que empieza a formarse). Las etapas se solapan
// para que se vea fluido: el logo empieza a ir a la marca mientras se dibuja
// el último círculo, y el relleno y la onda se completan en el camino. La
// marca aparece a los ~2,1 s.
const T_EMPIEZA = 100; // un instante de puntos dispersos antes de dibujar
const T_CIRCULO = 150; // desfase entre círculos
const T_TRAZO = 450; // cuánto tarda en salir cada círculo completo
const T_ACOMODO = T_EMPIEZA + 3 * T_CIRCULO + T_TRAZO - 50; // empieza a viajar a la marca
const D_ACOMODO = 1150;
const T_MARCA = T_ACOMODO + D_ACOMODO;
const T_RELLENO = T_ACOMODO + 150; // se rellena mientras viaja
const D_RELLENO = 450;
const PASO_RELLENO = 70;
const T_ONDA = T_MARCA - 550; // la onda se traza al final del viaje
const D_ONDA = 500;
const D_CRUCE = 300; // el lienzo cede el lugar a la marca real
const D_DESHACER = 700; // dispersión desde el clic antes de volver a formarse

// Curva del viaje: arranca y frena con suavidad (seno), menos mecánica.
const deslizar = (x) => -(Math.cos(Math.PI * x) - 1) / 2;

const mezclar = (a, b, p) => ({
  cx: a.cx + (b.cx - a.cx) * p,
  cy: a.cy + (b.cy - a.cy) * p,
  tam: a.tam + (b.tam - a.tam) * p,
});

export function crearTrazoLogo(canvas, {
  // Elemento donde el cursor aparta los puntos, y filtro para que no los mueva
  // en algunas partes (p. ej. sobre el formulario).
  zona = canvas,
  aceptarCursor = () => true,
  // Elemento donde un clic deshace la marca y la vuelve a formar, y filtro
  // para ignorar algunos clics (p. ej. sobre el formulario).
  zonaClic = zona,
  aceptarClic = () => true,
  // Otros elementos cuyo cambio de tamaño obliga a recalcular posiciones.
  observar = [],
  // Rectángulo (en coordenadas del lienzo) donde los puntos sueltos se ven
  // más tenues, p. ej. detrás del formulario: () => { x0, y0, x1, y1 } | null.
  tenue = () => null,
  // Logo grande donde se dibuja: (w, h) => { cx, cy, tam } (tam = ancho del logo).
  ubicar,
  // Lugar del logo dentro de la marca real: () => { cx, cy, tam }.
  ubicarMarca,
  // Se llama con true cuando la marca real debe verse y con false al deshacerse.
  alMostrarMarca = () => {},
  reducido = false,
}) {
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let k = 1;
  let grande = { cx: 0, cy: 0, tam: 0 };
  let marca = { cx: 0, cy: 0, tam: 0 };
  let caja = grande;
  let colores = ['139, 121, 242'];
  let opacidad = 0.85;
  let puntos = []; // los que dibujan el logo
  let sueltos = []; // puntos que flotan de fondo
  let cursor = null;
  let raf = 0;
  let inicio = performance.now();
  let deshaciendo = null; // momento en que empezó a deshacerse
  let marcaVisible = false;
  let destruido = false; // tras destruir() no vuelve a animarse

  // Mide el lienzo y las ubicaciones. Si cambió de ancho (otra ventana), los
  // puntos sueltos se reparten en proporción para seguir cubriendo el espacio.
  const medir = () => {
    const anchoAntes = w;
    [w, h] = ajustarLienzo(canvas, ctx);
    grande = ubicar(w, h);
    marca = ubicarMarca();
    k = Math.max(0.8, Math.min(2.4, grande.tam / 150));
    if (anchoAntes && w && anchoAntes !== w) {
      const f = w / anchoAntes;
      for (const s of sueltos) s.x *= f;
      for (const p of puntos) if (p.sale === Infinity || performance.now() < p.sale) p.x *= f;
    }
  };

  const leerColores = () => {
    const raiz = getComputedStyle(document.documentElement);
    colores = [1, 2, 3, 4].map((n) => aRgb(raiz.getPropertyValue(`--rueda-${n}`)));
    opacidad = parseFloat(raiz.getPropertyValue('--rueda-op')) || 0.85;
  };

  const mostrarMarca = (si) => {
    if (marcaVisible === si) return;
    marcaVisible = si;
    alMostrarMarca(si);
  };

  // Unidades del logo (viewBox 48) a píxeles, según una caja.
  const aPx = (x, y, c = caja) => {
    const escala = c.tam / ANCHO_LOGO;
    return [c.cx + (x - CENTRO) * escala, c.cy + (y - CENTRO) * escala];
  };

  const posicionAlAzar = () => ({ x: 12 + Math.random() * (w - 24), y: 12 + Math.random() * (h - 24) });

  // Programa la formación: cada círculo se dibuja con sus puntos, uno tras otro.
  // Los destinos se guardan en unidades del logo para poder moverlo y escalarlo.
  const formar = (desdeActual = false) => {
    inicio = performance.now();
    deshaciendo = null;
    caja = grande;
    const escala = grande.tam / ANCHO_LOGO;
    const espaciado = 4.4 * k;
    const anteriores = puntos;
    const nuevos = [];
    CIRCULOS.forEach((c, ci) => {
      const n = Math.round((TAU * RADIO * escala) / espaciado);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i / n) * TAU;
        const r = RADIO + azar(-0.5, 0.5) * (k / escala);
        nuevos.push({
          ux: c.x + r * Math.cos(a),
          uy: c.y + r * Math.sin(a),
          // Cada tanto un punto más grande, para que no se vea mecánico.
          r: (i % 6 === 0 ? 2.6 : azar(1.4, 2)) * k,
          color: COLOR_DE[ci] - 1,
          alfa: azar(0.8, 1),
          sale: inicio + T_EMPIEZA + ci * T_CIRCULO + (i / n) * T_TRAZO,
          fase: Math.random() * TAU,
        });
      }
    });
    puntos = nuevos.map((p, i) => {
      const previo = desdeActual && anteriores.length ? anteriores[i % anteriores.length] : null;
      const pos = previo || posicionAlAzar();
      return {
        ...p,
        x: pos.x,
        y: pos.y,
        vx: previo ? previo.vx : azar(-0.3, 0.3),
        vy: previo ? previo.vy : azar(-0.3, 0.3),
      };
    });
  };

  const crearSueltos = () => {
    const cantidad = Math.max(12, Math.min(90, Math.round((w * h) / 11000)));
    sueltos = Array.from({ length: cantidad }, () => ({
      ...posicionAlAzar(),
      vx: azar(-0.15, 0.15),
      vy: azar(-0.15, 0.15),
      r: azar(1, 2.2) * k,
      color: Math.floor(Math.random() * 4),
      alfa: azar(0.25, 0.5),
    }));
  };

  // Se deshace desde la marca y luego vuelve a formarse. El estallido sale
  // desde "origen" (donde se hizo clic): los puntos se alejan de ahí, con más
  // fuerza cuanto más cerca estén; sin origen, desde el centro del logo.
  const deshacer = (origen = null) => {
    if (deshaciendo) return;
    deshaciendo = performance.now();
    mostrarMarca(false);
    caja = marca;
    const o = origen || { x: marca.cx, y: marca.cy };
    const alcance = Math.max(160, marca.tam * 3);
    for (const p of puntos) {
      // Todos los puntos nacen en el punto del clic y se dispersan desde ahí,
      // en todas direcciones; luego viajan a formar el logo (formar).
      const ang = Math.random() * TAU;
      const f = azar(2, 7) * Math.sqrt(k);
      p.x = o.x + Math.cos(ang) * azar(0, 3);
      p.y = o.y + Math.sin(ang) * azar(0, 3);
      p.vx = Math.cos(ang) * f;
      p.vy = Math.sin(ang) * f;
      p.sale = Infinity;
    }
    // Los puntos sueltos cercanos también se apartan del clic.
    for (const s of sueltos) {
      const dx = s.x - o.x;
      const dy = s.y - o.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < alcance) {
        const f = 2.5 * (1 - d / alcance);
        s.vx += (dx / d) * f;
        s.vy += (dy / d) * f;
      }
    }
  };

  // Caja del logo en el tiempo t del ciclo (grande, acomodándose o en la marca).
  const cajaEn = (t) => {
    if (deshaciendo) return marca;
    if (t < T_ACOMODO) return grande;
    return mezclar(grande, marca, deslizar(Math.min(1, (t - T_ACOMODO) / D_ACOMODO)));
  };

  const actualizar = (ahora) => {
    // Primero el posible reinicio, y después el tiempo del ciclo: así nunca se
    // usa el tiempo del ciclo anterior (mostraba la marca antes de tiempo).
    if (deshaciendo && ahora - deshaciendo > D_DESHACER) formar(true);
    const t = ahora - inicio;
    if (!deshaciendo && t > T_MARCA) mostrarMarca(true);

    caja = cajaEn(t);
    const acomodando = !deshaciendo && t >= T_ACOMODO;
    for (const p of puntos) {
      const [tx, ty] = aPx(p.ux, p.uy);
      if (ahora >= p.sale) {
        // Resorte hacia su lugar: mientras el logo viaja, los puntos lo siguen
        // con un poco de inercia (se ve orgánico, no un bloque rígido); los que
        // aún llegaban terminan de formarlo en el camino.
        const vaje = acomodando ? 0 : 0.5 * k;
        const rx = tx + Math.sin(ahora / 900 + p.fase) * vaje;
        const ry = ty + Math.cos(ahora / 1100 + p.fase) * vaje;
        const rigidez = acomodando ? 0.14 : 0.09;
        const freno = acomodando ? 0.72 : 0.78;
        p.vx = (p.vx + (rx - p.x) * rigidez) * freno;
        p.vy = (p.vy + (ry - p.y) * rigidez) * freno;
      } else {
        p.vx = (p.vx + azar(-0.025, 0.025)) * 0.98;
        p.vy = (p.vy + azar(-0.025, 0.025)) * 0.98;
        rebotar(p, w, h);
      }
      if (!acomodando) apartarDe(p, cursor, 32 * k);
      p.x += p.vx;
      p.y += p.vy;
    }
    for (const s of sueltos) {
      derivar(s, 0.25);
      rebotar(s, w, h, 12 * k);
      apartarDe(s, cursor, 32 * k);
      s.vx *= 0.99;
      s.vy *= 0.99;
      s.x += s.vx;
      s.y += s.vy;
    }
  };

  // Se desvanece cerca del borde del panel: así nunca se nota su recuadro.
  const alfaBorde = (x, y) => Math.max(0, Math.min(1, (Math.min(x, y, w - x, h - y) - 2) / (16 * k)));

  const punto = (x, y, r) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  };

  const pintar = (ahora) => {
    ctx.clearRect(0, 0, w, h);
    const t = ahora - inicio;

    // Puntos sueltos de fondo, en los colores del logo; más tenues dentro de la
    // zona indicada (el formulario), con un borde suave.
    const zt = tenue();
    const factorTenue = (x, y) => {
      if (!zt) return 1;
      const fuera = Math.max(zt.x0 - x, x - zt.x1, zt.y0 - y, y - zt.y1, 0);
      return 0.3 + 0.7 * Math.min(1, fuera / 30);
    };
    for (const s of sueltos) {
      ctx.globalAlpha = s.alfa * alfaBorde(s.x, s.y) * factorTenue(s.x, s.y);
      ctx.fillStyle = `rgb(${colores[s.color % colores.length]})`;
      punto(s.x, s.y, s.r);
    }

    // El logo del lienzo se apaga cuando aparece la marca real en su lugar.
    const cede = deshaciendo ? 1 : 1 - Math.min(1, Math.max(0, (t - T_MARCA) / D_CRUCE));
    if (cede <= 0) {
      ctx.globalAlpha = 1;
      return;
    }
    // Al encogerse, los puntos se achican con el logo.
    const escalaPuntos = caja.tam / grande.tam;
    const escala = caja.tam / ANCHO_LOGO;

    // Relleno de los círculos, superpuestos en el mismo orden que en Logo.jsx.
    if (!deshaciendo) {
      ORDEN_RELLENO.forEach((ci) => {
        const c = CIRCULOS[ci];
        const p = suave(Math.min(1, Math.max(0, (t - T_RELLENO - ci * PASO_RELLENO) / D_RELLENO)));
        if (p <= 0) return;
        const [x, y] = aPx(c.x, c.y);
        ctx.globalAlpha = opacidad * p * cede;
        ctx.fillStyle = `rgb(${colores[COLOR_DE[ci] - 1]})`;
        ctx.beginPath();
        ctx.arc(x, y, RADIO * escala, 0, TAU);
        ctx.fill();
      });
    }

    // Puntos del contorno: se atenúan al rellenarse para no ensuciar el color.
    const relleno = deshaciendo ? 0 : Math.min(1, Math.max(0, (t - T_RELLENO) / D_RELLENO));
    // Al estallar, los puntos salen pequeños del punto del clic y crecen
    // mientras se dispersan (si no, se ven como un bulto).
    const tamPunto = deshaciendo
      ? 0.35 + 0.65 * Math.min(1, (ahora - deshaciendo) / D_DESHACER)
      : Math.max(0.35, escalaPuntos);
    for (const p of puntos) {
      ctx.globalAlpha = p.alfa * alfaBorde(p.x, p.y) * (1 - 0.8 * relleno) * cede;
      ctx.fillStyle = `rgb(${colores[p.color]})`;
      punto(p.x, p.y, p.r * tamPunto);
    }

    // Onda blanca: se traza en el logo grande ya relleno y viaja con él, así
    // el logo llega completo a la marca.
    const po = deshaciendo ? 0 : suave(Math.min(1, Math.max(0, (t - T_ONDA) / D_ONDA)));
    if (po > 0) {
      const acomodo = Math.min(1, Math.max(0, (t - T_ACOMODO) / D_ACOMODO));
      const hasta = Math.max(2, Math.round(po * ONDA.length));
      ctx.globalAlpha = cede;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // En grande, algo más fina (3.1 se ve pesada); al llegar, igual que el logo.
      ctx.lineWidth = escala * (2.5 + 0.6 * acomodo);
      ctx.beginPath();
      ONDA.slice(0, hasta).forEach(([ux, uy], i) => {
        const [x, y] = aPx(ux, uy);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const bucle = (ahora) => {
    if (w > 0 && h > 0) {
      actualizar(ahora);
      pintar(ahora);
    }
    raf = requestAnimationFrame(bucle);
  };

  const alMover = (e) => {
    if (!aceptarCursor(e)) {
      cursor = null;
      return;
    }
    const r = canvas.getBoundingClientRect();
    cursor = { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const alSalir = () => {
    cursor = null;
  };
  // Clic: si la marca ya está formada, estalla desde el punto del clic y se
  // vuelve a formar.
  const alClic = (e) => {
    if (!marcaVisible || reducido || !aceptarClic(e)) return;
    const r = canvas.getBoundingClientRect();
    deshacer({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  // Recalcula tamaños y posiciones (fuentes ya cargadas o panel que se corre).
  // No reinicia la formación: los destinos están en unidades del logo.
  const reubicar = () => {
    // Al salir de la página, el observador aún puede avisar con el lienzo ya
    // fuera del documento (y sin el logo): no hay nada que medir.
    if (destruido || !canvas.isConnected) return;
    medir();
    // Al cambiar de tamaño el lienzo queda en blanco: se repinta enseguida para
    // que no parpadee mientras el panel se corre.
    if (w > 0 && h > 0) pintar(performance.now());
  };

  const observador = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(reubicar) : null;

  medir();
  leerColores();
  crearSueltos();
  observador?.observe(canvas);
  for (const el of observar) if (el) observador?.observe(el);
  if (reducido) {
    // Sin movimiento: directamente la marca real y los puntos de fondo quietos.
    mostrarMarca(true);
    pintar(performance.now());
  } else {
    formar();
    zona.addEventListener('pointermove', alMover);
    zona.addEventListener('pointerleave', alSalir);
    zonaClic.addEventListener('click', alClic);
    raf = requestAnimationFrame(bucle);
  }

  return {
    reubicar,
    destruir() {
      destruido = true;
      cancelAnimationFrame(raf);
      observador?.disconnect();
      zona.removeEventListener('pointermove', alMover);
      zona.removeEventListener('pointerleave', alSalir);
      zonaClic.removeEventListener('click', alClic);
    },
  };
}
