import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { useAnalisisSesion } from '../../context/AnalisisSesionContext';
import './AnalisisToast.css';

// Notificación flotante que avisa, en cualquier página, que un análisis
// terminó mientras estabas en otra parte de la app.
const AnalisisToast = () => {
  const { notificacion, setNotificacion } = useAnalisisSesion();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Si ya estás en el Analyzer, la notificación sobra: se limpia.
  // (El setState se difiere para no romper la regla set-state-in-effect.)
  useEffect(() => {
    if (pathname === '/app' && notificacion) {
      const t = setTimeout(() => setNotificacion(null), 0);
      return () => clearTimeout(t);
    }
  }, [pathname, notificacion, setNotificacion]);

  if (!notificacion || pathname === '/app') return null;

  const nombre =
    notificacion.nombre && notificacion.nombre !== 'el dibujo'
      ? notificacion.nombre
      : null;

  const verResultado = () => {
    setNotificacion(null);
    navigate('/app');
  };
  const cerrar = (e) => {
    e.stopPropagation();
    setNotificacion(null);
  };

  return (
    <div className="toast-analisis" role="status" aria-live="polite">
      <button className="toast-main" onClick={verResultado}>
        <span className="toast-icono">
          <CheckCircle2 size={22} />
        </span>
        <span className="toast-texto">
          <span className="toast-titulo">Análisis de dibujo terminado</span>
          <span className="toast-sub">
            {nombre ? (
              <>
                Dibujo de <strong>{nombre}</strong> ·{' '}
              </>
            ) : null}
            Toca para ver el resultado
          </span>
        </span>
      </button>
      <button className="toast-cerrar" onClick={cerrar} aria-label="Cerrar notificación">
        <X size={16} />
      </button>
    </div>
  );
};

export default AnalisisToast;
