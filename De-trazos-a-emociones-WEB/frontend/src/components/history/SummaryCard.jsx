import { useState, useEffect } from 'react';
import './SummaryCard.css';
import { emotionVisual } from '../../utils/emociones';

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Análisis por día de la semana actual (lunes a domingo) y el índice de hoy.
function actividadSemanal(sessions) {
  const hoy = new Date();
  const indiceHoy = (hoy.getDay() + 6) % 7; // lunes = 0
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - indiceHoy);
  const conteo = [0, 0, 0, 0, 0, 0, 0];
  for (const s of sessions) {
    const f = new Date(s.fecha);
    const dia = Math.floor((new Date(f.getFullYear(), f.getMonth(), f.getDate()) - lunes) / 86400000);
    if (dia >= 0 && dia < 7) conteo[dia] += 1;
  }
  return { conteo, indiceHoy };
}

const SummaryCard = ({ sessions = [] }) => {
  const [animatedWidths, setAnimatedWidths] = useState({});
  const [alturasVisibles, setAlturasVisibles] = useState(false);
  const semana = actividadSemanal(sessions);

  const emotionCounts = {};
  sessions.forEach(s => {
    const e = s.resultado_ia?.emocion_predominante?.toLowerCase() || 'desconocida';
    emotionCounts[e] = (emotionCounts[e] || 0) + 1;
  });

  const total = sessions.length;
  let summaryData = [];

  if (total > 0) {
    summaryData = Object.keys(emotionCounts).map(e => {
      const count = emotionCounts[e];
      const pctValue = Math.round((count / total) * 100);
      // Un color por emoción (utils/emociones.js), como variable CSS del tema.
      const { color } = emotionVisual(e);
      const bg = `color-mix(in srgb, ${color} 50%, transparent)`;

      return {
        name: e.charAt(0).toUpperCase() + e.slice(1),
        color,
        bg,
        trend: 'stable',
        trendTxt: `(${count})`, 
        pct: `${pctValue}%`,
        pctValue
      };
    });
    
    summaryData.sort((a, b) => b.pctValue - a.pctValue);
  } else {
    summaryData = [
       { name: 'Esperando datos', color: 'var(--emo-neutra)', bg: 'var(--emo-neutra-bg)', trend: 'stable', trendTxt: '-', pct: '0%', pctValue: 0 }
    ];
  }

  summaryData = summaryData.slice(0, 4);

  useEffect(() => {
    const timer = setTimeout(() => {
      const widths = {};
      summaryData.forEach((item, i) => {
        widths[i] = item.pct;
      });
      setAnimatedWidths(widths);
      setAlturasVisibles(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [sessions]);

  return (
    <div className="dashboard-card summary-card">
      <div className="card-header">
        <div>
          <div className="card-label">Resumen</div>
          <div className="card-title">Emociones predominantes</div>
        </div>
      </div>
      <div className="summary-body">
        {summaryData.map((item, i) => (
          <div key={i}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
              <div className="summary-emotion">
                <span className="s-dot" style={{background: item.color, color: item.bg}}></span>
                <span className="s-name">{item.name}</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div className={`trend ${item.trend}`} style={{fontSize: '11px'}}>{item.trendTxt}</div>
                <span className="s-pct">{item.pct}</span>
              </div>
            </div>
            <div className="s-bar-wrap">
              <div className="s-bar" style={{width: animatedWidths[i] || '0%', background: `color-mix(in srgb, ${item.color} var(--barra-pct), var(--barra-mezcla))`, transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'}}></div>
            </div>
          </div>
        ))}

        <div style={{marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)'}}>
          <div style={{fontSize: '12px', color: 'var(--muted2)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700}}>Actividad semanal</div>
          <div className="week-dots" role="img" aria-label={`Análisis esta semana: ${semana.conteo.reduce((a, b) => a + b, 0)}`}>
            {semana.conteo.map((n, i) => (
              <div
                key={i}
                className={`w-dot ${n ? 'con-analisis' : ''} ${i === semana.indiceHoy ? 'hoy' : ''}`}
                style={{ height: alturasVisibles ? `${n ? Math.min(30, 8 + (n - 1) * 7) : 4}px` : '4px' }}
                title={`${DIAS[i]}: ${n} análisis`}
              ></div>
            ))}
          </div>
          <div style={{fontSize: '11px', color: 'var(--muted)', marginTop: '6px', fontWeight: 500, display: 'flex', justifyContent: 'space-between', width: '105px'}}>
            {DIAS.map((d, i) => <span key={i} style={i === semana.indiceHoy ? { color: 'var(--text)', fontWeight: 700 } : undefined}>{d}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
