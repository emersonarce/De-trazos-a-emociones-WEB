import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import './ComparisonSection.css';
import { emotionVisual, formatFechaHora, formatFechaHoraCorta } from '../../utils/emociones';
import AuthImage from '../common/AuthImage';

const Miniatura = ({ analisis, onClick }) => {
  const visual = emotionVisual(analisis?.resultado_ia?.emocion_predominante || '');
  if (analisis?.ruta_imagen) {
    return <AuthImage analisisId={analisis._id} className="compare-thumb" alt="Dibujo" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }} />;
  }
  return <div className="compare-thumb" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}><visual.Icono size={30} style={{ color: visual.color }} /></div>;
};

const opcionLabel = (a) => {
  const e = a.resultado_ia?.emocion_predominante || 'sin emoción';
  return `${formatFechaHora(a.fecha)} · ${e}`;
};

const ComparisonSection = ({ child, onSelect }) => {
  const analisis = child?.analisis || [];
  const nombre = child?.nombre && child.nombre !== 'Sin nombre' ? child.nombre : 'el niño';

  // Por defecto: "antes" = el más antiguo, "ahora" = el más reciente.
  // (analisis viene en orden descendente: [0] es el más reciente.)
  const idDe = (a) => a?._id || '';
  const [antesId, setAntesId] = useState(idDe(analisis[analisis.length - 1]));
  const [ahoraId, setAhoraId] = useState(idDe(analisis[0]));

  const antes = analisis.find((a) => idDe(a) === antesId) || analisis[analisis.length - 1];
  const ahora = analisis.find((a) => idDe(a) === ahoraId) || analisis[0];

  const hayDos = analisis.length >= 2;
  const emocionAntes = (antes?.resultado_ia?.emocion_predominante || '').toLowerCase();
  const emocionAhora = (ahora?.resultado_ia?.emocion_predominante || '').toLowerCase();

  let cambio;
  if (!hayDos) {
    cambio = `Necesitas al menos dos análisis de ${nombre} para comparar su evolución.`;
  } else if (antesId === ahoraId) {
    cambio = 'Estás comparando el mismo análisis. Elige dos fechas distintas para ver el cambio.';
  } else if (emocionAntes && emocionAhora && emocionAntes === emocionAhora) {
    cambio = `Entre esas dos fechas, ${nombre} se ha mantenido sobre todo en ${emocionAhora}.`;
  } else {
    cambio = `Entre esas dos fechas, ${nombre} pasó de ${emocionAntes || 'una emoción no detectada'} a ${emocionAhora || 'una emoción no detectada'}. Observa si el cambio se sostiene en los próximos análisis.`;
  }

  return (
    <div className="dashboard-card compare-card" data-tour="comparar">
      <div className="ts-header">
        <div>
          <div className="ts-title">Antes y ahora</div>
          <div style={{ fontSize: '13px', color: 'var(--muted2)', marginTop: '4px' }}>Compara dos dibujos para ver su evolución</div>
        </div>
      </div>
      <div className="compare-body">
        {!hayDos ? (
          <div className="compare-result"><strong>Sin comparación aún:</strong> {cambio}</div>
        ) : (
          <>
            <div className="compare-selectors">
              <div className="compare-sel-col">
                <label>Antes</label>
                <select className="compare-select" value={antesId} onChange={(e) => setAntesId(e.target.value)}>
                  {analisis.map((a) => <option key={idDe(a)} value={idDe(a)}>{opcionLabel(a)}</option>)}
                </select>
              </div>
              <div className="compare-sel-col">
                <label>Ahora</label>
                <select className="compare-select" value={ahoraId} onChange={(e) => setAhoraId(e.target.value)}>
                  {analisis.map((a) => <option key={idDe(a)} value={idDe(a)}>{opcionLabel(a)}</option>)}
                </select>
              </div>
            </div>

            <div className="compare-pair">
              <div style={{ flex: 1, textAlign: 'center' }}>
                <Miniatura analisis={antes} onClick={onSelect ? () => onSelect(antes) : undefined} />
                <div className="compare-date">{formatFechaHoraCorta(antes?.fecha)}</div>
              </div>
              <div className="compare-arrow"><ArrowRight size={24} /></div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <Miniatura analisis={ahora} onClick={onSelect ? () => onSelect(ahora) : undefined} />
                <div className="compare-date">{formatFechaHoraCorta(ahora?.fecha)}</div>
              </div>
            </div>

            <div className="compare-result">
              <strong>Cambio detectado:</strong> {cambio}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ComparisonSection;
