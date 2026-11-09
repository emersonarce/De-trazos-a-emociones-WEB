import { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useAvisos } from '../../context/AvisosContext';
import './AvisosFlotantes.css';

const ICONOS = { error: AlertCircle, exito: CheckCircle2, info: Info };
// Los errores se quedan más tiempo para alcanzar a leerlos.
const DURACION = { error: 7000, exito: 4000, info: 5000 };

const Aviso = ({ aviso, onCerrar }) => {
  const Icono = ICONOS[aviso.tipo] || Info;
  const timer = useRef(null);

  // Se cierra solo; con el mouse encima se pausa.
  const programar = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(onCerrar, DURACION[aviso.tipo] || 5000);
  };
  useEffect(() => {
    programar();
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`aviso-flotante ${aviso.tipo}`}
      role={aviso.tipo === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => clearTimeout(timer.current)}
      onMouseLeave={programar}
    >
      <span className="aviso-flotante-icono" aria-hidden="true"><Icono size={18} /></span>
      <div className="aviso-flotante-cuerpo">
        <strong>{aviso.titulo}</strong>
        {aviso.texto && <p>{aviso.texto}</p>}
      </div>
      <button type="button" className="aviso-flotante-cerrar" onClick={onCerrar} aria-label="Cerrar aviso">
        <X size={16} />
      </button>
    </div>
  );
};

const AvisosFlotantes = () => {
  const { avisos, cerrar } = useAvisos();
  if (!avisos.length) return null;
  return (
    <div className="avisos-flotantes" aria-live="polite">
      {avisos.map((a) => <Aviso key={a.id} aviso={a} onCerrar={() => cerrar(a.id)} />)}
    </div>
  );
};

export default AvisosFlotantes;
