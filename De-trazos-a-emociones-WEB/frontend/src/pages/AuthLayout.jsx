import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AuthGraphics from '../components/auth/AuthGraphics';
import { useIntroAuth } from '../components/auth/useIntroAuth';
import './AuthCommon.css';

// Contenedor común del login y el registro. La animación del logo vive aquí
// una sola vez: al pasar de una pantalla a la otra solo cambia el formulario
// (antes cada página montaba su propia animación y arrancaba desde cero).
const AuthLayout = () => {
  // El formulario aparece cuando el logo termina de formarse (o al primer clic/tecla).
  const [introLista, terminarIntro] = useIntroAuth();
  const { pathname } = useLocation();
  // Tras el primer cambio de pantalla, el formulario nuevo entra enseguida
  // (sin la espera pensada para cuando termina la intro).
  const [rutaInicial] = useState(pathname);
  const [huboCambio, setHuboCambio] = useState(false);
  if (!huboCambio && pathname !== rutaInicial) setHuboCambio(true);

  return (
    <div className={`auth-container ${introLista ? '' : 'intro'}`}>
      {/* Panel izquierdo: animación y marca */}
      <AuthGraphics alTerminar={terminarIntro} />

      {/* Panel derecho: formulario de la ruta (Login o Register) */}
      <div className={`right-panel ${introLista ? 'listo' : 'esperando'} ${huboCambio ? 'cambio' : ''}`}>
        <Outlet context={{ introLista }} />
      </div>
    </div>
  );
};

export default AuthLayout;
