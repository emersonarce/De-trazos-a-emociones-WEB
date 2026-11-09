import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import './GuidedTour.css';

// Vista del recorrido: si hay "rect", dibuja el spotlight sobre el elemento y el
// globo a su lado; si no, muestra el globo centrado (pasos de bienvenida/cierre).
const GuidedTour = ({ step, index, total, rect, onPrev, onNext, onClose }) => {
  if (!step) return null;
  const ultimo = index === total - 1;

  const contenido = (
    <>
      <button className="gt-close" onClick={onClose} title="Cerrar"><X size={16} /></button>
      <div className="gt-paso">Paso {index + 1} de {total}</div>
      <h3 className="gt-title">{step.titulo}</h3>
      <p className="gt-text">{step.texto}</p>
      <div className="gt-actions">
        {index > 0 ? (
          <button className="gt-btn ghost" onClick={onPrev}><ArrowLeft size={15} /> Atrás</button>
        ) : (
          <button className="gt-btn ghost" onClick={onClose}>Saltar</button>
        )}
        <button className="gt-btn" onClick={onNext}>
          {ultimo ? 'Finalizar' : <>Siguiente <ArrowRight size={15} /></>}
        </button>
      </div>
    </>
  );

  if (!rect) {
    // Paso con elemento pero aún sin medir: solo oscurecemos (sin globo) para
    // evitar que aparezca centrado y luego salte a su posición.
    if (step.selector) {
      return <div className="gt-center" />;
    }
    // Paso centrado de verdad (bienvenida / cierre).
    return (
      <div className="gt-center">
        <div className="gt-tip gt-static">{contenido}</div>
      </div>
    );
  }

  // Paso con elemento resaltado: coloca el globo en el lado con más espacio
  // (abajo, arriba, derecha o izquierda) y siempre dentro de la pantalla.
  const TIP_W = 340;
  const TIP_H = 210;
  const M = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top;
  let left;
  if (vh - (rect.top + rect.height) >= TIP_H + M) {
    top = rect.top + rect.height + M; // debajo
    left = rect.left;
  } else if (rect.top >= TIP_H + M) {
    top = rect.top - TIP_H - M; // encima
    left = rect.left;
  } else if (vw - (rect.left + rect.width) >= TIP_W + M) {
    left = rect.left + rect.width + M; // a la derecha
    top = rect.top;
  } else {
    left = rect.left - TIP_W - M; // a la izquierda
    top = rect.top;
  }
  // Mantener el globo dentro de los bordes visibles.
  top = Math.min(Math.max(M, top), vh - TIP_H - M);
  left = Math.min(Math.max(M, left), vw - TIP_W - M);
  const tipStyle = { top: `${top}px`, left: `${left}px` };

  return (
    <div className="gt-root">
      <div className="gt-catch" />
      <div
        className="gt-spot"
        style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
      />
      <div className="gt-tip" style={tipStyle}>{contenido}</div>
    </div>
  );
};

export default GuidedTour;
