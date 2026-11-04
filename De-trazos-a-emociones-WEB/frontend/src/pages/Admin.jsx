import { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Inbox, RefreshCw, Ban, Trash2, RotateCcw, KeyRound } from 'lucide-react';
import { api } from '../api';
import Sidebar from '../components/layout/Sidebar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import HistorialAdmin from '../components/admin/HistorialAdmin';
import { leerUsuario } from '../utils/permisos';
import './Admin.css';
import { useAvisos } from '../context/AvisosContext';

const FILTROS = [
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'aprobado', label: 'Aprobados' },
  { key: 'rechazado', label: 'Rechazados' },
  // Cuentas que su usuario eliminó (con permiso): están desactivadas, con sus
  // datos, hasta que el administrador las restaure o las elimine definitivamente.
  { key: 'eliminado', label: 'Cuentas eliminadas' },
  // No es un estado de cuenta: lo que han hecho los administradores en el panel.
  { key: 'historial', label: 'Historial' },
];

const VACIO = {
  pendiente: 'pendientes',
  aprobado: 'aprobadas',
  rechazado: 'rechazadas',
  eliminado: 'eliminadas',
};

const ROL_LABEL = {
  padre: 'Padre / Madre',
  psicologo: 'Psicólogo(a)',
  profesor: 'Profesor(a)',
};

// Copia al portapapeles. Por http (p. ej. el servidor por su IP) no existe
// navigator.clipboard: se usa el método antiguo con un textarea.
async function copiarTexto(texto) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch { /* se intenta el método antiguo */ }
  try {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

const Admin = () => {
  const { avisarError } = useAvisos();
  const [filtro, setFiltro] = useState('pendiente');
  const [recargas, setRecargas] = useState(0);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(null);
  const [porBorrar, setPorBorrar] = useState(null);
  const [guardandoGestion, setGuardandoGestion] = useState(null);
  const [cambioRol, setCambioRol] = useState(null);
  // Olvido de contraseña: a quién se le va a restablecer y la temporal que
  // devolvió el backend (se muestra una sola vez).
  const [porRestablecer, setPorRestablecer] = useState(null);
  const [temporal, setTemporal] = useState(null); // { u, password, copiada }
  const miId = leerUsuario().id;

  const confirmarRestablecer = async () => {
    const u = porRestablecer;
    if (!u) return;
    setProcesando(u._id);
    try {
      const r = await api.restablecerPassword(u._id);
      setUsuarios((prev) => prev.map((x) => (x._id === u._id ? { ...x, passwordTemporal: true } : x)));
      setPorRestablecer(null);
      setTemporal({ u, password: r.temporal, copiada: false });
    } catch (e) {
      avisarError('No se pudo restablecer la contraseña', e);
    } finally {
      setProcesando(null);
    }
  };

  const copiarTemporal = async () => {
    if (!temporal) return;
    const copiada = await copiarTexto(temporal.password);
    setTemporal((t) => (t ? { ...t, copiada } : t));
  };

  const actualizar = async (u, cambios) => {
    setGuardandoGestion(u._id);
    try {
      const r = await api.gestionarUsuario(u._id, cambios);
      setUsuarios((prev) =>
        prev.map((x) =>
          x._id === u._id
            ? { ...x, rol: r.rol, esAdmin: r.esAdmin, estado: r.estado ?? x.estado, permisos: r.permisos }
            : x
        )
      );
    } catch (e) {
      avisarError('No se pudo actualizar el usuario', e);
    } finally {
      setGuardandoGestion(null);
    }
  };

  useEffect(() => {
    // La pestaña Historial carga lo suyo (HistorialAdmin).
    if (filtro === 'historial') return undefined;
    let activo = true;
    const t = setTimeout(async () => {
      setCargando(true);
      setError('');
      try {
        const data = await api.getSolicitudes(filtro);
        if (activo) setUsuarios(data);
      } catch (e) {
        if (activo) {
          setError(e.message);
          setUsuarios([]);
        }
      } finally {
        if (activo) setCargando(false);
      }
    }, 0);
    return () => {
      activo = false;
      clearTimeout(t);
    };
  }, [filtro, recargas]);

  const resolver = async (id, accion) => {
    setProcesando(id);
    try {
      await api.resolverSolicitud(id, accion);
      // Cambió de estado: se quita de la lista actual.
      setUsuarios((prev) => prev.filter((u) => u._id !== id));
    } catch (e) {
      avisarError('No se pudo resolver la solicitud', e);
    } finally {
      setProcesando(null);
    }
  };

  const confirmarEliminar = async () => {
    const u = porBorrar;
    if (!u) return;
    setProcesando(u._id);
    try {
      await api.eliminarUsuario(u._id);
      setUsuarios((prev) => prev.filter((x) => x._id !== u._id));
      setPorBorrar(null);
    } catch (e) {
      avisarError('No se pudo eliminar el usuario', e);
    } finally {
      setProcesando(null);
    }
  };

  const formatFecha = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const visibles = usuarios.filter((u) => u._id !== miId);

  return (
    <div className="admin-page">
      <Sidebar />
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-title">
            <div className="admin-badge">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1>Administración de registros</h1>
            </div>
          </div>
        </div>

        <div className="admin-tabs">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              className={`admin-tab ${filtro === f.key ? 'active' : ''}`}
              onClick={() => setFiltro(f.key)}
            >
              {f.label}
            </button>
          ))}
          <button
            className="admin-refresh"
            title="Actualizar"
            onClick={() => setRecargas((n) => n + 1)}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {filtro !== 'historial' && error && <div className="admin-error">{error}</div>}

        {filtro === 'historial' ? (
          <HistorialAdmin recargas={recargas} />
        ) : cargando ? (
          <div className="admin-empty">Cargando…</div>
        ) : visibles.length === 0 ? (
          <div className="admin-empty">
            <Inbox size={40} />
            <p>No hay cuentas {VACIO[filtro]}.</p>
          </div>
        ) : (
          <div className="admin-list">
            {visibles.map((u) => (
              <div key={u._id} className="admin-card">
                <div className="admin-card-main">
                  <div className="admin-card-name">
                    {u.nombre} {u.apellido}
                  </div>
                  <div className="admin-card-email">{u.email}</div>
                  <div className="admin-card-meta">
                    <span className="admin-chip">{ROL_LABEL[u.rol] || u.rol}</span>
                    {u.institucion ? (
                      <span className="admin-chip inst">{u.institucion}</span>
                    ) : (
                      <span className="admin-chip vacio">Sin institución</span>
                    )}
                    <span className="admin-fecha">
                      {filtro === 'eliminado' ? `Eliminada el ${formatFecha(u.eliminadoEn)}` : formatFecha(u.createdAt)}
                    </span>
                    {/* Al final, para que al aparecer no corra lo que ya estaba. */}
                    {u.passwordTemporal && <span className="admin-chip vacio">Contraseña temporal sin cambiar</span>}
                  </div>
                </div>

                <div className="admin-actions">
                  {filtro === 'pendiente' && (
                    <>
                      <button className="btn-aprobar" disabled={procesando === u._id} onClick={() => resolver(u._id, 'aprobar')}>
                        <Check size={16} /> Aprobar
                      </button>
                      <button className="btn-rechazar" disabled={procesando === u._id} onClick={() => resolver(u._id, 'rechazar')}>
                        <X size={16} /> Rechazar
                      </button>
                    </>
                  )}
                  {filtro === 'aprobado' && (
                    <>
                      <button className="btn-neutro-admin" disabled={procesando === u._id} onClick={() => setPorRestablecer(u)}>
                        <KeyRound size={16} /> Restablecer contraseña
                      </button>
                      <button className="btn-rechazar" disabled={procesando === u._id} onClick={() => resolver(u._id, 'rechazar')}>
                        <Ban size={16} /> Deshabilitar
                      </button>
                    </>
                  )}
                  {filtro === 'rechazado' && (
                    <button className="btn-aprobar" disabled={procesando === u._id} onClick={() => resolver(u._id, 'aprobar')}>
                      <Check size={16} /> Habilitar
                    </button>
                  )}
                  {filtro === 'eliminado' && (
                    <button className="btn-aprobar" disabled={procesando === u._id} onClick={() => resolver(u._id, 'restaurar')}>
                      <RotateCcw size={16} /> Restaurar
                    </button>
                  )}
                  <button className="btn-eliminar-admin" disabled={procesando === u._id} onClick={() => setPorBorrar(u)}>
                    <Trash2 size={16} /> {filtro === 'eliminado' ? 'Eliminar definitivamente' : 'Eliminar'}
                  </button>
                </div>

                {filtro !== 'eliminado' && (
                <div className="admin-gestion">
                  <label className="adm-g-field">
                    <span>Rol</span>
                    <select
                      value={u.rol}
                      disabled={guardandoGestion === u._id}
                      onChange={(e) => setCambioRol({ u, rol: e.target.value })}
                    >
                      <option value="padre">Padre / Madre</option>
                      <option value="psicologo">Psicólogo(a)</option>
                      <option value="profesor">Profesor(a)</option>
                    </select>
                  </label>
                  <label className="adm-g-check" title={u.esAdmin ? 'Los administradores ya tienen todos los permisos' : ''}>
                    <input
                      type="checkbox"
                      checked={!!u.permisos?.conContexto}
                      disabled={u.esAdmin || guardandoGestion === u._id}
                      onChange={(e) => actualizar(u, { permisos: { conContexto: e.target.checked } })}
                    />
                    Análisis con contexto
                  </label>
                  <label className="adm-g-check" title={u.esAdmin ? 'Los administradores ya tienen todos los permisos' : ''}>
                    <input
                      type="checkbox"
                      checked={!!u.permisos?.descargarPdf}
                      disabled={u.esAdmin || guardandoGestion === u._id}
                      onChange={(e) => actualizar(u, { permisos: { descargarPdf: e.target.checked } })}
                    />
                    Descargar PDF
                  </label>
                  <label
                    className="adm-g-check"
                    title={u.esAdmin
                      ? 'Un administrador no puede eliminar su propia cuenta'
                      : 'Aun con este permiso, la cuenta no se borra: queda en «Cuentas eliminadas» hasta que decidas'}
                  >
                    <input
                      type="checkbox"
                      checked={!!u.permisos?.eliminarCuenta}
                      disabled={u.esAdmin || guardandoGestion === u._id}
                      onChange={(e) => actualizar(u, { permisos: { eliminarCuenta: e.target.checked } })}
                    />
                    Eliminar su cuenta
                  </label>
                  <label className="adm-g-check" title={u._id === miId ? 'No puedes cambiar tu propio rol de administrador' : ''}>
                    <input
                      type="checkbox"
                      checked={!!u.esAdmin}
                      disabled={u._id === miId || guardandoGestion === u._id}
                      onChange={(e) => actualizar(u, { esAdmin: e.target.checked })}
                    />
                    Administrador
                  </label>
                </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        abierto={!!porBorrar}
        peligro
        titulo={filtro === 'eliminado' ? 'Eliminar definitivamente' : 'Eliminar cuenta'}
        mensaje={porBorrar
          ? `¿Eliminar ${filtro === 'eliminado' ? 'definitivamente ' : ''}la cuenta de ${porBorrar.nombre} ${porBorrar.apellido} (${porBorrar.email})?`
          : ''}
        detalle="Se borrarán también todos sus análisis e imágenes. Esta acción no se puede deshacer."
        textoConfirmar={filtro === 'eliminado' ? 'Eliminar definitivamente' : 'Eliminar'}
        cargando={procesando === porBorrar?._id}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setPorBorrar(null)}
      />

      <ConfirmDialog
        abierto={!!porRestablecer}
        titulo="Restablecer contraseña"
        mensaje={porRestablecer
          ? `¿Restablecer la contraseña de ${porRestablecer.nombre} ${porRestablecer.apellido} (${porRestablecer.email})?`
          : ''}
        detalle="Se generará una contraseña temporal para que se la des. La actual dejará de funcionar y, al entrar, tendrá que cambiarla."
        textoConfirmar="Restablecer"
        cargando={procesando === porRestablecer?._id}
        onConfirmar={confirmarRestablecer}
        onCancelar={() => setPorRestablecer(null)}
      />

      <ConfirmDialog
        abierto={!!temporal}
        titulo="Contraseña temporal"
        mensaje={temporal ? (
          <>
            Para {temporal.u.nombre} {temporal.u.apellido}:<br />
            <code className="admin-temporal">{temporal.password}</code>
          </>
        ) : ''}
        detalle="Dásela por un medio seguro. No se volverá a mostrar (si se pierde, restablécela otra vez). Al entrar, tendrá que cambiarla por una suya."
        textoConfirmar={temporal?.copiada ? 'Copiada' : 'Copiar'}
        textoCancelar="Cerrar"
        onConfirmar={copiarTemporal}
        onCancelar={() => setTemporal(null)}
      />

      <ConfirmDialog
        abierto={!!cambioRol}
        titulo="Cambiar rol"
        mensaje={cambioRol ? `¿Cambiar el rol de ${cambioRol.u.nombre} ${cambioRol.u.apellido} a "${ROL_LABEL[cambioRol.rol] || cambioRol.rol}"?` : ''}
        detalle="El usuario verá sus permisos y herramientas según el nuevo rol."
        textoConfirmar="Cambiar rol"
        cargando={cambioRol ? guardandoGestion === cambioRol.u._id : false}
        onConfirmar={async () => {
          const c = cambioRol;
          await actualizar(c.u, { rol: c.rol });
          setCambioRol(null);
        }}
        onCancelar={() => setCambioRol(null)}
      />
    </div>
  );
};

export default Admin;
