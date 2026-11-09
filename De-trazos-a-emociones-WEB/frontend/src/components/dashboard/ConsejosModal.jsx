import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb, Info, X } from 'lucide-react';
import { useBloquearScroll } from '../../hooks/useBloquearScroll';
import './ConsejosModal.css';

// Consejos de acompañamiento para la semana, según la emoción predominante
// del niño (catálogo fijo en data/actividades.js, no generado por IA).
// Va en un portal: los ancestros animados con transform romperían el position: fixed.
const ConsejosModal = ({ nombre, emocion, visual, consejos = [], onClose }) => {
  const botonRef = useRef(null);
  useBloquearScroll(true);

  useEffect(() => {
    botonRef.current?.focus();
    const alTeclear = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onClose]);

  return createPortal(
    <div className="cm-overlay" onClick={onClose}>
      <div
        className="cm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-titulo"
        onClick={(e) => e.stopPropagation()}
        style={{ '--emo': visual.color, '--emo-bg': visual.bg }}
      >
        <button type="button" className="cm-cerrar" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        <header className="cm-head">
          <span className="cm-icono"><Lightbulb size={22} /></span>
          <div>
            <div className="cm-etiqueta">Para acompañar {nombre === 'el niño' ? 'al niño' : `a ${nombre}`}</div>
            <h2 id="cm-titulo" className="cm-titulo">Consejos para esta semana</h2>
          </div>
        </header>

        {emocion && (
          <div className="cm-contexto">
            <span className="cm-chip"><visual.Icono size={14} /> {emocion}</span>
            <span>Según la emoción que más ha aparecido en sus dibujos recientes.</span>
          </div>
        )}

        <ol className="cm-lista">
          {consejos.map((c, i) => (
            <li key={i} style={{ animationDelay: `${0.12 + i * 0.08}s` }}>
              <span className="cm-num">{i + 1}</span>
              <div>
                <strong>{c.titulo}</strong>
                <p>{c.texto}</p>
              </div>
            </li>
          ))}
        </ol>

        <footer className="cm-pie">
          <p className="cm-nota"><Info size={14} /> Son sugerencias orientativas; no reemplazan la orientación de un profesional.</p>
          <button type="button" ref={botonRef} className="cm-boton" onClick={onClose}>Entendido</button>
        </footer>
      </div>
    </div>,
    document.body
  );
};

export default ConsejosModal;
