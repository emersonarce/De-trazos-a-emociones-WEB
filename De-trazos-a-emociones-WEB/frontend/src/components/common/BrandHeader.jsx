import './BrandHeader.css';
import Logo from './Logo';
import Notificaciones from './Notificaciones';

const BrandHeader = () => (
  <div className="brand-header">
    <div className="brand-header-left">
      <div className="brand-header-icon">
        <Logo size={36} />
      </div>
      <div className="brand-header-text">
        <span className="brand-header-name">De trazos a emociones</span>
        <span className="brand-header-sub">Psicología infantil · IA</span>
      </div>
    </div>
    <Notificaciones />
  </div>
);

export default BrandHeader;
