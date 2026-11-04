import { useRef, useEffect, useState } from 'react';
import { AlertCircle, Lock, X } from 'lucide-react';
import './Analyzer.css';
import Sidebar from '../components/layout/Sidebar';
import AnalyzerContext from '../components/analyzer/AnalyzerContext';
import AnalyzerUpload from '../components/analyzer/AnalyzerUpload';
import { ContextoResumen } from '../components/common/ContextoNino';
import AnalyzerResult from '../components/analyzer/AnalyzerResult';
import AnalyzerSavePanel from '../components/analyzer/AnalyzerSavePanel';
import { useAnalisisSesion } from '../context/AnalisisSesionContext';
import { useTour } from '../context/TourContext';
import Logo from '../components/common/Logo';
import HeroDecoracion from '../components/analyzer/HeroDecoracion';
import { puedeContexto } from '../utils/permisos';

// Campos de contexto del niño; si todos están vacíos, "Con contexto" no aporta
// nada y el análisis equivaldría a "Solo dibujo".
const CAMPOS_CONTEXTO = [
  'nombre', 'edad', 'fecha_nacimiento', 'genero', 'situacion_actual', 'comportamiento',
  'diagnostico_previo', 'dibujo_espontaneo', 'comento_mientras', 'tiempo_dibujo',
];

const Analyzer = () => {
  const fileInputRef = useRef(null);

  const { start: iniciarTour } = useTour();

  const {
    modo, ninoConocido, step, setStep, formData,
    selectedFile, previewUrl, isAnalyzing, error, analysisResult,
    pendienteGuardar, guardadoEstado, guardando, ninosExistentes, analisisInicio,
    handleInputChange, handleRadioChange, handleFileChange, handleDrop, clearFile,
    cargarNinos, cambiarModo, analizar, cancelarAnalisis, nuevaSesion,
    guardarIndependiente, asignarANino, noGuardar, resetAll, setNotificacion,
  } = useAnalisisSesion();

  // Solo quien tiene permiso puede analizar CON contexto; el resto, solo dibujo.
  const conContexto = puedeContexto();

  // Al entrar al Analyzer: refresca la lista de niños, limpia el aviso pendiente
  // y lanza el recorrido guiado la primera vez (o si se pidió desde Configuración).
  useEffect(() => {
    const t = setTimeout(() => {
      cargarNinos();
      setNotificacion(null);
      if (!puedeContexto()) cambiarModo('solo');
      try {
        if (localStorage.getItem('tutorial_forzar') === '1' || localStorage.getItem('tutorial_visto') !== '1') {
          iniciarTour();
        }
      } catch { /* ignore */ }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const onClear = () => {
    clearFile();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Aviso cuando se pasa a "Solo dibujo" por continuar sin escribir contexto.
  const [avisoSinContexto, setAvisoSinContexto] = useState(false);

  // Falta el nombre o alias del niño (se marca al intentar continuar sin él).
  const [faltaAlias, setFaltaAlias] = useState(false);

  // Al continuar desde el formulario de contexto: si no hay ningún dato escrito,
  // se cambia a "Solo dibujo" y se avisa; si hay algún dato, se sigue con
  // contexto, siempre que tenga nombre o alias (agrupa sus dibujos).
  const continuarContexto = () => {
    const hayContexto = CAMPOS_CONTEXTO.some((k) => String(formData[k] || '').trim() !== '');
    if (hayContexto) {
      if (!String(formData.nombre || '').trim()) {
        setFaltaAlias(true);
        document.getElementById('nombre')?.focus();
        return;
      }
      setFaltaAlias(false);
      setAvisoSinContexto(false);
      setStep(2);
    } else {
      setAvisoSinContexto(true);
      cambiarModo('solo');
    }
  };

  // Barra de pasos: no sirve para avanzar ni cambia el modo. Los pasos que
  // faltan se ven bloqueados hasta terminar el anterior (se avanza con el botón
  // de cada paso); a uno ya hecho sí se puede volver. El texto de ayuda va en
  // data-tip (lo muestra TooltipGlobal): con title quedaría pegado el anterior
  // cuando el paso pasa a ser el actual.
  const propsPaso = (n) => {
    if (step === n) return { className: 'step active', 'aria-current': 'step' };
    if (step > n) return { className: 'step done', onClick: () => setStep(n), 'data-tip': 'Volver a este paso' };
    return { className: 'step bloqueado', 'aria-disabled': true, 'data-tip': 'Se habilita al terminar el paso anterior' };
  };

  return (
    <div className="analyzer-wrapper">
      <Sidebar active="app" />
      <div className="bg-dots"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
      <div className="container">

        <header className="hero">
          <div className="hero-logo" aria-hidden="true">
            <Logo size={60} />
          </div>
          <div className="hero-text">
            <div className="hero-name">De trazos a emociones</div>
            <div className="hero-tag">Psicología infantil · IA</div>
          </div>
          <HeroDecoracion />
        </header>

        {ninoConocido && !isAnalyzing && (
          <div className="nino-activo-bar">
            <div className="nino-activo-info">
              Analizando a <strong>{formData.nombre}</strong>
              <span>Puedes seguir con el mismo niño o empezar uno nuevo.</span>
            </div>
            <div className="nino-activo-acts">
              <button className="nino-activo-btn" onClick={nuevaSesion}>Analizar otro niño</button>
              <button className="nino-activo-btn ghost" onClick={() => cambiarModo('solo')}>Solo dibujo</button>
            </div>
          </div>
        )}

        {!ninoConocido && !isAnalyzing && conContexto && (
          <div className="modo-selector" data-tour="modo">
            <button className={`modo-opt ${modo === 'contexto' ? 'active' : ''}`} onClick={() => { setAvisoSinContexto(false); cambiarModo('contexto'); }}>
              Con contexto del niño
            </button>
            <button className={`modo-opt ${modo === 'solo' ? 'active' : ''}`} onClick={() => { setAvisoSinContexto(false); cambiarModo('solo'); }}>
              Solo dibujo
            </button>
          </div>
        )}

        {!ninoConocido && !isAnalyzing && !conContexto && (
          <div className="aviso-modo" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} className="aviso-modo-icon" />
            <span>
              Tu cuenta analiza <strong>dibujos sueltos</strong> (con su descripción). Para el análisis con contexto del niño, pídele acceso al administrador.
            </span>
          </div>
        )}

        <div className="steps" data-tour="pasos">
          {modo === 'contexto' && (
            <>
              <div {...propsPaso(1)}>
                <div className="step-num">1</div> Contexto
              </div>
              <div className="step-divider"></div>
            </>
          )}
          <div {...propsPaso(2)}>
            <div className="step-num">{modo === 'contexto' ? '2' : '1'}</div> Dibujo
            {step < 2 && <Lock size={12} className="step-candado" aria-hidden="true" />}
          </div>
          <div className="step-divider"></div>
          <div {...propsPaso(3)}>
            <div className="step-num">{modo === 'contexto' ? '3' : '2'}</div> Análisis
            {step < 3 && <Lock size={12} className="step-candado" aria-hidden="true" />}
          </div>
        </div>

        {avisoSinContexto && step === 2 && (
          <div className="aviso-modo">
            <AlertCircle size={16} className="aviso-modo-icon" />
            <span>
              No agregaste datos de contexto, así que el análisis se hará como <strong>Solo dibujo</strong>. Puedes{' '}
              <button type="button" className="aviso-modo-link" onClick={() => { setAvisoSinContexto(false); cambiarModo('contexto'); }}>
                agregar contexto
              </button>{' '}
              si lo prefieres.
            </span>
            <button type="button" className="aviso-modo-cerrar" onClick={() => setAvisoSinContexto(false)} aria-label="Cerrar aviso">
              <X size={15} />
            </button>
          </div>
        )}

        {step === 1 && (
          <AnalyzerContext
            formData={formData}
            handleInputChange={handleInputChange}
            handleRadioChange={handleRadioChange}
            onContinuar={continuarContexto}
            ninoConocido={ninoConocido}
            faltaAlias={faltaAlias && !String(formData.nombre || '').trim()}
          />
        )}

        {/* El contexto se ve mientras se sube el dibujo (y se puede editar). */}
        {step === 2 && modo === 'contexto' && !isAnalyzing && (
          <div className="ctx-paso">
            <ContextoResumen
              ctx={{ ...formData, descripcion_dibujo: '' }} /* la descripción se escribe justo abajo */
              titulo={formData.nombre ? `Contexto de ${formData.nombre}` : 'Contexto del niño'}
              subtitulo="Se usará en este análisis."
              onEditar={() => setStep(1)}
            />
          </div>
        )}

        {step === 2 && (
          <AnalyzerUpload
            setStep={setStep}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            handleDrop={handleDrop}
            handleFileChange={handleFileChange}
            clearFile={onClear}
            fileInputRef={fileInputRef}
            error={error}
            isAnalyzing={isAnalyzing}
            analisisInicio={analisisInicio}
            analyze={analizar}
            onCancelar={cancelarAnalisis}
            mostrarVolver={modo === 'contexto'}
            descripcion={formData.descripcion_dibujo}
            onDescripcionChange={handleInputChange}
          />
        )}

        {step === 3 && analysisResult && (
          <>
            {(pendienteGuardar || guardadoEstado) && (
              <AnalyzerSavePanel
                ninos={ninosExistentes}
                estado={guardadoEstado}
                ocupado={guardando}
                onGuardarIndependiente={guardarIndependiente}
                onAsignar={asignarANino}
                onNoGuardar={noGuardar}
              />
            )}
            <AnalyzerResult
              analysisResult={analysisResult}
              resetAll={resetAll}
              previewUrl={previewUrl}
              contexto={modo === 'contexto'
                ? formData
                : (formData.descripcion_dibujo?.trim() ? { descripcion_dibujo: formData.descripcion_dibujo } : null)}
            />
          </>
        )}

        <div className="footer">De trazos a emociones · No reemplaza diagnóstico clínico</div>
      </div>
    </div>
  );
};

export default Analyzer;
