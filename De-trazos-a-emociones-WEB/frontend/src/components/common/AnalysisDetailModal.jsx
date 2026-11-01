import { useState } from 'react';
import { X, ZoomIn, RefreshCw, FileDown, Undo2, ImageOff, Timer } from 'lucide-react';
import MedicionImagen from './MedicionImagen';
import './AnalysisDetailModal.css';
import { emotionVisual, intensityInfo, formatFechaHora } from '../../utils/emociones';
import { formatDuracion } from '../../utils/tiempo';
import { limpiarResultadoIA } from '../../utils/textoIA';
import { api } from '../../api';
import AnalyzingProgress from '../analyzer/AnalyzingProgress';
import ExportPdfModal from './ExportPdfModal';
import { useBloquearScroll } from '../../hooks/useBloquearScroll';
import { puedePdf, puedeContexto } from '../../utils/permisos';
import { useImagenAnalisis } from '../../hooks/useImagenAnalisis';
import { useAvisos } from '../../context/AvisosContext';
import { contextoParaReanalizar } from '../../utils/contextoNino';
import { ContextoResumen, ContextoEditor } from './ContextoNino';

// analisisDelNino: los demás análisis del mismo niño, para proponer su contexto
// más completo al reanalizar (ver utils/contextoNino.js).
const AnalysisDetailModal = ({ analisis, analisisDelNino = [], onClose, onActualizado, onDesasignado }) => {
  const [zoom, setZoom] = useState(false);
  const [exportar, setExportar] = useState(false);
  const [resultadoLocal, setResultadoLocal] = useState(null);
  const [yaReanalizado, setYaReanalizado] = useState(false);
  const [reanalizando, setReanalizando] = useState(false);
  const [desasignando, setDesasignando] = useState(false);
  // Reanálisis: null (ver) → 'revisar' (contexto que se usará) → 'editar'.
  const [revision, setRevision] = useState(null);
  const [ctxEdicion, setCtxEdicion] = useState({});
  const [ctxAntesDeEditar, setCtxAntesDeEditar] = useState({});
  const [ctxGuardado, setCtxGuardado] = useState(null); // contexto tras reanalizar
  const { avisarError } = useAvisos();

  const tieneImagen = !!analisis?.ruta_imagen;
  const analisisId = analisis?._id;

  // Imagen protegida con el token (un solo fetch, reusado en el detalle, el zoom y el PDF).
  const { url: imgUrl, error: imgError } = useImagenAnalisis(analisisId, tieneImagen);

  useBloquearScroll(!!analisis);

  if (!analisis) return null;

  const r = limpiarResultadoIA(resultadoLocal || analisis.resultado_ia || {});
  const visual = emotionVisual(r.emocion_predominante || '');
  const inten = intensityInfo(r.intensidad || '');
  const rasgos = Array.isArray(r.rasgos_observados) ? r.rasgos_observados.filter(Boolean) : [];
  const duracion = formatDuracion(r.duracion_ms);
  const lectura = r.lectura_orientativa || r.analisis_completo || 'Sin lectura disponible para este análisis.';

  const sinContexto = !yaReanalizado && analisis.analizado_sin_contexto;
  const conPermiso = puedeContexto();
  const puedeReanalizar = sinContexto && !analisis.independiente && conPermiso;
  const nombreNino = analisis.contexto_nino?.nombre || 'el niño';

  // Contexto que se propone para reanalizar (ver utils/contextoNino.js).
  const ctxPropuesto = contextoParaReanalizar(analisis, analisisDelNino);
  const ctxMostrado = ctxGuardado || (sinContexto ? ctxPropuesto : analisis.contexto_nino || {});

  const abrirRevision = () => {
    setCtxEdicion(ctxPropuesto);
    setRevision('revisar');
  };
  const editar = () => {
    setCtxAntesDeEditar(ctxEdicion);
    setRevision('editar');
  };
  const cancelarEdicion = () => {
    setCtxEdicion(ctxAntesDeEditar);
    setRevision('revisar');
  };

  const reanalizar = async () => {
    setReanalizando(true);
    try {
      const data = await api.reanalizar(analisis._id, ctxEdicion);
      setResultadoLocal(data.analisis);
      setCtxGuardado(data.contexto_nino || ctxEdicion);
      setYaReanalizado(true);
      setRevision(null);
      if (onActualizado) onActualizado(analisis._id, data.analisis, data.contexto_nino || ctxEdicion);
    } catch (err) {
      avisarError('No se pudo reanalizar el dibujo', err);
    } finally {
      setReanalizando(false);
    }
  };

  const desasignar = async () => {
    setDesasignando(true);
    try {
      await api.desasignarAnalisis(analisis._id);
      if (onDesasignado) onDesasignado(analisis._id);
      onClose();
    } catch (err) {
      avisarError('No se pudo quitar el dibujo del niño', err);
      setDesasignando(false);
    }
  };

  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-card" onClick={(e) => e.stopPropagation()}>
        <button className="adm-close" onClick={onClose} title="Cerrar"><X size={20} /></button>

        <div className="adm-head">
          <div className="adm-date">
            {formatFechaHora(analisis.fecha)}
            {duracion && <span className="adm-duracion"><Timer size={13} /> Análisis en {duracion}</span>}
          </div>
          <div className="adm-emotion-row">
            <span className="adm-chip" style={{ background: visual.bg, color: visual.color }}><visual.Icono size={15} /> {r.emocion_predominante || 'Sin emoción'}</span>
            <span className="adm-intensity" style={{ color: inten.color }}>Intensidad {inten.label}</span>
          </div>
          {puedePdf() && (
            <button className="adm-export" onClick={() => setExportar(true)}>
              <FileDown size={15} /> Exportar PDF
            </button>
          )}
        </div>

        {sinContexto && (
          <div className="adm-sincontexto">
            <span className="adm-badge-sc">Analizado sin contexto</span>
            <span className="adm-sc-hint">
              {analisis.independiente
                ? 'Asígnalo a un niño para reanalizar con su contexto.'
                : conPermiso
                  ? 'Puedes reanalizarlo con el contexto del niño (abajo).'
                  : 'Tu cuenta no tiene habilitado el análisis con contexto.'}
            </span>
            {!analisis.independiente && (
              <button className="adm-desasignar" onClick={desasignar} disabled={desasignando || reanalizando}>
                <Undo2 size={14} /> {desasignando ? 'Desasignando…' : 'Desasignar'}
              </button>
            )}
          </div>
        )}

        {/* Dibujo suelto: solo su descripción, si se escribió. */}
        {analisis.independiente && analisis.contexto_nino?.descripcion_dibujo && (
          <div className="adm-contexto">
            <ContextoResumen
              ctx={{ descripcion_dibujo: analisis.contexto_nino.descripcion_dibujo }}
              titulo="Descripción del dibujo"
              subtitulo="Aportada al analizarlo."
            />
          </div>
        )}

        {/* Contexto del niño: el usado en el análisis o, si se analizó sin
            contexto, el que se usará al reanalizar (revisable y editable). */}
        {!analisis.independiente && !reanalizando && (
          <div className="adm-contexto">
            {revision === null && (
              <ContextoResumen
                ctx={ctxMostrado}
                titulo={sinContexto ? `Contexto de ${nombreNino}` : 'Contexto usado en este análisis'}
                subtitulo={sinContexto ? 'Se usará si reanalizas este dibujo.' : undefined}
                acciones={puedeReanalizar ? (
                  <button className="adm-reanalizar" onClick={abrirRevision}>
                    <RefreshCw size={14} /> Reanalizar con contexto
                  </button>
                ) : null}
              />
            )}
            {revision === 'revisar' && (
              <ContextoResumen
                ctx={ctxEdicion}
                titulo="Revisa el contexto antes de reanalizar"
                subtitulo={`Datos de ${nombreNino} que se usarán en el nuevo análisis.`}
                onEditar={editar}
                acciones={(
                  <>
                    <button className="adm-desasignar" onClick={() => setRevision(null)}>Cancelar</button>
                    <button className="adm-reanalizar" onClick={reanalizar}>
                      <RefreshCw size={14} /> Reanalizar ahora
                    </button>
                  </>
                )}
              />
            )}
            {revision === 'editar' && (
              <section className="ctx-resumen">
                <div className="ctx-resumen-titulos">
                  <h4>Editar el contexto de {nombreNino}</h4>
                  <p>Los cambios se guardan junto al nuevo análisis.</p>
                </div>
                <ContextoEditor valor={ctxEdicion} onChange={setCtxEdicion} />
                <div className="ctx-acciones">
                  <button className="adm-desasignar" onClick={cancelarEdicion}>Cancelar</button>
                  <button className="adm-reanalizar" onClick={() => setRevision('revisar')}>Listo</button>
                </div>
              </section>
            )}
          </div>
        )}

        {reanalizando && <AnalyzingProgress />}

        {imgUrl && (
          <div className="adm-image-wrap" onClick={() => setZoom(true)} title="Ampliar dibujo">
            <img src={imgUrl} alt="Dibujo analizado" className="adm-image" />
            <div className="adm-zoom-hint"><ZoomIn size={14} /> Ampliar</div>
          </div>
        )}
        {!imgUrl && tieneImagen && imgError && (
          <div className="adm-image-missing">
            <ImageOff size={22} />
            <span>La imagen de este dibujo no está disponible en este servidor.</span>
          </div>
        )}

        <div className="adm-body">
          {rasgos.length > 0 && (
            <section className="adm-section">
              <h4 className="adm-title">Rasgos observados</h4>
              <ul className="adm-list">
                {rasgos.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </section>
          )}
          {r.medicion_imagen && (
            <section className="adm-section">
              <h4 className="adm-title">Medición de color y trazo</h4>
              <MedicionImagen medicion={r.medicion_imagen} />
            </section>
          )}
          {r.interpretacion && (
            <section className="adm-section">
              <h4 className="adm-title">Interpretación</h4>
              <p className="adm-text">{r.interpretacion}</p>
            </section>
          )}
          <section className="adm-section">
            <h4 className="adm-title">Lectura orientativa</h4>
            <p className="adm-text">{lectura}</p>
          </section>
        </div>
      </div>

      {zoom && imgUrl && (
        <div className="adm-lightbox" onClick={(e) => { e.stopPropagation(); setZoom(false); }} title="Cerrar">
          <img src={imgUrl} alt="Dibujo ampliado" />
        </div>
      )}

      {exportar && (
        <ExportPdfModal analisis={analisis} imgUrl={imgUrl} onClose={() => setExportar(false)} />
      )}
    </div>
  );
};

export default AnalysisDetailModal;
