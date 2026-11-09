import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, Settings, ShieldCheck } from 'lucide-react';
import { api } from '../../api';
import './ProfileMenu.css';

const ROL_LABEL = {
  padre: 'Padre / Madre',
  psicologo: 'Psicólogo(a)',
  profesor: 'Profesor(a)',
};

const leerUsuarioLocal = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

// Menú de perfil (compacto). La foto, "Cambiar de cuenta" y "Eliminar cuenta"
// se gestionan en la página de Configuración.
const ProfileMenu = ({ placement }) => {
  const navigate = useNavigate();
  const contRef = useRef(null);

  const [abierto, setAbierto] = useState(false);
  const [perfil, setPerfil] = useState(leerUsuarioLocal());
  const [fotoUrl, setFotoUrl] = useState(null);

  // Datos autoritativos del perfil (y refresca los permisos guardados).
  useEffect(() => {
    let activo = true;
    api
      .getPerfil()
      .then((p) => {
        if (activo) setPerfil((prev) => ({ ...prev, ...p }));
        try {
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...u, ...p }));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  // Foto de perfil (blob con token).
  useEffect(() => {
    let activo = true;
    let objetoUrl;
    api
      .fetchFotoPerfil()
      .then((blob) => {
        if (!activo || !blob) return;
        objetoUrl = URL.createObjectURL(blob);
        setFotoUrl(objetoUrl);
      })
      .catch(() => {});
    return () => {
      activo = false;
      if (objetoUrl) URL.revokeObjectURL(objetoUrl);
    };
  }, []);

  // Cerrar el menú al hacer clic fuera.
  useEffect(() => {
    const onClick = (e) => {
      if (contRef.current && !contRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const iniciales =
    ((perfil.nombre?.[0] || '') + (perfil.apellido?.[0] || '')).toUpperCase() || 'U';

  const cerrarSesion = () => {
    api.logout();
    navigate('/login');
  };

  return (
    <div className={`profile-menu ${placement === 'sidebar' ? 'en-sidebar' : ''}`} ref={contRef}>
      <button
        className="profile-trigger"
        onClick={() => setAbierto((v) => !v)}
        title="Mi cuenta"
      >
        <span className="profile-avatar">
          {fotoUrl ? <img src={fotoUrl} alt="Foto de perfil" /> : iniciales}
        </span>
        <ChevronDown size={16} className={`profile-chevron ${abierto ? 'open' : ''}`} />
      </button>

      {abierto && (
        <div className="profile-dropdown">
          <div className="profile-head">
            <span className="profile-avatar big">
              {fotoUrl ? <img src={fotoUrl} alt="Foto de perfil" /> : iniciales}
            </span>
            <div className="profile-head-info">
              <div className="profile-name">
                {perfil.nombre} {perfil.apellido || ''}
              </div>
              <div className="profile-email">{perfil.email}</div>
              {perfil.rol && (
                <div className="profile-rol">
                  {ROL_LABEL[perfil.rol] || perfil.rol}
                  {perfil.esAdmin ? ' · Administrador' : ''}
                </div>
              )}
            </div>
          </div>

          {perfil.esAdmin && (
            <button
              className="profile-item"
              onClick={() => {
                setAbierto(false);
                navigate('/admin');
              }}
            >
              <ShieldCheck size={17} />
              Administración
            </button>
          )}

          <button
            className="profile-item"
            onClick={() => {
              setAbierto(false);
              navigate('/configuracion');
            }}
          >
            <Settings size={17} />
            Configuración
          </button>

          <button className="profile-item" onClick={cerrarSesion}>
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
