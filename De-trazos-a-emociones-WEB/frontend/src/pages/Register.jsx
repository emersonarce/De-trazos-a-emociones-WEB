import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, Clock, Loader2, Users, Brain, GraduationCap } from 'lucide-react';
import AuthAviso from '../components/auth/AuthAviso';
import { avisoDeError, correoValido } from '../components/auth/avisos';
import Logo from '../components/common/Logo';
import './Register.css';
import { api } from '../api';
import PasswordChecklist from '../components/common/PasswordChecklist';
import { passwordValida } from '../utils/password';

const ROLES = [
  { valor: 'padre', etiqueta: 'Padre / Madre', Icono: Users },
  { valor: 'psicologo', etiqueta: 'Psicólogo(a)', Icono: Brain },
  { valor: 'profesor', etiqueta: 'Profesor(a)', Icono: GraduationCap },
];

const Register = () => {
  const navigate = useNavigate();
  const [resultado, setResultado] = useState(null);
  const [verPassword, setVerPassword] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [cargando, setCargando] = useState(false);
  // Aviso con diseño propio (en vez de alert). El id vuelve a animarlo en cada intento.
  const [aviso, setAviso] = useState(null);
  const mostrarAviso = (a) => setAviso({ ...a, id: Date.now() });
  const invalido = (campo) => aviso?.campos?.includes(campo);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
    setAviso(null);
  };

  // Validación propia (el form usa noValidate): un aviso a la vez, el primero que falte.
  const validar = () => {
    const faltan = ['nombre', 'apellido'].filter((c) => !formData[c].trim());
    if (faltan.length) {
      return { titulo: 'Escribe tu nombre y apellido', texto: 'Así sabremos quién crea la cuenta.', campos: faltan };
    }
    if (!formData.email.trim()) {
      return { titulo: 'Escribe tu correo', texto: 'Con él iniciarás sesión.', campos: ['email'] };
    }
    if (!correoValido(formData.email)) {
      return { titulo: 'Revisa el correo', texto: 'Parece incompleto. Ejemplo: nombre@correo.com', campos: ['email'] };
    }
    if (!passwordValida(formData.password)) {
      return {
        titulo: formData.password ? 'La contraseña aún no es segura' : 'Crea una contraseña',
        texto: 'Debe cumplir todos los requisitos de la lista.',
        campos: ['password'],
      };
    }
    if (!formData.rol) {
      return { titulo: 'Elige tu rol', texto: 'Indica si eres padre o madre, psicólogo(a) o profesor(a).', campos: ['rol'] };
    }
    if (!aceptaTerminos) {
      return {
        titulo: 'Falta aceptar los términos',
        texto: 'Para crear la cuenta debes aceptar los Términos y Condiciones y la Política de Privacidad.',
        campos: ['terminos'],
      };
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cargando) return;
    const error = validar();
    if (error) {
      mostrarAviso(error);
      return;
    }
    setCargando(true);
    try {
      const data = await api.register({ ...formData, email: formData.email.trim() });
      setResultado({
        estado: data.estado || 'pendiente',
        message: data.message || 'Registro recibido.'
      });
    } catch (error) {
      mostrarAviso(avisoDeError(error));
    } finally {
      setCargando(false);
    }
  };

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

      {resultado ? (
        <div className="register-success">
          <div className={`success-icon ${resultado.estado === 'aprobado' ? 'ok' : 'wait'}`}>
            {resultado.estado === 'aprobado' ? <CheckCircle size={44} /> : <Clock size={44} />}
          </div>
          <h1>{resultado.estado === 'aprobado' ? 'Cuenta creada' : 'Registro recibido'}</h1>
          <p className="success-msg">{resultado.message}</p>
          <p className="success-hint">
            {resultado.estado === 'aprobado'
              ? 'Ya puedes iniciar sesión con tu correo y contraseña.'
              : 'Cuando el administrador apruebe tu cuenta podrás iniciar sesión. La verificación de la autorización del representante legal la realiza la institución o entidad profesional.'}
          </p>
          <button type="button" className="btn-submit" onClick={() => navigate('/login')}>
            Ir a iniciar sesión
          </button>
        </div>
      ) : (
      <>
      <div className="form-header">
        <h1>Crear cuenta</h1>
        <p>Completa tus datos para empezar.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <div className={`input-wrapper ${invalido('nombre') ? 'invalido' : ''}`}>
              <div className="input-icon">
                <User size={20} />
              </div>
                <input 
                  type="text" 
                  id="nombre"
                  aria-invalid={invalido('nombre') || undefined}
                  placeholder="Ej: Laura" 
                  required 
                  value={formData.nombre}
                  onChange={handleChange}
                />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="apellido">Apellido</label>
            <div className={`input-wrapper ${invalido('apellido') ? 'invalido' : ''}`}>
              <div className="input-icon">
                <User size={20} />
              </div>
              <input 
                type="text" 
                id="apellido"
                aria-invalid={invalido('apellido') || undefined}
                placeholder="Ej: Gómez" 
                required 
                value={formData.apellido}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo electrónico</label>
          <div className={`input-wrapper ${invalido('email') ? 'invalido' : ''}`}>
            <div className="input-icon">
              <Mail size={20} />
            </div>
            <input 
              type="email" 
              id="email"
              aria-invalid={invalido('email') || undefined}
              placeholder="nombre@correo.com" 
              required 
              value={formData.email}
              onChange={handleChange}
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
              autoComplete="new-password"
              aria-invalid={invalido('password') || undefined}
              placeholder="Contraseña segura"
              required
              value={formData.password}
              onChange={handleChange}
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
          <p className="input-hint">Mínimo 8 caracteres, con mayúscula, minúscula, número y un símbolo.</p>
          <PasswordChecklist password={formData.password} />
        </div>
        
        <div className="form-group">
          <span className="form-label" id="rol-label">Rol</span>
          <div
            className={`rol-opciones ${invalido('rol') ? 'invalido' : ''}`}
            role="radiogroup"
            aria-labelledby="rol-label"
            aria-invalid={invalido('rol') || undefined}
          >
            {ROLES.map(({ valor, etiqueta, Icono }) => (
              <label key={valor} className={`rol-opcion ${formData.rol === valor ? 'activo' : ''}`}>
                <input
                  type="radio"
                  name="rol"
                  value={valor}
                  checked={formData.rol === valor}
                  onChange={() => { setFormData({ ...formData, rol: valor }); setAviso(null); }}
                />
                <span className="rol-icono"><Icono size={18} /></span>
                <span className="rol-texto">{etiqueta}</span>
              </label>
            ))}
          </div>
        </div>

        <label className={`checkbox-group ${invalido('terminos') ? 'invalido' : ''}`}>
          <input
            type="checkbox"
            required
            checked={aceptaTerminos}
            onChange={(e) => { setAceptaTerminos(e.target.checked); setAviso(null); }}
            aria-invalid={invalido('terminos') || undefined}
          />
          <span>Acepto los <a href="/terminos" target="_blank" rel="noreferrer">Términos y Condiciones</a> y la <a href="/privacidad" target="_blank" rel="noreferrer">Política de Privacidad</a> de De trazos a emociones.</span>
        </label>

        {/* Junto al botón: el formulario es largo y aquí se ve al enviarlo. */}
        <AuthAviso aviso={aviso} onCerrar={() => setAviso(null)} className="junto-boton" />

        <button type="submit" className="btn-submit" disabled={cargando}>
          {cargando ? <><Loader2 size={18} className="girando" /> Creando cuenta…</> : 'Crear cuenta'}
        </button>
      </form>

      <div className="form-footer">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </div>
      </>
      )}

    </div>
  );
};

export default Register;
