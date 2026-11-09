import { useState, useEffect } from 'react';
import { textoGenero } from '../utils/contextoNino';
import { useNavigate } from 'react-router-dom';
import { X, LayoutDashboard } from 'lucide-react';
import { api } from '../api';
import { emotionVisual, emocionPredominante, textoEdad, formatFecha } from '../utils/emociones';
import BrandHeader from '../components/common/BrandHeader';
import Sidebar from '../components/layout/Sidebar';
import { useBloquearScroll } from '../hooks/useBloquearScroll';
import './Ninos.css';

const Ninos = () => {
  const navigate = useNavigate();
  const [ninos, setNinos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [detalle, setDetalle] = useState(null);
  useBloquearScroll(!!detalle);

  useEffect(() => {
    let activo = true;
    const t = setTimeout(async () => {
      try {
        const data = await api.getAnalisis();
        const map = new Map();
        data
          .filter((a) => !a.independiente)
          .forEach((a) => {
            const nombre = (a.contexto_nino?.nombre || '').trim() || 'Sin nombre';
            if (!map.has(nombre)) {
              map.set(nombre, { nombre, contexto: a.contexto_nino || {}, analisis: [] });
            }
            map.get(nombre).analisis.push(a);
          });
        if (activo) setNinos([...map.values()]);
      } catch {
        /* ignore */
      } finally {
        if (activo) setCargando(false);
      }
    }, 0);
    return () => {
      activo = false;
      clearTimeout(t);
    };
  }, []);

  const emoDetalle = detalle ? emocionPredominante(detalle.analisis) : null;
  const visualDetalle = emotionVisual(emoDetalle || '');

  return (
    <div className="ninos-page">
      <Sidebar active="ninos" />
      <div className="ninos-container">
        <BrandHeader />

        <h1 className="ninos-title" data-tour="ninos">Mis niños</h1>

        {cargando ? (
          <div className="ninos-empty">Cargando…</div>
        ) : ninos.length === 0 ? (
          <div className="ninos-empty">
            Aún no tienes niños registrados. Analiza un dibujo con contexto para comenzar el seguimiento.
          </div>
        ) : (
          <div className="ninos-grid">
            {ninos.map((n) => {
              const emo = emocionPredominante(n.analisis);
              const v = emotionVisual(emo || '');
              const edad = textoEdad(n.contexto);
              return (
                <div className="nino-card" key={n.nombre} onClick={() => setDetalle(n)}>
                  <div className="nino-avatar" style={{ background: v.bg }}><v.Icono size={26} style={{ color: v.color }} /></div>
                  <div className="nino-name">{n.nombre}</div>
                  <div className="nino-meta">{[edad, n.contexto?.genero && textoGenero(n.contexto.genero)].filter(Boolean).join(' · ') || '—'}</div>
                  <div className="nino-sit">
                    {n.contexto?.situacion_actual || 'Sin situación registrada'}
                  </div>
                  <div className="nino-count">{n.analisis.length} análisis</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {detalle && (
        <div className="nino-modal-overlay" onClick={() => setDetalle(null)}>
          <div className="nino-modal" onClick={(e) => e.stopPropagation()}>
            <button className="nino-modal-close" onClick={() => setDetalle(null)} title="Cerrar"><X size={18} /></button>

            <div className="nino-modal-head">
              <div className="nino-avatar" style={{ background: visualDetalle.bg }}>
                <visualDetalle.Icono size={26} style={{ color: visualDetalle.color }} />
              </div>
              <div>
                <div className="nino-modal-name">{detalle.nombre}</div>
                <div className="nino-modal-meta">
                  {[textoEdad(detalle.contexto), detalle.contexto?.genero && textoGenero(detalle.contexto.genero)].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
            </div>

            <div className="nino-dato"><span>Análisis registrados</span><b>{detalle.analisis.length}</b></div>
            <div className="nino-dato"><span>Emoción predominante</span><b style={{ textTransform: 'capitalize' }}>{emoDetalle || 'Sin datos'}</b></div>
            {detalle.contexto?.fecha_nacimiento && (
              <div className="nino-dato"><span>Fecha de nacimiento</span><b>{formatFecha(detalle.contexto.fecha_nacimiento)}</b></div>
            )}

            <div className="nino-bloque">
              <div className="nino-bloque-label">Situación actual</div>
              <p>{detalle.contexto?.situacion_actual || 'Sin información registrada.'}</p>
            </div>
            {detalle.contexto?.comportamiento && (
              <div className="nino-bloque">
                <div className="nino-bloque-label">Comportamiento reciente</div>
                <p>{detalle.contexto.comportamiento}</p>
              </div>
            )}
            {detalle.contexto?.diagnostico_previo && (
              <div className="nino-bloque">
                <div className="nino-bloque-label">Diagnóstico previo (informado por la familia)</div>
                <p>{detalle.contexto.diagnostico_previo}</p>
              </div>
            )}

            <button
              className="nino-ver-dashboard"
              onClick={() => navigate('/dashboard', { state: { nino: detalle.nombre } })}
            >
              <LayoutDashboard size={16} /> Ver en el dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ninos;
