import { useState } from 'react';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import './IndependientesGrid.css';
import { api } from '../../api';
import AuthImage from '../common/AuthImage';
import ConfirmDialog from '../common/ConfirmDialog';
import { emotionVisual, intensityInfo, formatFechaHora } from '../../utils/emociones';
import { useAvisos } from '../../context/AvisosContext';

const Tarjeta = ({ analisis, ninos, onSelect, onDeleted, onAsignado }) => {
  const { avisarError } = useAvisos();
  const [ninoSel, setNinoSel] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [porBorrar, setPorBorrar] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const r = analisis.resultado_ia || {};
  const visual = emotionVisual(r.emocion_predominante || '');
  const inten = intensityInfo(r.intensidad || '');

  const asignar = async (e) => {
    e.stopPropagation();
    if (!ninoSel) return;
    const nino = ninos.find((n) => n.nombre === ninoSel);
    setOcupado(true);
    try {
      await api.asignarAnalisis(analisis._id, {
        nombre: nino.nombre,
        edad: nino.edad,
        fecha_nacimiento: nino.fecha_nacimiento,
        genero: nino.genero,
      });
      if (onAsignado) onAsignado(analisis._id);
    } catch (err) {
      avisarError('No se pudo asignar el dibujo', err);
    } finally {
      setOcupado(false);
    }
  };

  const pedirBorrar = (e) => {
    e.stopPropagation();
    setPorBorrar(true);
  };

  const confirmarBorrado = async () => {
    setBorrando(true);
    try {
      await api.eliminarAnalisis(analisis._id);
      if (onDeleted) onDeleted(analisis._id);
      setPorBorrar(false);
    } catch (err) {
      avisarError('No se pudo eliminar el dibujo', err);
    } finally {
      setBorrando(false);
    }
  };

  return (
    <>
    <div className="ind-card" onClick={() => onSelect(analisis)} title="Ver el dibujo y el análisis">
      <div className="ind-thumb">
        {analisis.ruta_imagen ? <AuthImage analisisId={analisis._id} alt="Dibujo" /> : <ImageIcon size={30} style={{ color: 'var(--muted)' }} />}
        <button className="ind-delete" title="Eliminar" onClick={pedirBorrar}><Trash2 size={16} /></button>
      </div>
      <div className="ind-body">
        <div className="ind-meta">
          <span className="ind-chip" style={{ background: visual.bg, color: visual.color }}>
            <visual.Icono size={13} /> {r.emocion_predominante || 'Sin emoción'}
          </span>
          <span className="ind-inten" style={{ color: inten.color }}>Int. {inten.label}</span>
        </div>
        <div className="ind-date">{formatFechaHora(analisis.fecha)}</div>
        <div className="ind-assign" onClick={(e) => e.stopPropagation()}>
          <select value={ninoSel} onChange={(e) => setNinoSel(e.target.value)} disabled={ocupado || ninos.length === 0}>
            <option value="">{ninos.length === 0 ? 'No hay niños' : 'Asignar a…'}</option>
            {ninos.map((n) => <option key={n.nombre} value={n.nombre}>{n.nombre}</option>)}
          </select>
          <button className="ind-assign-btn" disabled={ocupado || !ninoSel} onClick={asignar}>Asignar</button>
        </div>
      </div>
    </div>
      <ConfirmDialog
        abierto={porBorrar}
        peligro
        titulo="Eliminar dibujo"
        mensaje="¿Eliminar este dibujo y su análisis?"
        detalle="Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        cargando={borrando}
        onConfirmar={confirmarBorrado}
        onCancelar={() => setPorBorrar(false)}
      />
    </>
  );
};

const IndependientesGrid = ({ sessions = [], ninos = [], onSelect, onDeleted, onAsignado }) => {
  if (sessions.length === 0) {
    return <div className="ind-empty">No hay dibujos independientes.</div>;
  }
  return (
    <div className="ind-grid">
      {sessions.map((a) => (
        <Tarjeta key={a._id} analisis={a} ninos={ninos} onSelect={onSelect} onDeleted={onDeleted} onAsignado={onAsignado} />
      ))}
    </div>
  );
};

export default IndependientesGrid;
