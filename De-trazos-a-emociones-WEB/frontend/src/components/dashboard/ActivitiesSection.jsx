import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import './ActivitiesSection.css';
import { emocionPredominante } from '../../utils/emociones';
import { actividadesPara } from '../../data/actividades';
import { useBloquearScroll } from '../../hooks/useBloquearScroll';

const ActivitiesSection = ({ child }) => {
  const nombre = child?.nombre && child.nombre !== 'Sin nombre' ? child.nombre : 'el niño';
  const emocion = emocionPredominante(child?.analisis || []);
  const { actividades, consejos } = actividadesPara(emocion);

  const [detalle, setDetalle] = useState(null);
  useBloquearScroll(!!detalle);

  return (
    <div className="dashboard-card activities-section" data-tour="actividades">
      <div className="act-header">
        <div>
          <div className="act-title">Actividades sugeridas</div>
          <div className="act-subtitle">Para hacer con {nombre} esta semana · toca una para ver por qué</div>
        </div>
        <Sparkles className="act-spark" size={22} />
      </div>
      <div className="act-body">
        {actividades.map((act, i) => (
          <div className="act-card" key={i} onClick={() => setDetalle(act)}>
            <div className="act-icon" style={{ background: act.bg }}><act.icon size={22} style={{ color: act.color }} /></div>
            <div className="act-info">
              <div className="act-name">{act.nombre}</div>
              <div className="act-desc">{act.desc}</div>
              <span className="act-tag" style={{ background: act.bg, color: act.color }}>{act.tag}</span>
            </div>
          </div>
        ))}
      </div>

      {detalle && (
        <div className="act-modal-overlay" onClick={() => setDetalle(null)}>
          <div className="act-modal" onClick={(e) => e.stopPropagation()}>
            <button className="act-modal-close" onClick={() => setDetalle(null)} title="Cerrar"><X size={18} /></button>
            <div className="act-modal-head">
              <div className="act-icon" style={{ background: detalle.bg }}><detalle.icon size={22} style={{ color: detalle.color }} /></div>
              <div className="act-modal-title">{detalle.nombre}</div>
            </div>
            <p className="act-modal-desc">{detalle.desc}</p>

            <div className="act-modal-section">
              <div className="act-modal-label">Por qué ayuda</div>
              <p className="act-modal-text">{detalle.fundamento}</p>
            </div>

            {consejos?.length > 0 && (
              <div className="act-modal-section">
                <div className="act-modal-label">Consejos para acompañar</div>
                <ul className="act-modal-consejos">
                  {consejos.map((c, idx) => (
                    <li key={idx}><strong>{c.titulo}:</strong> {c.texto}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="act-modal-nota">
              Sugerencia orientativa de acompañamiento, no una indicación clínica.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesSection;
