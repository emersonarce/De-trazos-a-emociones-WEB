import { Upload, X, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import './AnalyzerUpload.css';
import AnalyzingProgress from './AnalyzingProgress';

const AnalyzerUpload = ({
  setStep, selectedFile, previewUrl,
  handleDrop, handleFileChange, clearFile, fileInputRef,
  error, isAnalyzing, analisisInicio, analyze, onCancelar, mostrarVolver = true,
  descripcion = '', onDescripcionChange
}) => {
  return (
    <div id="screen-2" className="screen">
      {isAnalyzing ? (
        // Mientras se analiza se muestra solo el dibujo (sin la opción de subir).
        previewUrl && (
          <div className="analyzing-preview">
            <img src={previewUrl} alt="Dibujo que se está analizando" />
          </div>
        )
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-icon" style={{background: 'rgba(167, 139, 250, 0.15)', color: 'var(--accent)'}}>
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="2" width="14" height="14" rx="3" />
                <circle cx="6.5" cy="6.5" r="1.5" />
                <path d="M2 12l4-4 3 3 3-3.5 4 4.5" />
              </svg>
            </div>
            <div>
              <div className="card-title">Sube el dibujo</div>
              <div className="card-subtitle">Formatos admitidos: PNG, JPG, WEBP</div>
            </div>
          </div>
          <div className="card-body">
            {!previewUrl ? (
              <div
                className="upload-area"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag'); }}
                onDragLeave={(e) => e.currentTarget.classList.remove('drag')}
                onDrop={handleDrop}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" />
                <div className="upload-icon">
                  <Upload size={28} />
                </div>
                <p className="upload-title">Arrastra el dibujo aquí</p>
                <p className="upload-hint">o haz clic para seleccionar un archivo</p>
              </div>
            ) : (
              <div className="preview-img-wrap">
                <img src={previewUrl} alt="Vista previa" />
                <div className="preview-toolbar">
                  <span className="preview-name">{selectedFile?.name}</span>
                  <button className="btn-remove" onClick={clearFile}>
                    <X size={14} style={{marginRight: '4px', verticalAlign: 'middle'}}/>
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isAnalyzing && (
        <div className="desc-dibujo">
          <label htmlFor="descripcion_dibujo" className="desc-dibujo-label">
            Descripción breve del dibujo <span className="desc-opcional">· opcional</span>
          </label>
          <textarea
            id="descripcion_dibujo"
            className="desc-dibujo-input"
            value={descripcion || ''}
            onChange={onDescripcionChange}
            rows={3}
            maxLength={500}
            placeholder="Ej.: dibujó a su familia en el parque; usó mucho el color oscuro…"
          />
          <div className="desc-dibujo-hint">Es opcional y ayuda a enriquecer el análisis. Funciona con o sin contexto.</div>
        </div>
      )}

      {error && (
        <div className="error-box active">
          <div className="error-icon">
            <AlertCircle size={14} />
          </div>
          <div>
            <strong>Error al analizar</strong><br/>
            <span>{error}</span>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <AnalyzingProgress inicio={analisisInicio} onCancelar={onCancelar} />
      )}

      {!isAnalyzing && (
        <div className="nav-row">
          {mostrarVolver && (
            <button className="btn-back" onClick={() => setStep(1)}>
              <ArrowLeft size={18} style={{marginRight: '6px'}}/>
              Volver
            </button>
          )}
          <button className="btn-analyze" disabled={!selectedFile} onClick={analyze}>
            <Sparkles size={18} /> Analizar emociones
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalyzerUpload;
