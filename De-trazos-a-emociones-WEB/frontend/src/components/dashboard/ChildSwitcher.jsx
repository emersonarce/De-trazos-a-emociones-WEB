import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ChildSwitcher.css';
import { emotionVisual, emocionPredominante, textoEdad } from '../../utils/emociones';
import { api } from '../../api';
import { useAnalisisSesion } from '../../context/AnalisisSesionContext';
import ConfirmDialog from '../common/ConfirmDialog';
import { useAvisos } from '../../context/AvisosContext';

const ChildSwitcher = ({ ninos = [], activeChild, setActiveChild, onDeleted }) => {
  const { avisarError } = useAvisos();
  const navigate = useNavigate();
  const { nuevaSesion } = useAnalisisSesion();
  const [porBorrar, setPorBorrar] = useState(null);
  const [fase2, setFase2] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const pedirBorrar = (e, nino) => {
    e.stopPropagation();
    setFase2(false);
    setPorBorrar(nino);
  };

  const cancelarBorrado = () => {
    setPorBorrar(null);
    setFase2(false);
  };

  const confirmarBorrado = async () => {
    if (!porBorrar) return;
    setBorrando(true);
    const ids = porBorrar.analisis.map((a) => a._id);
    try {
      await api.eliminarNino(ids);
      if (onDeleted) onDeleted(ids);
      cancelarBorrado();
    } catch (err) {
      avisarError('No se pudo eliminar al niño', err);
    } finally {
      setBorrando(false);
    }
  };

  return (
    <>
    <div className="child-switcher">
      {ninos.map((nino) => {
        const emocion = emocionPredominante(nino.analisis);
        const visual = emotionVisual(emocion || '');
        const inicial = (nino.nombre || '?').charAt(0).toUpperCase();
        return (
          <div
            key={nino.nombre}
            className={`child-card ${activeChild === nino.nombre ? 'active' : ''}`}
            onClick={() => setActiveChild(nino.nombre)}
          >
            <div className="child-avatar-lg" style={{ background: visual.bg, color: visual.color }}>{inicial}</div>
            <div className="child-info">
              <div className="child-cname">{nino.nombre}</div>
              <div className="child-cage">{textoEdad(nino) || `${nino.analisis.length} análisis`}</div>
            </div>
            <span className="child-mood"><visual.Icono size={18} style={{ color: visual.color }} /></span>
            <button className="child-delete" title="Eliminar niño" onClick={(e) => pedirBorrar(e, nino)}>
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
      <div className="add-child" data-tour="agregar" title="Registrar un niño nuevo con su contexto" onClick={() => { nuevaSesion(); navigate('/app'); }}>
        <Plus size={18} />
        Agregar niño
      </div>
    </div>

      <ConfirmDialog
        abierto={!!porBorrar && !fase2}
        peligro
        titulo="Eliminar niño"
        mensaje={porBorrar ? `¿Eliminar a "${porBorrar.nombre}" y sus ${porBorrar.analisis.length} análisis?` : ''}
        detalle="Se borrarán también sus dibujos."
        textoConfirmar="Continuar"
        onConfirmar={() => setFase2(true)}
        onCancelar={cancelarBorrado}
      />
      <ConfirmDialog
        abierto={!!porBorrar && fase2}
        peligro
        titulo="Confirmar eliminación"
        mensaje={porBorrar ? `Vas a eliminar definitivamente a "${porBorrar.nombre}".` : ''}
        detalle="Esta acción no se puede deshacer."
        textoConfirmar="Eliminar definitivamente"
        cargando={borrando}
        onConfirmar={confirmarBorrado}
        onCancelar={cancelarBorrado}
      />
    </>
  );
};

export default ChildSwitcher;
