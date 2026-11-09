import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileDown } from 'lucide-react';
import { api } from '../../api';
import { exportarAnalisis } from '../../utils/exportarPdf';
import { useBloquearScroll } from '../../hooks/useBloquearScroll';
import './ExportPdfModal.css';

// Convierte el objectURL de la imagen (blob) en dataURL para incrustarlo en el PDF.
const objectUrlADataUrl = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => resolve(null);
        fr.readAsDataURL(blob);
      })
      .catch(() => resolve(null));
  });

const ExportPdfModal = ({ analisis, imgUrl, onClose }) => {
  const nombre = analisis?.contexto_nino?.nombre;
  const tieneNino = !analisis?.independiente && nombre && nombre !== 'Sin nombre';

  const [incDetalle, setIncDetalle] = useState(true);
  const [incHistorial, setIncHistorial] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');

  useBloquearScroll(true);

  const exportar = async () => {
    if (!incDetalle && !incHistorial) {
      setError('Selecciona al menos una sección.');
      return;
    }
    setGenerando(true);
    setError('');
    try {
      const imagenDataUrl = incDetalle ? await objectUrlADataUrl(imgUrl) : null;

      let historial = null;
      if (incHistorial && tieneNino) {
        const todos = await api.getAnalisis();
        const lista = (todos || []).filter(
          (a) => !a.independiente && a.contexto_nino?.nombre === nombre
        );
        historial = { nombre, lista };
      }

      const base = (tieneNino ? nombre : 'dibujo')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-');

      await exportarAnalisis({
        detalle: incDetalle ? analisis : null,
        imagenDataUrl,
        historial,
        nombreArchivo: `de-trazos-${base}.pdf`,
      });
      onClose();
    } catch (e) {
      setError(e.message || 'No se pudo generar el PDF.');
      setGenerando(false);
    }
  };

  // En <body>, para no quedar corrido dentro de un modal con backdrop-filter
  // (por ejemplo, el detalle del análisis desplazado hacia abajo).
  return createPortal(
    <div
      className="exp-overlay"
      onClick={(e) => {
        e.stopPropagation();
        if (!generando) onClose();
      }}
    >
      <div className="exp-card" onClick={(e) => e.stopPropagation()}>
        <button className="exp-close" onClick={onClose} title="Cerrar">
          <X size={18} />
        </button>
        <h3 className="exp-title">Exportar a PDF</h3>
        <p className="exp-sub">Elige qué incluir en el documento.</p>

        <label className="exp-opt">
          <input
            type="checkbox"
            checked={incDetalle}
            onChange={(e) => setIncDetalle(e.target.checked)}
          />
          <span>
            <strong>Detalle de este análisis</strong>
            <small>Dibujo, rasgos, interpretación, emoción y lectura orientativa.</small>
          </span>
        </label>

        {tieneNino && (
          <label className="exp-opt">
            <input
              type="checkbox"
              checked={incHistorial}
              onChange={(e) => setIncHistorial(e.target.checked)}
            />
            <span>
              <strong>Historial de {nombre}</strong>
              <small>Todos sus análisis con fecha, emoción e intensidad.</small>
            </span>
          </label>
        )}

        {error && <div className="exp-error">{error}</div>}

        <div className="exp-actions">
          <button className="exp-cancel" onClick={onClose} disabled={generando}>
            Cancelar
          </button>
          <button className="exp-go" onClick={exportar} disabled={generando}>
            <FileDown size={16} /> {generando ? 'Generando…' : 'Descargar PDF'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExportPdfModal;
