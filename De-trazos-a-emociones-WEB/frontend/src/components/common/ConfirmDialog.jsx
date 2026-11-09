import { AlertTriangle, X } from 'lucide-react';
import { useBloquearScroll } from '../../hooks/useBloquearScroll';
import './ConfirmDialog.css';

// Cuadro de confirmación con el diseño de la app (reemplaza window.confirm).
const ConfirmDialog = ({
  abierto,
  titulo = '¿Confirmar?',
  mensaje = '',
  detalle = '',
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  peligro = false,
  cargando = false,
  onConfirmar,
  onCancelar,
}) => {
  useBloquearScroll(abierto);
  if (!abierto) return null;

  const cerrar = () => {
    if (!cargando && onCancelar) onCancelar();
  };

  return (
    <div className="confirm-overlay" onClick={cerrar}>
      <div
        className="confirm-card"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="confirm-x" onClick={cerrar} title="Cerrar" aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className={`confirm-icon ${peligro ? 'danger' : ''}`}>
          <AlertTriangle size={24} />
        </div>
        <h3 className="confirm-title">{titulo}</h3>
        {mensaje && <p className="confirm-msg">{mensaje}</p>}
        {detalle && <p className="confirm-detalle">{detalle}</p>}
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={cerrar} disabled={cargando}>
            {textoCancelar}
          </button>
          <button
            className={`confirm-ok ${peligro ? 'danger' : ''}`}
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Procesando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
