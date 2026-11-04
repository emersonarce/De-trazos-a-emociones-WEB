import { Navigate, useLocation } from 'react-router-dom';
import { tokenVigente } from './api';
import { leerUsuario } from './utils/permisos';

const ProtectedRoute = ({ children }) => {
  const { pathname } = useLocation();

  // Sin token, o con token inválido o expirado: no se entra.
  if (!tokenVigente()) {
    // Distinguimos "nunca inició sesión" de "la sesión expiró".
    const habiaToken = Boolean(localStorage.getItem('token'));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to={habiaToken ? '/login?expirado=1' : '/login'} replace />;
  }

  // Contraseña temporal (la restableció el administrador): hay que cambiarla
  // antes de usar la app; mientras tanto solo se puede estar en Configuración.
  if (leerUsuario().passwordTemporal === true && pathname !== '/configuracion') {
    return <Navigate to="/configuracion" state={{ tab: 'seguridad' }} replace />;
  }

  return children;
};

export default ProtectedRoute;
