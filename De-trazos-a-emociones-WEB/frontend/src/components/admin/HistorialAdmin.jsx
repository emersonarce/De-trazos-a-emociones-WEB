import { useEffect, useState } from 'react';
import {
  Check, X, Ban, RotateCcw, Trash2, KeyRound, UserCog, ShieldCheck, ShieldOff, ToggleRight, History,
} from 'lucide-react';
import { api } from '../../api';
import { describirAccion, fechaHistorial } from '../../utils/historialAdmin';

const ICONO = {
  aprobar_solicitud: Check,
  rechazar_solicitud: X,
  deshabilitar: Ban,
  habilitar: Check,
  restaurar: RotateCcw,
  eliminar_definitivo: Trash2,
  restablecer_password: KeyRound,
  cambiar_rol: UserCog,
  cambiar_permiso: ToggleRight,
  nombrar_admin: ShieldCheck,
  quitar_admin: ShieldOff,
};

// Historial de acciones del panel: quién hizo qué, a qué cuenta y cuándo, de
// la más reciente a la más antigua. «recargas» lo vuelve a pedir (botón de
// actualizar del panel).
const HistorialAdmin = ({ recargas = 0 }) => {
  const [acciones, setAcciones] = useState([]);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    const t = setTimeout(async () => {
      setCargando(true);
      setError('');
      try {
        const r = await api.getHistorialAdmin();
        if (activo) {
          setAcciones(r.acciones || []);
          setHayMas(Boolean(r.hayMas));
        }
      } catch (e) {
        if (activo) setError(e.message);
      } finally {
        if (activo) setCargando(false);
      }
    }, 0);
    return () => {
      activo = false;
      clearTimeout(t);
    };
  }, [recargas]);

  const verMas = async () => {
    const ultima = acciones[acciones.length - 1];
    if (!ultima) return;
    setCargandoMas(true);
    try {
      const r = await api.getHistorialAdmin(ultima.fecha);
      setAcciones((prev) => [...prev, ...(r.acciones || [])]);
      setHayMas(Boolean(r.hayMas));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargandoMas(false);
    }
  };

  if (cargando) return <div className="admin-empty">Cargando…</div>;
  if (error && acciones.length === 0) return <div className="admin-error">{error}</div>;
  if (acciones.length === 0) {
    return (
      <div className="admin-empty">
        <History size={40} />
        <p>Aún no hay acciones registradas.</p>
      </div>
    );
  }

  return (
    <div className="historial-admin">
      <ul className="historial-lista">
        {acciones.map((a) => {
          const { texto, detalle, tono } = describirAccion(a);
          const Icono = ICONO[a.accion] || History;
          return (
            <li key={a._id} className="historial-item">
              <span className={`historial-icono ${tono}`} aria-hidden="true">
                <Icono size={16} />
              </span>
              <div className="historial-cuerpo">
                <div className="historial-texto">{texto}</div>
                <div className="historial-meta">
                  {a.usuarioEmail && <span className="historial-correo">{a.usuarioEmail}</span>}
                  {detalle && <span className="historial-detalle">{detalle}</span>}
                </div>
              </div>
              <time className="historial-fecha" dateTime={a.fecha}>{fechaHistorial(a.fecha)}</time>
            </li>
          );
        })}
      </ul>
      {error && <div className="admin-error">{error}</div>}
      {hayMas && (
        <button type="button" className="btn-neutro-admin historial-mas" onClick={verMas} disabled={cargandoMas}>
          {cargandoMas ? 'Cargando…' : 'Ver más'}
        </button>
      )}
    </div>
  );
};

export default HistorialAdmin;
