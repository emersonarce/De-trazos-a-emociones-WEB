import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock, Info, CheckCircle2, WifiOff, X } from 'lucide-react';

const ICONOS = {
  error: AlertCircle,
  espera: Clock,
  info: Info,
  exito: CheckCircle2,
  conexion: WifiOff,
};

// Aviso del login y el registro (reemplaza los alert() del navegador).
// `aviso` = { tipo: error | espera | info | exito, icono?, titulo, texto?, enlace?: { to, label }, id? }
// El `id` cambia en cada intento, así el aviso se vuelve a animar aunque el
// mensaje sea el mismo (p. ej. dos contraseñas incorrectas seguidas).
const AuthAviso = ({ aviso, onCerrar, className = '' }) => {
  const ref = useRef(null);
  // Si el aviso queda fuera de la pantalla (formulario largo), se lleva a la vista.
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [aviso?.id]);

  if (!aviso) return null;
  const tipo = aviso.tipo || 'error';
  const Icono = ICONOS[aviso.icono] || ICONOS[tipo] || AlertCircle;

  return (
    <div
      key={aviso.id}
      ref={ref}
      className={`auth-aviso ${tipo} ${className}`}
      role={tipo === 'error' ? 'alert' : 'status'}
      aria-live={tipo === 'error' ? 'assertive' : 'polite'}
    >
      <span className="auth-aviso-icono" aria-hidden="true">
        <Icono size={18} strokeWidth={2} />
      </span>
      <div className="auth-aviso-cuerpo">
        <strong>{aviso.titulo}</strong>
        {(aviso.texto || aviso.enlace) && (
          <p>
            {aviso.texto}
            {aviso.enlace && (
              <> <Link to={aviso.enlace.to}>{aviso.enlace.label}</Link></>
            )}
          </p>
        )}
      </div>
      {onCerrar && (
        <button type="button" className="auth-aviso-cerrar" onClick={onCerrar} aria-label="Cerrar aviso">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default AuthAviso;
