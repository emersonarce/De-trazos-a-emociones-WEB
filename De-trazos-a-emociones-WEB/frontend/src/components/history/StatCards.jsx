import './StatCards.css';
import { emotionVisual } from '../../utils/emociones';

const StatCards = ({ sessions = [] }) => {
  const totalSessions = sessions.length;

  let dominanteName = 'N/A';
  let dominanteColor = 'var(--emo-neutra)';
  let dominanteIntensidad = 'N/A';
  let intensitySubText = 'Esperando datos';

  if (totalSessions > 0) {
    const emotionCounts = {};
    sessions.forEach(s => {
      const e = s.resultado_ia?.emocion_predominante?.toLowerCase() || 'desconocida';
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    });
    
    let maxCount = 0;
    for (const e in emotionCounts) {
      if (emotionCounts[e] > maxCount) {
        maxCount = emotionCounts[e];
        dominanteName = e;
      }
    }
    
    const lastDominanteSession = sessions.find(s => s.resultado_ia?.emocion_predominante?.toLowerCase() === dominanteName);
    if (lastDominanteSession) {
      dominanteIntensidad = lastDominanteSession.resultado_ia?.intensidad || 'Media';
    }

    dominanteColor = emotionVisual(dominanteName).color;

    dominanteName = dominanteName.charAt(0).toUpperCase() + dominanteName.slice(1);
    intensitySubText = `Intensidad ${dominanteIntensidad.toLowerCase()}`;
  }

  // Buscar mejor momento (alegría/calma)
  const positiveSession = sessions.find(s => {
    const e = s.resultado_ia?.emocion_predominante?.toLowerCase() || '';
    return e.includes('alegría') || e.includes('calma') || e.includes('felicidad') || e.includes('tranquilidad');
  });

  let mejorMomento = '--';
  let mejorMomentoLabel = 'mayor índice de bienestar';
  let mejorMomentoSub = 'Esperando más análisis';
  
  if (positiveSession) {
    const d = new Date(positiveSession.fecha);
    mejorMomento = `${d.getDate()}/${d.getMonth()+1}`;
    mejorMomentoSub = `↑ 100% ${positiveSession.resultado_ia.emocion_predominante}`;
  } else if (totalSessions > 0) {
    mejorMomentoSub = `Aún no detectado`;
  }

  return (
    <div className="grid-bottom" style={{marginBottom: '20px'}}>
      <div className="dashboard-card stat-card">
        <div style={{fontSize: '11px', color: 'var(--purple-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: 700}}>Total análisis</div>
        <div className="stat-num">{totalSessions}</div>
        <div className="stat-label">sesiones registradas</div>
        <div className="stat-sub">
          <span className="trend up" style={{fontSize: '11px'}}>Actualizado</span>
        </div>
      </div>
      <div className="dashboard-card stat-card">
        <div style={{fontSize: '11px', color: 'var(--purple-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: 700}}>Emoción dominante</div>
        <div style={{fontFamily: "'Inter', sans-serif", fontSize: '26px', fontWeight: 800, color: dominanteColor, lineHeight: 1, letterSpacing: '-0.02em'}}>{dominanteName}</div>
        <div className="stat-label">historial global</div>
        <div className="stat-sub">
          <span style={{width: '8px', height: '8px', borderRadius: '50%', background: dominanteColor, display: 'inline-block', boxShadow: `0 0 8px ${dominanteColor}`}}></span>
          <span style={{fontSize: '11px', color: 'var(--muted2)', fontWeight: 500, marginLeft: '6px'}}>{intensitySubText}</span>
        </div>
      </div>
      <div className="dashboard-card stat-card">
        <div style={{fontSize: '11px', color: 'var(--purple-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: 700}}>Mejor momento</div>
        <div style={{fontFamily: "'Inter', sans-serif", fontSize: '26px', fontWeight: 800, color: 'var(--emo-alegria)', lineHeight: 1, letterSpacing: '-0.02em'}}>{mejorMomento}</div>
        <div className="stat-label">{mejorMomentoLabel}</div>
        <div className="stat-sub">
          <span className="trend up" style={{fontSize: '11px'}}>{mejorMomentoSub}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCards;
