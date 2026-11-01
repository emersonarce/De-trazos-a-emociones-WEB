import { RefreshCw, Timer, Eye, Puzzle, Compass, Info, Palette } from 'lucide-react';
import './AnalyzerResult.css';
import { emotionVisual } from '../../utils/emociones';
import { enParrafos } from '../../utils/textoIA';
import { ContextoResumen } from '../common/ContextoNino';
import MedicionImagen from '../common/MedicionImagen';

const NIVELES = [
  { clave: 'low', label: 'Baja' },
  { clave: 'medio', label: 'Media' },
  { clave: 'high', label: 'Alta' },
];

const Bloque = ({ Icono, titulo, sub, destacado, children }) => (
  <section className={`res-bloque ${destacado ? 'destacado' : ''}`}>
    <header className="res-bloque-head">
      <span className="res-bloque-icono"><Icono size={18} /></span>
      <div>
        <h3>{titulo}</h3>
        <p>{sub}</p>
      </div>
    </header>
    {children}
  </section>
);

const Texto = ({ texto }) => (
  <div className="res-texto">
    {enParrafos(texto).map((p, i) => <p key={i}>{p}</p>)}
  </div>
);

const AnalyzerResult = ({ analysisResult, resetAll, previewUrl, contexto = null }) => {
  const emocion = analysisResult.chips[0] || '';
  const visual = emotionVisual(emocion);
  const nivel = NIVELES.findIndex((n) => n.clave === analysisResult.intensity);

  return (
    // --emo: color de la emoción predominante; tiñe el resumen y la lectura.
    <div id="screen-3" className="screen res" style={{ '--emo': visual.color }}>
      <div className="section-label">Resultado del análisis</div>

      <section className="res-resumen">
        {previewUrl && (
          <figure className="res-dibujo">
            <img src={previewUrl} alt="Dibujo analizado" />
          </figure>
        )}
        <div className="res-datos">
          <div className="res-etiqueta">Emoción predominante</div>
          <div className="res-emocion">
            <span className="res-emocion-icono"><visual.Icono size={26} strokeWidth={1.8} /></span>
            {emocion.charAt(0).toUpperCase() + emocion.slice(1)}
          </div>

          <div className="res-intensidad">
            <div className="res-etiqueta">
              Intensidad <strong>{analysisResult.intensityLabel}</strong>
            </div>
            <div className="res-niveles" aria-hidden="true">
              {NIVELES.map((n, i) => (
                <div key={n.clave} className={`res-nivel ${i <= nivel ? 'activo' : ''} ${i === nivel ? 'actual' : ''}`}>
                  <span className="res-nivel-barra" />
                  <span className="res-nivel-label">{n.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="res-meta">
            {analysisResult.duracion && (
              <span className="res-pill">
                <Timer size={14} /> Tiempo de análisis: <strong>{analysisResult.duracion}</strong>
              </span>
            )}
            <span className="res-pill suave">
              <Info size={14} /> Lectura orientativa, no diagnóstica
            </span>
          </div>
        </div>
      </section>

      {analysisResult.simulado && (
        <div className="analysis-notice simulado">Resultado simulado (modo de prueba)</div>
      )}

      {analysisResult.aviso && (
        <div className="analysis-notice">{analysisResult.aviso}</div>
      )}

      {analysisResult.rasgos && analysisResult.rasgos.length > 0 && (
        <Bloque Icono={Eye} titulo="Rasgos observados" sub="Lo que se ve en el dibujo">
          <ul className="res-rasgos">
            {analysisResult.rasgos.map((rasgo, i) => (
              <li key={i} style={{ animationDelay: `${0.15 + i * 0.05}s` }}>{rasgo}</li>
            ))}
          </ul>
        </Bloque>
      )}

      {analysisResult.medicion && (
        <Bloque Icono={Palette} titulo="Medición de color y trazo" sub="Calculada sobre la imagen, sin IA">
          <MedicionImagen medicion={analysisResult.medicion} />
        </Bloque>
      )}

      {analysisResult.interpretacion && (
        <Bloque Icono={Puzzle} titulo="Interpretación" sub="Qué podrían sugerir esos rasgos">
          <Texto texto={analysisResult.interpretacion} />
        </Bloque>
      )}

      <Bloque Icono={Compass} titulo="Lectura orientativa" sub="Síntesis y sugerencias para acompañar" destacado>
        <Texto texto={analysisResult.lectura} />
      </Bloque>

      {contexto && (
        <div className="res-contexto">
          <ContextoResumen ctx={contexto} titulo="Contexto usado en este análisis" />
        </div>
      )}

      <button className="btn-new" onClick={resetAll}>
        <RefreshCw size={16} style={{ marginRight: '4px' }} />
        Analizar otro dibujo
      </button>
    </div>
  );
};

export default AnalyzerResult;
