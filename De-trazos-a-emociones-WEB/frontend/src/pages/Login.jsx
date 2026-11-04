import { useState } from 'react';
import { useNavigate, useSearchParams, Link, useOutletContext } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import AuthAviso from '../components/auth/AuthAviso';
import { avisoDeError, correoValido } from '../components/auth/avisos';
import Logo from '../components/common/Logo';
import { api } from '../api';
import { useAnalisisSesion } from '../context/AnalisisSesionContext';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sesionExpirada = searchParams.get('expirado') === '1';
  const { nuevaSesion } = useAnalisisSesion();
  // La intro (animación del logo) la maneja AuthLayout.
  const { introLista } = useOutletContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  // Aviso con diseño propio (en vez de alert). El id vuelve a animarlo en cada intento.
  const [aviso, setAviso] = useState(null);
  const [verExpirada, setVerExpirada] = useState(sesionExpirada);
  const mostrarAviso = (a) => setAviso({ ...a, id: Date.now() });
  const invalido = (campo) => aviso?.campos?.includes(campo);

  // Paso de verificación (DEMO): tras la contraseña se pide un código de 6 dígitos.
  // Por ahora CUALQUIER código de 6 dígitos es válido; el envío real por correo
  // (2FA de verdad) queda como mejora futura.
  const [paso, setPaso] = useState(1);
  const [datosLogin, setDatosLogin] = useState(null);
  const [codigo, setCodigo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cargando) return;
    if (!email.trim()) {
      mostrarAviso({ titulo: 'Escribe tu correo', texto: 'Lo necesitamos para encontrar tu cuenta.', campos: ['email'] });
      return;
    }
    if (!correoValido(email)) {
      mostrarAviso({ titulo: 'Revisa el correo', texto: 'Parece incompleto. Ejemplo: nombre@correo.com', campos: ['email'] });
      return;
    }
    if (!password) {
      mostrarAviso({ titulo: 'Escribe tu contraseña', campos: ['password'] });
      return;
    }
    setCargando(true);
    try {
      const data = await api.login({ email: email.trim(), password });
      setDatosLogin(data);
      setCodigo('');
      setAviso(null);
      setVerExpirada(false);
      setPaso(2);
    } catch (error) {
      mostrarAviso(avisoDeError(error));
    } finally {
      setCargando(false);
    }
  };

  const verificarCodigo = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo)) {
      mostrarAviso({
        titulo: codigo ? 'Código incompleto' : 'Escribe el código',
        texto: 'El código tiene 6 dígitos.',
        campos: ['codigo'],
      });
      return;
    }
    // DEMO: no se valida contra un código real; cualquier código de 6 dígitos entra.
    localStorage.setItem('token', datosLogin.token);
    if (datosLogin.usuario) {
      localStorage.setItem('user', JSON.stringify(datosLogin.usuario));
    }
    nuevaSesion();
    // Contraseña temporal (la restableció el administrador): primero se cambia.
    if (datosLogin.usuario?.passwordTemporal) {
      navigate('/configuracion', { state: { tab: 'seguridad' } });
    } else {
      navigate('/app');
    }
  };

  // Olvido de contraseña: nadie puede ver las contraseñas (se guardan
  // cifradas); el administrador genera una temporal desde su panel.
  const avisarOlvido = () =>
    mostrarAviso({
      tipo: 'info',
      titulo: '¿Olvidaste tu contraseña?',
      texto: 'Contacta al administrador: te dará una contraseña temporal para entrar, y luego la cambias por una tuya.',
    });

  return (
    <div className="form-container">

      <div className="brand">
        <div className="brand-icon">
          <Logo size={36} />
        </div>
        <div className="brand-text">
          <h2>De trazos a emociones</h2>
          <p>PSICOLOGÍA INFANTIL</p>
        </div>
      </div>

      {paso === 1 ? (
        <>
          <div className="form-header">
            <h1>Iniciar sesión</h1>
            <p>Ingresa con tu correo y contraseña para continuar.</p>
          </div>

          {/* Se monta al aparecer el formulario para que su animación se vea. */}
          {introLista && verExpirada && (
            <AuthAviso
              aviso={{ tipo: 'info', icono: 'espera', titulo: 'Tu sesión expiró', texto: 'Por seguridad, vuelve a iniciar sesión.' }}
              onCerrar={() => setVerExpirada(false)}
            />
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <div className={`input-wrapper ${invalido('email') ? 'invalido' : ''}`}>
                <div className="input-icon">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  id="email"
                  placeholder="nombre@correo.com"
                  autoComplete="email"
                  required
                  aria-invalid={invalido('email') || undefined}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setAviso(null); }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className={`input-wrapper ${invalido('password') ? 'invalido' : ''}`}>
                <div className="input-icon">
                  <Lock size={20} />
                </div>
                <input
                  type={verPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••"
                  autoComplete="current-password"
                  required
                  aria-invalid={invalido('password') || undefined}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAviso(null); }}
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {verPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="olvido-fila">
                <button type="button" className="olvido-link" onClick={avisarOlvido}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <AuthAviso aviso={aviso} onCerrar={() => setAviso(null)} />

            <button type="submit" className="btn-submit" disabled={cargando}>
              {cargando ? <><Loader2 size={18} className="girando" /> Ingresando…</> : 'Continuar'}
            </button>
          </form>

          <div className="form-footer">
            ¿Aún no tienes cuenta? <Link to="/register">Crear cuenta</Link>
          </div>
        </>
      ) : (
        <>
          <div className="form-header">
            <h1>Verificación en dos pasos</h1>
            <p>Ingresa el código de 6 dígitos para continuar</p>
          </div>

          <form onSubmit={verificarCodigo} noValidate>
            <div className="form-group">
              <label htmlFor="codigo">Código de verificación</label>
              <div className={`input-wrapper ${invalido('codigo') ? 'invalido' : ''}`}>
                <div className="input-icon">
                  <KeyRound size={20} />
                </div>
                <input
                  type="text"
                  id="codigo"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="— — — — — —"
                  required
                  aria-invalid={invalido('codigo') || undefined}
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setAviso(null);
                  }}
                />
              </div>
            </div>

            <AuthAviso aviso={aviso} onCerrar={() => setAviso(null)} />

            <button type="submit" className="btn-submit">
              Verificar y entrar
            </button>
          </form>

          <div className="form-footer">
            <button
              type="button"
              onClick={() => { setPaso(1); setDatosLogin(null); setAviso(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
            >
              ← Volver
            </button>
          </div>
        </>
      )}

    </div>
  );
};

export default Login;
