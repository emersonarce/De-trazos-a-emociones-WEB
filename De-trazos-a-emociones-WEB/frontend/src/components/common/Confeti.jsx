import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './Confeti.css';

const COLORES = ['#8b79f2', '#2fd2cc', '#fbbf24', '#f2736d', '#8fd26f', '#6f9cf0', '#f59ec5'];
const DURACION_MS = 5200;

// Pseudoaleatorio fijo por pieza: el confeti es el mismo en cada render.
const azar = (i, k) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const PIEZAS = Array.from({ length: 80 }, (_, i) => ({
  left: azar(i, 1) * 100,
  delay: azar(i, 2) * 0.9,
  dur: 2.6 + azar(i, 3) * 1.6,
  ancho: 6 + azar(i, 4) * 6,
  giro: Math.round(azar(i, 5) * 1080 - 540),
  deriva: Math.round(azar(i, 6) * 160 - 80),
  color: COLORES[i % COLORES.length],
}));

// Claves ya celebradas en esta pestaña: con `clave`, el confeti sale una sola vez.
const yaLanzado = new Set();

// Lluvia de confeti de unos segundos sobre toda la pantalla. Es decorativa: no
// bloquea clics y no aparece si el sistema pide reducir el movimiento.
const Confeti = ({ clave }) => {
  const [activo, setActivo] = useState(() => !clave || !yaLanzado.has(clave));
  useEffect(() => {
    if (!activo) return undefined;
    if (clave) yaLanzado.add(clave);
    const t = setTimeout(() => setActivo(false), DURACION_MS);
    return () => clearTimeout(t);
  }, [activo, clave]);
  if (!activo) return null;
  return createPortal(
    <div className="confeti" aria-hidden="true">
      {PIEZAS.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`, width: p.ancho, height: p.ancho * 0.45, background: p.color,
            animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
            '--giro': `${p.giro}deg`, '--deriva': `${p.deriva}px`,
          }}
        />
      ))}
    </div>,
    document.body
  );
};

export default Confeti;
