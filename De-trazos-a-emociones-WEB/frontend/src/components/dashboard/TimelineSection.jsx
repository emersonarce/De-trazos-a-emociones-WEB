import { ArrowRight } from 'lucide-react';
import './TimelineSection.css';
import { emotionVisual, intensityInfo, formatFechaHora } from '../../utils/emociones';
import { enParrafos } from '../../utils/textoIA';
import AuthImage from '../common/AuthImage';

// Las primeras frases de la lectura (o de la interpretación), para la tarjeta.
const extracto = (r = {}) => {
  const texto = r.lectura_orientativa || r.interpretacion
    || (Array.isArray(r.rasgos_observados) ? r.rasgos_observados.join('. ') : '');
  const frases = enParrafos(texto, 1).slice(0, 2).join(' ');
  return frases || 'Sin resumen disponible para este análisis.';
};

const NIVELES = ['baja', 'media', 'alta'];

const TimelineSection = ({ child, onSelect }) => {
  const analisis = (child?.analisis || []).slice(0, 6);
  const nombre = child?.nombre && child.nombre !== 'Sin nombre' ? child.nombre : 'el niño';

  return (
    <div className="dashboard-card timeline-section">
      <div className="ts-header">
        <div>
          <div className="ts-title">Cómo ha estado {nombre}</div>
          <div className="ts-sub">Sus últimos dibujos, del más reciente al más antiguo</div>
        </div>
      </div>
      <div className="ts-body">
        {analisis.length === 0 ? (
          <div className="ts-vacio">Aún no hay análisis para este niño.</div>
        ) : (
          <div className="ts-grid">
            {analisis.map((a, i) => {
              const r = a.resultado_ia || {};
              const visual = emotionVisual(r.emocion_predominante || '');
              const inten = intensityInfo(r.intensidad || '');
              const emocion = r.emocion_predominante || 'Sin emoción detectada';
              return (
                <button
                  type="button"
                  className="ts-card"
                  key={a._id || i}
                  onClick={() => onSelect && onSelect(a)}
                  style={{ '--emo': visual.color, '--emo-bg': visual.bg, animationDelay: `${0.05 * i}s` }}
                  title="Ver el dibujo y el análisis completo"
                >
                  <div className="ts-dibujo">
                    {a.ruta_imagen ? <AuthImage analisisId={a._id} alt="Dibujo" className="ts-img" /> : <div className="ts-img" />}
                    {i === 0 && <span className="ts-reciente">Más reciente</span>}
                  </div>
                  <div className="ts-info">
                    <div className="ts-fecha">{formatFechaHora(a.fecha)}</div>
                    <div className="ts-emocion">
                      <span className="ts-emocion-icono"><visual.Icono size={18} /></span>
                      <span className="ts-emocion-nombre">{emocion.charAt(0).toUpperCase() + emocion.slice(1)}</span>
                    </div>
                    <div className="ts-intensidad" aria-label={`Intensidad ${inten.label}`}>
                      {NIVELES.map((n, j) => <span key={n} className={j < inten.valor ? 'activo' : ''} />)}
                      <em>Intensidad {inten.label}</em>
                    </div>
                    <p className="ts-extracto">{extracto(r)}</p>
                    <span className="ts-ver">Ver análisis <ArrowRight size={14} /></span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineSection;
