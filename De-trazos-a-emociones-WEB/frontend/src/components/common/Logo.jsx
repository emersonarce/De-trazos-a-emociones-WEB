import './Logo.css';

// Logo "De trazos a emociones": rueda emocional (cuatro círculos superpuestos)
// con un trazo ondulado blanco en el centro. El trazo se dibuja al aparecer.
// Los colores salen de --rueda-* (index.css) para ajustarse al tema; van por
// style porque los atributos SVG no aceptan var().
const rueda = (n) => ({ fill: `var(--rueda-${n})`, opacity: 'var(--rueda-op)' });

const Logo = ({ size = 24 }) => (
  <svg
    className="logo-mark"
    width={size}
    height={size}
    viewBox="0 0 48 48"
    aria-hidden="true"
  >
    <g className="logo-wheel">
      <circle cx="19" cy="19" r="11.5" style={rueda(1)} />
      <circle cx="29" cy="19" r="11.5" style={rueda(2)} />
      <circle cx="19" cy="29" r="11.5" style={rueda(3)} />
      <circle cx="29" cy="29" r="11.5" style={rueda(4)} />
    </g>
    <path
      className="logo-wave"
      d="M11 26 C16 20.5 20 30 24 26 C28 22 32 31.5 37 26"
      fill="none"
      stroke="#ffffff"
      strokeWidth="3.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Logo;
