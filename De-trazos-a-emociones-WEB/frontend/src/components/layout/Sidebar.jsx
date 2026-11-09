import { useNavigate } from 'react-router-dom';
import './Sidebar.css';
import ProfileMenu from '../common/ProfileMenu';
import { puedeContexto } from '../../utils/permisos';

const Sidebar = ({ active }) => {
  const navigate = useNavigate();
  const conContexto = puedeContexto();

  return (
    <aside className="sidebar" data-tour="nav">
      <div className={`nav-item ${active === 'app' ? 'active' : ''}`} title="Analizar dibujo" onClick={() => navigate('/app')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      </div>
      {conContexto && (
        <div className={`nav-item ${active === 'dashboard' ? 'active' : ''}`} title="Dashboard" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </div>
      )}
      {conContexto && (
        <div className={`nav-item ${active === 'history' ? 'active' : ''}`} title="Historial" onClick={() => navigate('/historial')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
      )}
      {conContexto && (
        <div className={`nav-item ${active === 'ninos' ? 'active' : ''}`} title="Mis niños" onClick={() => navigate('/ninos')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="9" cy="7" r="4" />
            <path d="M3 21v-2a4 4 0 0 1 4-4h4" />
            <circle cx="17" cy="17" r="4" />
          </svg>
        </div>
      )}
      {conContexto && (
        <div className={`nav-item ${active === 'reportes' ? 'active' : ''}`} title="Reportes" onClick={() => navigate('/reportes')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M9 13h6M9 17h4" />
          </svg>
        </div>
      )}
      <div style={{ flex: 1 }}></div>
      <div className="sidebar-profile" data-tour="perfil">
        <ProfileMenu placement="sidebar" />
      </div>
    </aside>
  );
};

export default Sidebar;
