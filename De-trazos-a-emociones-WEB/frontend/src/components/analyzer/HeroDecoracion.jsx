import { useState, useRef } from 'react';
import './HeroDecoracion.css';

// Colores de la "rueda emocional" del logo (variables de index.css, cambian con el tema).
const COLORES = ['var(--rueda-1)', 'var(--rueda-2)', 'var(--rueda-3)', 'var(--rueda-4)'];

// Orbes flotantes que rellenan el espacio vacío del encabezado.
const ORBES = [
  { c: COLORES[0], size: 26, top: '20%', left: '10%', dur: 7, delay: 0 },
  { c: COLORES[1], size: 18, top: '60%', left: '26%', dur: 9, delay: 0.6 },
  { c: COLORES[2], size: 34, top: '32%', left: '46%', dur: 8, delay: 1.1 },
  { c: COLORES[3], size: 20, top: '68%', left: '64%', dur: 10, delay: 0.3 },
  { c: COLORES[0], size: 14, top: '24%', left: '80%', dur: 6.5, delay: 0.9 },
  { c: COLORES[2], size: 16, top: '72%', left: '90%', dur: 8.5, delay: 1.6 },
];

const HeroDecoracion = () => {
  // Al hacer clic se lanza una onda desde el punto tocado. La recorta el propio
  // encabezado (.hero), así que el único límite visible es su borde redondeado.
  const [ondas, setOndas] = useState([]);
  const idRef = useRef(0);

  const alHacerClic = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = idRef.current;
    idRef.current += 1;
    const color = COLORES[id % COLORES.length];
    setOndas((prev) => [...prev, { id, x, y, color }]);
  };

  const quitarOnda = (id) => setOndas((prev) => prev.filter((o) => o.id !== id));

  return (
    <div className="hero-deco" onClick={alHacerClic}>
      {ORBES.map((o, i) => (
        <span
          key={i}
          className="hero-orb"
          style={{
            color: o.c,
            width: `${o.size}px`,
            height: `${o.size}px`,
            top: o.top,
            left: o.left,
            animationDuration: `${o.dur}s`,
            animationDelay: `${o.delay}s`,
          }}
        >
          <span className="hero-orb-dot" />
        </span>
      ))}
      {ondas.map((o) => (
        <span
          key={o.id}
          className="hero-onda"
          style={{ left: `${o.x}px`, top: `${o.y}px`, color: o.color }}
          onAnimationEnd={() => quitarOnda(o.id)}
        />
      ))}
    </div>
  );
};

export default HeroDecoracion;
