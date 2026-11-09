import { Navigate } from 'react-router-dom';
import { tokenVigente } from './api';
import { leerUsuario } from './utils/permisos';

const AdminRoute = ({ children }) => {
  // Igual que ProtectedRoute: sin sesión válida, fuera.
  if (!tokenVigente()) {
    const habiaToken = Boolean(localStorage.getItem('token'));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to={habiaToken ? '/login?expirado=1' : '/login'} replace />;
  }

  // Además, debe ser administrador.
  let esAdmin;
  try {
    esAdmin = JSON.parse(localStorage.getItem('user') || '{}').esAdmin === true;
  } catch {
    esAdmin = false;
  }

  if (!esAdmin) {
    return <Navigate to="/app" replace />;
  }

  // Con una contraseña temporal, primero hay que cambiarla (ver ProtectedRoute).
  if (leerUsuario().passwordTemporal === true) {
    return <Navigate to="/configuracion" state={{ tab: 'seguridad' }} replace />;
  }

  return children;
};

export default AdminRoute;
