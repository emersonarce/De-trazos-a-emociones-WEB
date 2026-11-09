import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bell, Cake, CheckCheck, ChevronDown, PartyPopper } from 'lucide-react';
import './Notificaciones.css';
import Confeti from './Confeti';
import { api, EVENTO_ANALISIS_CAMBIARON } from '../../api';
import { useBloquearScroll } from '../../hooks/useBloquearScroll';
import { notificacionesDe, EVENTO_ABRIR } from '../../utils/notificaciones';
import { actividadesPara } from '../../data/actividades';
import { IDEAS_CUMPLE } from '../../data/cumpleanos';

// Avisos ya leídos, por usuario y en este navegador. Solo es una comodidad: si
// el navegador no deja guardar, los avisos se ven como nuevos en cada visita.
const claveLeidas = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return `notificaciones-leidas:${u.id || u.email || 'anonimo'}`;
  } catch {
    return 'notificaciones-leidas:anonimo';
  }
};
const leerLeidas = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(claveLeidas()) || '[]'));
  } catch {
    return new Set();
  }
};
const guardarLeidas = (ids) => {
  try {
    localStorage.setItem(claveLeidas(), JSON.stringify([...ids]));
  } catch { /* sin almacenamiento: se ignora */ }
};

const ETIQUETA_CUANDO = { hoy: 'Hoy', mañana: 'Mañana' };

// En pantallas angostas el panel va fijo y a todo el ancho, justo debajo de la
// campana (anclado a ella quedaría cortado detrás de la barra lateral).
const posicionMovil = (boton) => {
  if (!boton || window.innerWidth > 600) return null;
  const r = boton.getBoundingClientRect();
  return { top: Math.round(r.bottom + 10), maxHeight: Math.round(window.innerHeight - r.bottom - 26) };
};

// Lo que se ve al desplegar un aviso.
const Detalle = ({ n, onIr }) => {
  if (n.tipo === 'senal') {
    return (
      <div className="notif-detalle">
        <p>{n.texto} Podría ser útil conversar con calma o, si lo consideras, con un profesional.</p>
        <p className="notif-nota">Es orientativo, no un diagnóstico.</p>
        <button type="button" className="notif-accion" onClick={() => onIr('/historial', n.nino)}>
          Ver historial de {n.nino} <ArrowRight size={14} />
        </button>
      </div>
    );
  }
  const esHoy = n.dias === 0;
  const sugerencia = n.emocion ? actividadesPara(n.emocion).actividades[0] : null;
  const ideas = IDEAS_CUMPLE[esHoy ? 'hoy' : 'antes'].slice(0, sugerencia ? 1 : 2);
  return (
    <div className="notif-detalle">
      {esHoy && <Confeti clave={n.id} />}
      {sugerencia && (
        <p>
          En sus últimos dibujos mostró sobre todo <strong>{n.emocion}</strong>. Una idea para {esHoy ? 'acompañar su día' : 'prepararlo'}:
          {' '}<strong>{sugerencia.nombre}</strong>. {sugerencia.desc}
        </p>
      )}
      <ul className="notif-ideas">
        {ideas.map((idea) => (
          <li key={idea.titulo}>
            <idea.icon size={15} />
            <span><strong>{idea.titulo}.</strong> {idea.texto}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="notif-accion" onClick={() => onIr('/dashboard', n.nino)}>
        Ver a {n.nino} en el inicio <ArrowRight size={14} />
      </button>
    </div>
  );
};

// Campana de avisos del encabezado: cumpleaños cercanos y señales para
// acompañar. Cada aviso se ve en una fila compacta y se despliega al tocarlo.
const Notificaciones = () => {
  const navigate = useNavigate();
  const [analisis, setAnalisis] = useState(() => api.analisisGuardados());
  const [abierto, setAbierto] = useState(false);
  const [movil, setMovil] = useState(null); // { top, maxHeight } en pantallas angostas
  const [desplegado, setDesplegado] = useState(null);
  const [leidas, setLeidas] = useState(leerLeidas);
  const raizRef = useRef(null);
  const panelRef = useRef(null);
  const botonRef = useRef(null);

  // Misma lista que la página (getAnalisis comparte la petición) y se renueva
  // cuando se guarda, borra o reanaliza algo.
  useEffect(() => {
    let activo = true;
    const cargar = () => api.getAnalisis().then((d) => activo && setAnalisis(d)).catch(() => {});
    cargar();
    window.addEventListener(EVENTO_ANALISIS_CAMBIARON, cargar);
    return () => {
      activo = false;
      window.removeEventListener(EVENTO_ANALISIS_CAMBIARON, cargar);
    };
  }, []);

  const avisos = useMemo(() => notificacionesDe(analisis || []), [analisis]);
  const sinLeer = avisos.filter((n) => !leidas.has(n.id)).length;
  const cumpleHoySinLeer = avisos.some((n) => n.tipo === 'cumple' && n.dias === 0 && !leidas.has(n.id));

  // Solo se conservan los ids de avisos vigentes, para no acumular basura.
  const marcarLeidas = (ids) => {
    setLeidas((prev) => {
      const vigentes = new Set(avisos.map((n) => n.id));
      const nuevas = new Set([...prev, ...ids].filter((id) => vigentes.has(id)));
      guardarLeidas(nuevas);
      return nuevas;
    });
  };

  const alternar = (n) => {
    setDesplegado((d) => (d === n.id ? null : n.id));
    if (!leidas.has(n.id)) marcarLeidas([n.id]);
  };

  const abrirPanel = () => {
    setMovil(posicionMovil(botonRef.current));
    setAbierto(true);
  };

  const cerrar = (devolverFoco = false) => {
    setAbierto(false);
    setDesplegado(null);
    if (devolverFoco) botonRef.current?.focus();
  };

  // En el celular el panel tapa la página: que no se desplace por detrás.
  useBloquearScroll(abierto && !!movil);

  const irA = (ruta, nino) => {
    cerrar();
    navigate(ruta, { state: { nino } });
  };

  // Cerrar al hacer clic afuera o con Escape.
  useEffect(() => {
    if (!abierto) return undefined;
    const alClic = (e) => {
      if (!raizRef.current?.contains(e.target) && !panelRef.current?.contains(e.target)) cerrar();
    };
    const alTeclear = (e) => { if (e.key === 'Escape') cerrar(true); };
    document.addEventListener('pointerdown', alClic);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('pointerdown', alClic);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  // Abrir con un aviso desplegado desde otra parte (por ejemplo, el Historial).
  useEffect(() => {
    const alAbrir = (e) => {
      const id = e.detail?.id || null;
      setMovil(posicionMovil(botonRef.current));
      setAbierto(true);
      setDesplegado(id);
      if (id) {
        setLeidas((prev) => {
          if (prev.has(id)) return prev;
          const nuevas = new Set(prev).add(id);
          guardarLeidas(nuevas);
          return nuevas;
        });
      }
    };
    window.addEventListener(EVENTO_ABRIR, alAbrir);
    return () => window.removeEventListener(EVENTO_ABRIR, alAbrir);
  }, []);

  const senales = avisos.filter((n) => n.tipo === 'senal');
  const cumples = avisos.filter((n) => n.tipo === 'cumple');

  const fila = (n) => {
    const abierta = desplegado === n.id;
    const leida = leidas.has(n.id);
    const esHoy = n.tipo === 'cumple' && n.dias === 0;
    return (
      <li key={n.id} className={`notif-item notif-${n.tipo}${abierta ? ' abierta' : ''}${esHoy ? ' es-hoy' : ''}`}>
        <button type="button" className="notif-fila" aria-expanded={abierta} onClick={() => alternar(n)}>
          <span className="notif-icono" aria-hidden="true">
            {n.tipo === 'senal' ? <AlertTriangle size={17} /> : esHoy ? <PartyPopper size={17} /> : <Cake size={17} />}
          </span>
          <span className="notif-textos">
            {n.tipo === 'senal' ? (
              <>
                <span className="notif-item-titulo">Señal para acompañar</span>
                <span className="notif-meta"><strong>{n.nino}</strong> · {n.resumen}</span>
              </>
            ) : (
              <>
                <span className="notif-item-titulo">{n.nino} cumple {n.edad} años</span>
                <span className="notif-meta">
                  {esHoy ? <span className="notif-hoy">¡Es hoy!</span> : ETIQUETA_CUANDO[n.cuando] || n.cuando.replace(/^en/, 'En')}
                </span>
              </>
            )}
          </span>
          {!leida && <span className="notif-punto" title="Sin leer" />}
          <ChevronDown size={16} className="notif-chevron" aria-hidden="true" />
        </button>
        {abierta && <Detalle n={n} onIr={irA} />}
      </li>
    );
  };

  const etiqueta = sinLeer ? `Notificaciones: ${sinLeer} sin leer` : 'Notificaciones';

  const panel = abierto && (
    <div
      ref={panelRef}
      className={`notif-panel${movil ? ' movil' : ''}`}
      style={movil || undefined}
      id="notif-panel"
      role="dialog"
      aria-label="Notificaciones"
    >
      <div className="notif-cabeza">
        <span className="notif-titulo">Notificaciones</span>
        {sinLeer > 0 && (
          <button type="button" className="notif-leer-todo" onClick={() => marcarLeidas(avisos.map((n) => n.id))}>
            <CheckCheck size={14} /> Marcar como leídas
          </button>
        )}
      </div>
      {avisos.length === 0 ? (
        <div className="notif-vacio">
          <Bell size={22} />
          <strong>Todo al día</strong>
          <span>Aquí verás los cumpleaños cercanos y las señales para acompañar a cada niño.</span>
        </div>
      ) : (
        <div className="notif-cuerpo">
          {senales.length > 0 && (
            <section>
              <h3 className="notif-seccion">Señales para acompañar</h3>
              <ul className="notif-lista">{senales.map(fila)}</ul>
            </section>
          )}
          {cumples.length > 0 && (
            <section>
              <h3 className="notif-seccion">Cumpleaños</h3>
              <ul className="notif-lista">{cumples.map(fila)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="notif" ref={raizRef}>
      <button
        type="button"
        ref={botonRef}
        className={`notif-boton${sinLeer ? ' con-avisos' : ''}${cumpleHoySinLeer ? ' festivo' : ''}${abierto ? ' activo' : ''}`}
        aria-label={etiqueta}
        title={etiqueta}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls="notif-panel"
        onClick={() => (abierto ? cerrar() : abrirPanel())}
      >
        <Bell size={20} />
        {sinLeer > 0 && <span className="notif-cuenta">{sinLeer > 9 ? '9+' : sinLeer}</span>}
      </button>

      {/* En el celular va en <body>, por encima de la barra lateral. */}
      {panel && (movil ? createPortal(panel, document.body) : panel)}
    </div>
  );
};

export default Notificaciones;
