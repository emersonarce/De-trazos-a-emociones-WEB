import { useState } from 'react';
import './AnalyzerSavePanel.css';

const AnalyzerSavePanel = ({ ninos = [], estado, onGuardarIndependiente, onAsignar, onNoGuardar, ocupado }) => {
  const [ninoSel, setNinoSel] = useState('');

  if (estado) {
    const msg = estado === 'descartado'
      ? 'Análisis descartado. No se guardó.'
      : estado === 'asignado'
        ? 'Análisis guardado y asignado al niño.'
        : 'Análisis guardado como dibujo independiente.';
    return <div className="save-panel done">{msg}</div>;
  }

  return (
    <div className="save-panel">
      <div className="save-panel-title">¿Quieres guardar este análisis?</div>
      <div className="save-panel-sub">Este dibujo se analizó sin asociarlo a un niño. Elige qué hacer con él.</div>

      <div className="save-panel-actions">
        <button className="sp-btn primary" disabled={ocupado} onClick={onGuardarIndependiente}>
          Guardar como dibujo independiente
        </button>

        {ninos.length > 0 && (
          <div className="sp-assign">
            <select value={ninoSel} onChange={(e) => setNinoSel(e.target.value)} disabled={ocupado}>
              <option value="">Asignar a un niño existente…</option>
              {ninos.map((n) => <option key={n.nombre} value={n.nombre}>{n.nombre}</option>)}
            </select>
            <button className="sp-btn" disabled={ocupado || !ninoSel} onClick={() => onAsignar(ninoSel)}>Asignar</button>
          </div>
        )}

        <button className="sp-btn ghost" disabled={ocupado} onClick={onNoGuardar}>No guardar</button>
      </div>
    </div>
  );
};

export default AnalyzerSavePanel;
