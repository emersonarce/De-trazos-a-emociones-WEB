import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';
import './HistoryChildBar.css';
import { useAnalisisSesion } from '../../context/AnalisisSesionContext';
import { textoEdad } from '../../utils/emociones';

const HistoryChildBar = ({ childrenList, activeChild, setActiveChild, hayIndependientes, independientesKey }) => {
  const navigate = useNavigate();
  const { nuevaSesion } = useAnalisisSesion();
  return (
    <div className="child-bar">
      {childrenList && childrenList.map((child, i) => {
        // Generar un color semi-aleatorio basado en el nombre para mantener consistencia
        // Variables CSS para que los colores sigan el tema claro/oscuro.
        const colors = [
          { bg: 'var(--accent-dim)', color: 'var(--purple-light)' },
          { bg: 'color-mix(in srgb, var(--teal) 20%, transparent)', color: 'var(--teal)' },
          { bg: 'color-mix(in srgb, var(--amber) 20%, transparent)', color: 'var(--amber)' },
          { bg: 'rgba(244,114,182,0.2)', color: '#ec4899' }
        ];
        const style = colors[i % colors.length];
        const initials = child.nombre ? child.nombre.substring(0, 2).toUpperCase() : '?';
        // La edad de hoy si hay fecha de nacimiento (como en el Inicio), no la del último dibujo.
        const edad = textoEdad(child);

        return (
          <div key={i} className={`child-pill ${activeChild === child.nombre ? 'active' : ''}`} onClick={() => setActiveChild(child.nombre)}>
            <div className="child-avatar" style={{background: style.bg, color: style.color}}>{initials}</div>
            <span className="child-name">{child.nombre}</span>
            {edad && <span className="child-age">· {edad}</span>}
          </div>
        );
      })}
      
      {(!childrenList || childrenList.length === 0) && (
        <div className="child-pill">
          <span className="child-name" style={{color: 'var(--muted)'}}>No hay niños analizados aún</span>
        </div>
      )}

      {hayIndependientes && (
        <div
          className={`child-pill ${activeChild === independientesKey ? 'active' : ''}`}
          onClick={() => setActiveChild(independientesKey)}
          title="Dibujos analizados sin asociar a un niño"
        >
          <div className="child-avatar" style={{background: 'var(--emo-calma-bg)', color: 'var(--emo-calma)'}}><ImageIcon size={15} /></div>
          <span className="child-name">Dibujos independientes</span>
        </div>
      )}

      <div className="child-pill" style={{borderStyle: 'dashed', cursor: 'pointer'}} title="Registrar un niño nuevo con su contexto" onClick={() => { nuevaSesion(); navigate('/app'); }}>
        <div className="child-avatar" style={{background: 'var(--card2)', color: 'var(--muted)'}}>+</div>
        <span className="child-name" style={{color: 'var(--muted)'}}>Agregar niño</span>
      </div>
    </div>
  );
};

export default HistoryChildBar;
