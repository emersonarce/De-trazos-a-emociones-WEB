import { Navigate } from 'react-router-dom';
import { tokenVigente } from './api';

// Pantallas de acceso (login, registro): con la sesión todavía vigente se va
// directo a la app. Así la contraseña y el código de verificación solo se
// piden de nuevo cuando la sesión expira o se cierra.
const SinSesionRoute = ({ children }) => {
  if (tokenVigente()) return <Navigate to="/app" replace />;
  return children;
};

export default SinSesionRoute;
