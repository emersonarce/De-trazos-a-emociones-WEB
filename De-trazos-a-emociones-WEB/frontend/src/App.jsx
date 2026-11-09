import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthLayout from './pages/AuthLayout';
import Analyzer from './pages/Analyzer';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Terminos from './pages/Terminos';
import Privacidad from './pages/Privacidad';
import Admin from './pages/Admin';
import Configuracion from './pages/Configuracion';
import Reportes from './pages/Reportes';
import Ninos from './pages/Ninos';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import SinSesionRoute from './SinSesionRoute';
import { ThemeProvider } from './context/ThemeContext';
import { TourProvider } from './context/TourContext';
import { AnalisisSesionProvider } from './context/AnalisisSesionContext';
import AnalisisToast from './components/common/AnalisisToast';
import { AvisosProvider } from './context/AvisosContext';
import AvisosFlotantes from './components/common/AvisosFlotantes';
import TooltipGlobal from './components/common/TooltipGlobal';

function App() {
  return (
    <ThemeProvider>
    <AvisosProvider>
    <TourProvider>
    <AnalisisSesionProvider>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* Login y registro comparten AuthLayout: la animación no se reinicia al cambiar */}
      <Route element={<SinSesionRoute><AuthLayout /></SinSesionRoute>}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route path="/terminos" element={<Terminos />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route
      path="/app"
      element={
        <ProtectedRoute>
          <Analyzer />
        </ProtectedRoute>
      }
    />

    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />

    <Route
      path="/historial"
      element={
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      }
      />

    <Route
      path="/admin"
      element={
        <AdminRoute>
          <Admin />
        </AdminRoute>
      }
      />

    <Route
      path="/configuracion"
      element={
        <ProtectedRoute>
          <Configuracion />
        </ProtectedRoute>
      }
      />

    <Route
      path="/reportes"
      element={
        <ProtectedRoute>
          <Reportes />
        </ProtectedRoute>
      }
      />

    <Route
      path="/ninos"
      element={
        <ProtectedRoute>
          <Ninos />
        </ProtectedRoute>
      }
      />
          </Routes>
      <AnalisisToast />
      <AvisosFlotantes />
      <TooltipGlobal />
    </AnalisisSesionProvider>
    </TourProvider>
    </AvisosProvider>
    </ThemeProvider>
        );
      }

      export default App;
