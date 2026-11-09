import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, History, FileDown, Lightbulb, Bell, Sprout } from 'lucide-react';
import './WeeklySummary.css';
import { emotionVisual, intensityInfo, emocionPredominante, esEmocionNegativa, formatFechaCorta } from '../../utils/emociones';
import { useAnalisisSesion } from '../../context/AnalisisSesionContext';
import { exportarAnalisis } from '../../utils/exportarPdf';
import { actividadesPara } from '../../data/actividades';
import ConsejosModal from './ConsejosModal';
import { contextoDelNino } from '../../utils/contextoNino';
import { useAvisos } from '../../context/AvisosContext';
import { senalParaAcompanar, textoSenal, deNombre } from '../../utils/alerta';
import { puedePdf } from '../../utils/permisos';

const alturaPorIntensidad = { 1: '22px', 2: '40px', 3: '56px' };

const slug = (s) =>
  String(s || 'nino').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

const WeeklySummary = ({ child }) => {
  const { avisarError } = useAvisos();
  const navigate = useNavigate();
  const { precargarContexto, nuevaSesion } = useAnalisisSesion();
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [verConsejos, setVerConsejos] = useState(false);
  const analisis = child?.analisis || [];
  const nombre = child?.nombre && child.nombre !== 'Sin nombre' ? child.nombre : 'el niño';

  const exportarPdfNino = async () => {
    if (!analisis.length || generandoPdf) return;
    setGenerandoPdf(true);
    try {
      await exportarAnalisis({
        detalle: null,
        historial: { nombre, lista: analisis },
        nombreArchivo: `de-trazos-${slug(child?.nombre)}.pdf`,
      });
    } catch (e) {
      avisarError('No se pudo generar el PDF', e);
    } finally {
      setGenerandoPdf(false);
    }
  };

  // Lleva el contexto del niño al Analyzer para no volver a pedirlo todo: el más
  // completo de sus análisis (no solo el del último, que pudo hacerse sin contexto).
  const contextoNino = analisis.length ? contextoDelNino(analisis) : null;
  const irNuevoAnalisis = () => {
    if (contextoNino) precargarContexto(contextoNino); else nuevaSesion();
    navigate('/app');
  };

  // Línea de tiempo: hasta los 7 análisis más recientes, en orden cronológico.
  const recientes = analisis.slice(0, 7).reverse();

  const emocion = emocionPredominante(analisis);
  const visual = emotionVisual(emocion || '');

  // Regla de alerta (orientativa, no diagnóstica; ver utils/alerta.js): 3 dibujos
  // seguidos con malestar, 3 en la última semana o más malestar que bienestar en el mes.
  const senal = senalParaAcompanar(analisis);

  const mensaje = emocion
    ? (esEmocionNegativa(emocion)
        ? `En sus últimos dibujos, ${nombre} ha mostrado sobre todo ${emocion}. Puede estar relacionado con algo en casa o el colegio. No es alarmante, pero es una buena señal para conversar con calma.`
        : `En sus últimos dibujos, ${nombre} ha mostrado sobre todo ${emocion}. Es un buen momento para reforzar lo que le hace sentir bien.`)
    : `Todavía no hay suficientes análisis de ${nombre} para resumir una tendencia.`;

  return (
    <div className="grid-main">
      {/* ESTA SEMANA */}
      <div className="dashboard-card week-card">
        <div className="week-header">
          <div className="week-title">Análisis recientes</div>
          <div className="week-badge">{analisis.length} en total</div>
        </div>
        <div className="week-body">
          <div className="state-main">
            <div className="state-emoji-wrap" style={{ '--emo': visual.color }}>
              <div className="state-pulse"></div>
              <visual.Icono size={38} strokeWidth={1.75} style={{ color: visual.color }} />
            </div>
            <div className="state-info">
              <div className="state-label">Emoción predominante</div>
              <div className="state-emotion">{emocion ? emocion.charAt(0).toUpperCase() + emocion.slice(1) : 'Sin datos'}</div>
              <div className="state-desc">{mensaje}</div>
            </div>
          </div>

          {/* Línea de tiempo de análisis reales */}
          <div className="week-timeline">
            {recientes.map((a, i) => {
              const v = emotionVisual(a.resultado_ia?.emocion_predominante || '');
              const inten = intensityInfo(a.resultado_ia?.intensidad || '');
              const esUltimo = i === recientes.length - 1;
              return (
                <div key={a._id || i} className="day-col">
                  <div className="day-bar-wrap">
                    <div className="day-dot"><v.Icono size={16} style={{ color: v.color }} /></div>
                    {/* Color de la emoción suavizado con un gris (--barra-mezcla): menos
                        saturado, sin el marrón que da un ámbar translúcido en oscuro. */}
                    <div className="day-bar" style={{ background: `color-mix(in srgb, ${v.color} var(--barra-pct), var(--barra-mezcla))`, height: alturaPorIntensidad[inten.valor] }}></div>
                  </div>
                  <div className={`day-name ${esUltimo ? 'today' : ''}`}>{formatFechaCorta(a.fecha)}</div>
                </div>
              );
            })}
          </div>

          <div className="message-box">
            <div className="message-label"><Lightbulb size={12} /> Lo que esto significa</div>
            <div className="message-text">{mensaje}</div>
          </div>
        </div>
      </div>

      {/* DERECHA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {senal ? (
          <div className="alert-card">
            <div className="alert-icono" style={{ animation: 'float 4s infinite ease-in-out' }}><Bell size={22} /></div>
            <div className="alert-title">Señal para acompañar</div>
            <div className="alert-sub">{textoSenal(senal, nombre)} Podría ser útil conversar con calma o, si lo consideras, con un profesional.</div>
            <button className="alert-action" disabled title="Próximamente" style={{ opacity: 0.6, cursor: 'not-allowed' }}>Contactar especialista →</button>
          </div>
        ) : (
          <div className="alert-card ok">
            <div className="alert-icono"><Sprout size={22} /></div>
            <div className="alert-title">Todo en seguimiento</div>
            <div className="alert-sub">No hay señales de alerta en los análisis recientes {deNombre(nombre)}. Sigue acompañando y registrando sus dibujos.</div>
          </div>
        )}

        <div className="dashboard-card" style={{ padding: '22px', animation: 'fadeUp 0.6s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px', fontWeight: 700 }}>
            Acciones rápidas
          </div>
          <div className="quick-actions">
            <div className="qa-btn" onClick={irNuevoAnalisis}>
              <span className="qa-icon"><Sparkles size={18} /></span>
              Nuevo análisis
            </div>
            <div className="qa-btn" onClick={() => navigate('/historial')}>
              <span className="qa-icon teal"><History size={18} /></span>
              Ver historial
            </div>
            {puedePdf() && (
              <div
                className="qa-btn"
                data-tour="exportar"
                onClick={exportarPdfNino}
                style={analisis.length === 0 || generandoPdf ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                title={analisis.length === 0 ? 'Sin análisis para exportar' : 'Exportar el historial en PDF'}
              >
                <span className="qa-icon azul"><FileDown size={18} /></span>
                {generandoPdf ? 'Generando…' : 'Exportar PDF'}
              </div>
            )}
            <div
              className="qa-btn"
              role="button"
              tabIndex={0}
              onClick={() => setVerConsejos(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setVerConsejos(true); } }}
              title="Consejos de acompañamiento para esta semana"
            >
              <span className="qa-icon ambar"><Lightbulb size={18} /></span>
              Consejos
            </div>
          </div>
        </div>
      </div>

      {verConsejos && (
        <ConsejosModal
          nombre={nombre}
          emocion={emocion ? emocion.charAt(0).toUpperCase() + emocion.slice(1) : null}
          visual={visual}
          consejos={actividadesPara(emocion || '').consejos}
          onClose={() => setVerConsejos(false)}
        />
      )}
    </div>
  );
};

export default WeeklySummary;
