// Eliminar la cuenta: el permiso lo asigna el administrador, la cuenta no se
// borra sino que queda desactivada («eliminada») y el administrador la restaura
// o la elimina definitivamente. Sin base de datos: los modelos se reemplazan
// por unos en memoria solo en este archivo (node --test corre cada archivo en
// su propio proceso).
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "secreto-solo-para-pruebas";
process.env.AI_MODE = "mock";
delete process.env.ADMIN_EMAILS;
const User = require("../models/User");
const Analysis = require("../models/Analysis");
const AccionAdmin = require("../models/AccionAdmin");
const app = require("../app");

// --- Modelos en memoria ---
const usuarios = new Map();
let ordenPedido = null;
let borradosDeAnalisis = 0;
const consulta = (valor, alOrdenar) => {
    const q = {
        select: () => q,
        limit: () => q,
        lean: () => q,
        sort: (orden) => { if (alOrdenar) alOrdenar(orden); return q; },
        then: (ok, err) => Promise.resolve(valor).then(ok, err),
    };
    return q;
};
User.findById = (id) => consulta(usuarios.get(String(id)) || null);
User.findOne = ({ email }) => consulta([...usuarios.values()].find((u) => u.email === email) || null);
User.find = ({ estado }) => consulta([...usuarios.values()].filter((u) => u.estado === estado), (o) => { ordenPedido = o; });
User.findByIdAndDelete = async (id) => usuarios.delete(String(id));
User.countDocuments = async (f = {}) => [...usuarios.values()].filter((u) => Object.entries(f).every(([k, v]) => u[k] === v)).length;
Analysis.find = () => consulta([]);
Analysis.deleteMany = async () => { borradosDeAnalisis++; };
// Historial de acciones en memoria (de la más reciente a la más antigua, de a n).
const historial = [];
AccionAdmin.create = async (doc) => { historial.push(doc); return doc; };
AccionAdmin.find = (filtro = {}) => {
    let lista = historial.filter((h) => !(filtro.fecha && filtro.fecha.$lt) || h.fecha < filtro.fecha.$lt);
    lista = [...lista].sort((a, b) => b.fecha - a.fecha);
    const q = { sort: () => q, lean: () => q, limit: (n) => { lista = lista.slice(0, n); return q; }, then: (ok, err) => Promise.resolve(lista).then(ok, err) };
    return q;
};

const crear = (id, datos = {}) => {
    const u = {
        _id: id, nombre: "Ana", apellido: "Prueba", email: `${id}@prueba.test`, rol: "profesor",
        institucion: "", estado: "aprobado", esAdmin: false, fotoPerfil: "",
        createdAt: new Date("2026-10-01T12:00:00Z"), ...datos,
        async save() { this.guardadas = (this.guardadas || 0) + 1; return this; },
        markModified() {},
    };
    usuarios.set(id, u);
    return u;
};
const ID_ADMIN = "aaaaaaaaaaaaaaaaaaaaaaaa";
const ID_USUARIO = "bbbbbbbbbbbbbbbbbbbbbbbb";
const ID_SUPER = "dddddddddddddddddddddddd";
const token = (id) => "Bearer " + jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });

let servidor;
let base;
test.before(async () => {
    servidor = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
    base = `http://127.0.0.1:${servidor.address().port}`;
});
test.after(() => servidor.close());
test.beforeEach(() => {
    usuarios.clear();
    ordenPedido = null;
    borradosDeAnalisis = 0;
    historial.length = 0;
    crear(ID_ADMIN, { esAdmin: true, nombre: "Admin", apellido: "Demo", email: "admin@prueba.test" });
});

const pedir = async (metodo, ruta, { token: t, json } = {}) => {
    const headers = {};
    let body;
    if (t) headers.Authorization = t;
    if (json) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
    const r = await fetch(base + ruta, { method: metodo, headers, body });
    return { status: r.status, cuerpo: await r.json() };
};

test("sin el permiso no se puede eliminar la cuenta (tampoco una cuenta heredada)", async () => {
    const u = crear(ID_USUARIO, { permisos: { conContexto: true, descargarPdf: true } });
    const r = await pedir("DELETE", "/perfil", { token: token(ID_USUARIO) });
    assert.equal(r.status, 403);
    assert.match(r.cuerpo.message, /permiso/);
    assert.equal(u.estado, "aprobado");
    assert.equal(u.guardadas, undefined);

    const heredada = crear(ID_USUARIO, {}); // sin objeto permisos
    assert.equal((await pedir("DELETE", "/perfil", { token: token(ID_USUARIO) })).status, 403);
    assert.equal(heredada.estado, "aprobado");
});

test("con el permiso, la cuenta queda desactivada y sus datos no se borran", async () => {
    const u = crear(ID_USUARIO, { permisos: { conContexto: true, descargarPdf: false, eliminarCuenta: true } });
    const r = await pedir("DELETE", "/perfil", { token: token(ID_USUARIO) });
    assert.equal(r.status, 200);
    assert.equal(u.estado, "eliminado");
    assert.ok(u.eliminadoEn instanceof Date);
    assert.ok(usuarios.has(ID_USUARIO));
    assert.equal(borradosDeAnalisis, 0);
});

test("un administrador no puede eliminar su propia cuenta", async () => {
    const r = await pedir("DELETE", "/perfil", { token: token(ID_ADMIN) });
    assert.equal(r.status, 400);
    assert.equal(usuarios.get(ID_ADMIN).estado, "aprobado");
});

test("una cuenta eliminada no inicia sesión, no se registra de nuevo y su sesión abierta se cierra", async () => {
    const clave = "Clave123!";
    crear(ID_USUARIO, { estado: "eliminado", eliminadoEn: new Date(), email: "ana@prueba.test", password: await bcrypt.hash(clave, 4) });

    const login = await pedir("POST", "/auth/login", { json: { email: "ana@prueba.test", password: clave } });
    assert.equal(login.status, 403);
    assert.match(login.cuerpo.message, /fue eliminada/);
    // Con la contraseña equivocada no se revela nada.
    assert.equal((await pedir("POST", "/auth/login", { json: { email: "ana@prueba.test", password: "Otra123!x" } })).status, 401);

    const registro = await pedir("POST", "/auth/register", {
        json: { nombre: "Ana", apellido: "Prueba", email: "ana@prueba.test", password: clave, rol: "profesor" },
    });
    assert.equal(registro.status, 409);
    assert.match(registro.cuerpo.message, /cuenta eliminada/);

    assert.equal((await pedir("GET", "/perfil/me", { token: token(ID_USUARIO) })).status, 401);
});

test("el panel lista las cuentas eliminadas, de la más reciente a la más antigua", async () => {
    crear(ID_USUARIO, { estado: "eliminado", eliminadoEn: new Date("2026-11-04T15:00:00Z") });
    crear("cccccccccccccccccccccccc"); // activa: no sale
    const r = await pedir("GET", "/admin/usuarios?estado=eliminado", { token: token(ID_ADMIN) });
    assert.equal(r.status, 200);
    assert.deepEqual(r.cuerpo.map((u) => u._id), [ID_USUARIO]);
    assert.equal(r.cuerpo[0].eliminadoEn, "2026-11-04T15:00:00.000Z");
    assert.deepEqual(ordenPedido, { eliminadoEn: -1 });
});

test("restaurar devuelve la cuenta a aprobada, y solo aplica a cuentas eliminadas", async () => {
    const u = crear(ID_USUARIO, { estado: "eliminado", eliminadoEn: new Date() });
    // Una cuenta eliminada no se aprueba ni se rechaza: se restaura o se elimina.
    assert.equal((await pedir("PATCH", `/admin/usuarios/${ID_USUARIO}`, { token: token(ID_ADMIN), json: { accion: "aprobar" } })).status, 400);

    const r = await pedir("PATCH", `/admin/usuarios/${ID_USUARIO}`, { token: token(ID_ADMIN), json: { accion: "restaurar" } });
    assert.equal(r.status, 200);
    assert.equal(r.cuerpo.message, "Cuenta restaurada");
    assert.equal(u.estado, "aprobado");
    assert.equal(u.eliminadoEn, undefined);

    const otra = await pedir("PATCH", `/admin/usuarios/${ID_USUARIO}`, { token: token(ID_ADMIN), json: { accion: "restaurar" } });
    assert.equal(otra.status, 400);
});

test("eliminar definitivamente borra la cuenta eliminada y sus análisis", async () => {
    crear(ID_USUARIO, { estado: "eliminado", eliminadoEn: new Date() });
    const r = await pedir("DELETE", `/admin/usuarios/${ID_USUARIO}`, { token: token(ID_ADMIN) });
    assert.equal(r.status, 200);
    assert.equal(usuarios.has(ID_USUARIO), false);
    assert.equal(borradosDeAnalisis, 1);
});

test("el administrador asigna y quita el permiso de eliminar la cuenta", async () => {
    const u = crear(ID_USUARIO, { permisos: { conContexto: true, descargarPdf: true } });
    const ruta = `/admin/usuarios/${ID_USUARIO}/gestion`;
    const si = await pedir("PATCH", ruta, { token: token(ID_ADMIN), json: { permisos: { eliminarCuenta: true } } });
    assert.equal(si.status, 200);
    assert.equal(si.cuerpo.permisos.eliminarCuenta, true);
    assert.equal(u.permisos.eliminarCuenta, true);
    assert.equal(si.cuerpo.permisos.conContexto, true); // lo demás no cambia

    const no = await pedir("PATCH", ruta, { token: token(ID_ADMIN), json: { permisos: { eliminarCuenta: false } } });
    assert.equal(no.cuerpo.permisos.eliminarCuenta, false);
});

test("restablecer la contraseña: el admin recibe una temporal una sola vez y el usuario debe cambiarla", async () => {
    const { validarPassword, generarPasswordTemporal } = require("../utils/password");
    for (let i = 0; i < 50; i++) assert.equal(validarPassword(generarPasswordTemporal()), null);

    const u = crear(ID_USUARIO, { email: "ana@prueba.test", password: await bcrypt.hash("Vieja123!", 4) });
    const r = await pedir("POST", `/admin/usuarios/${ID_USUARIO}/restablecer-password`, { token: token(ID_ADMIN) });
    assert.equal(r.status, 200);
    const temporal = r.cuerpo.temporal;
    assert.equal(validarPassword(temporal), null);
    assert.equal(u.passwordTemporal, true);
    assert.equal(await bcrypt.compare(temporal, u.password), true); // se guarda cifrada
    assert.notEqual(u.password, temporal);

    // La anterior deja de servir; con la temporal entra y el login avisa que es temporal.
    assert.equal((await pedir("POST", "/auth/login", { json: { email: "ana@prueba.test", password: "Vieja123!" } })).status, 401);
    const login = await pedir("POST", "/auth/login", { json: { email: "ana@prueba.test", password: temporal } });
    assert.equal(login.status, 200);
    assert.equal(login.cuerpo.usuario.passwordTemporal, true);
    assert.equal((await pedir("GET", "/perfil/me", { token: token(ID_USUARIO) })).cuerpo.passwordTemporal, true);

    // Al cambiarla, deja de ser temporal.
    const cambio = await pedir("POST", "/perfil/cambiar-password", { token: token(ID_USUARIO), json: { actual: temporal, nueva: "Nueva123!" } });
    assert.equal(cambio.status, 200);
    assert.equal(u.passwordTemporal, false);
    assert.equal(await bcrypt.compare("Nueva123!", u.password), true);
});

test("restablecer la contraseña: solo un admin, no la propia y solo en cuentas aprobadas", async () => {
    crear(ID_USUARIO, { estado: "pendiente" });
    const ruta = `/admin/usuarios/${ID_USUARIO}/restablecer-password`;
    assert.equal((await pedir("POST", ruta, { token: token(ID_ADMIN) })).status, 400); // pendiente
    assert.equal((await pedir("POST", `/admin/usuarios/${ID_ADMIN}/restablecer-password`, { token: token(ID_ADMIN) })).status, 400); // la propia
    usuarios.get(ID_USUARIO).estado = "aprobado";
    assert.equal((await pedir("POST", ruta, { token: token(ID_USUARIO) })).status, 403); // no es admin
});

test("historial: cada acción del panel queda registrada con quién, a quién y el detalle", async () => {
    const u = crear(ID_USUARIO, { estado: "pendiente", permisos: { conContexto: false, descargarPdf: false } });
    const admin = token(ID_ADMIN);
    const ruta = `/admin/usuarios/${ID_USUARIO}`;
    await pedir("PATCH", ruta, { token: admin, json: { accion: "aprobar" } });
    await pedir("PATCH", `${ruta}/gestion`, { token: admin, json: { rol: "psicologo", permisos: { conContexto: true, descargarPdf: false } } });
    const { cuerpo } = await pedir("POST", `${ruta}/restablecer-password`, { token: admin });
    await pedir("PATCH", ruta, { token: admin, json: { accion: "rechazar" } }); // aprobada → deshabilitar
    await pedir("PATCH", ruta, { token: admin, json: { accion: "aprobar" } });  // rechazada → habilitar
    await pedir("DELETE", ruta, { token: admin });

    assert.deepEqual(historial.map((h) => h.accion), [
        "aprobar_solicitud", "cambiar_rol", "cambiar_permiso", "restablecer_password", "deshabilitar", "habilitar", "eliminar_definitivo",
    ]);
    const [aprobar, rol, permiso, restablecer, , , eliminar] = historial;
    assert.equal(aprobar.adminNombre, "Admin Demo");
    assert.equal(aprobar.adminEmail, "admin@prueba.test");
    assert.equal(aprobar.usuarioNombre, "Ana Prueba");
    assert.equal(aprobar.usuarioEmail, u.email);
    assert.ok(aprobar.fecha instanceof Date);
    assert.deepEqual(aprobar.detalle, { estadoAnterior: "pendiente", estadoNuevo: "aprobado" });
    assert.deepEqual(rol.detalle, { de: "profesor", a: "psicologo" });
    assert.deepEqual(permiso.detalle, { permiso: "conContexto", valor: true }); // descargarPdf no cambió: no se registra
    assert.deepEqual(restablecer.detalle, {});
    assert.deepEqual(eliminar.detalle, { estadoAnterior: "aprobado", analisis: 0 });
    // La contraseña temporal nunca queda en el historial.
    assert.ok(cuerpo.temporal && !JSON.stringify(historial).includes(cuerpo.temporal));
});

test("historial: nombrar administrador es una sola entrada (sus permisos salen de serlo)", async () => {
    crear(ID_USUARIO, { permisos: { conContexto: false, descargarPdf: false } });
    await pedir("PATCH", `/admin/usuarios/${ID_USUARIO}/gestion`, { token: token(ID_ADMIN), json: { esAdmin: true } });
    assert.deepEqual(historial.map((h) => h.accion), ["nombrar_admin"]);
});

test("historial: GET /admin/historial, de la más reciente a la más antigua y de a 50", async () => {
    for (let i = 0; i < 52; i++) {
        historial.push({ accion: "aprobar_solicitud", adminNombre: "Admin Demo", usuarioNombre: `Cuenta ${i}`, detalle: {}, fecha: new Date(Date.UTC(2026, 10, 1, 0, i)) });
    }
    const primera = await pedir("GET", "/admin/historial", { token: token(ID_ADMIN) });
    assert.equal(primera.status, 200);
    assert.equal(primera.cuerpo.acciones.length, 50);
    assert.equal(primera.cuerpo.hayMas, true);
    assert.equal(primera.cuerpo.acciones[0].usuarioNombre, "Cuenta 51");
    const ultima = primera.cuerpo.acciones[49].fecha;
    const segunda = await pedir("GET", `/admin/historial?antes=${encodeURIComponent(ultima)}`, { token: token(ID_ADMIN) });
    assert.deepEqual(segunda.cuerpo.acciones.map((a) => a.usuarioNombre), ["Cuenta 1", "Cuenta 0"]);
    assert.equal(segunda.cuerpo.hayMas, false);
    assert.equal((await pedir("GET", "/admin/historial?antes=ayer", { token: token(ID_ADMIN) })).status, 400);
    crear(ID_USUARIO);
    assert.equal((await pedir("GET", "/admin/historial", { token: token(ID_USUARIO) })).status, 403); // solo admin
});

test("super administrador: solo él elimina, restablece o quita el rol a otros administradores", async () => {
    crear(ID_SUPER, { esAdmin: true, esSuperAdmin: true, nombre: "Super", apellido: "Admin", email: "super@prueba.test" });
    const otro = crear(ID_USUARIO, { esAdmin: true, nombre: "Vale", apellido: "Castro", email: "vale@prueba.test" });
    const ruta = `/admin/usuarios/${ID_USUARIO}`;

    // Un administrador normal no puede tocar a otro administrador.
    const admin = token(ID_ADMIN);
    const borrar = await pedir("DELETE", ruta, { token: admin });
    assert.equal(borrar.status, 403);
    assert.match(borrar.cuerpo.message, /super administrador/);
    assert.equal((await pedir("POST", `${ruta}/restablecer-password`, { token: admin })).status, 403);
    assert.equal((await pedir("PATCH", `${ruta}/gestion`, { token: admin, json: { esAdmin: false } })).status, 403);
    assert.equal((await pedir("PATCH", `${ruta}/gestion`, { token: admin, json: { rol: "padre" } })).status, 403);
    assert.equal(otro.esAdmin, true);
    assert.equal(historial.length, 0);

    // El super administrador sí: le quita el rol…
    const superAdmin = token(ID_SUPER);
    const quitar = await pedir("PATCH", `${ruta}/gestion`, { token: superAdmin, json: { esAdmin: false } });
    assert.equal(quitar.status, 200);
    assert.equal(otro.esAdmin, false);
    assert.equal(historial.at(-1).accion, "quitar_admin");
    assert.equal(historial.at(-1).adminNombre, "Super Admin");

    // …y elimina la cuenta de un administrador.
    otro.esAdmin = true;
    const eliminar = await pedir("DELETE", ruta, { token: superAdmin });
    assert.equal(eliminar.status, 200);
    assert.equal(usuarios.has(ID_USUARIO), false);
    assert.deepEqual(historial.at(-1).detalle, { estadoAnterior: "aprobado", analisis: 0, eraAdmin: true });
});

test("al super administrador nadie lo modifica ni lo elimina desde el panel (ni él mismo)", async () => {
    const jefe = crear(ID_SUPER, { esAdmin: true, esSuperAdmin: true, email: "super@prueba.test" });
    const ruta = `/admin/usuarios/${ID_SUPER}`;
    for (const t of [token(ID_ADMIN), token(ID_SUPER)]) {
        const r = await pedir("DELETE", ruta, { token: t });
        assert.equal(r.status, 403);
        assert.match(r.cuerpo.message, /super administrador no se puede/);
    }
    assert.equal((await pedir("PATCH", `${ruta}/gestion`, { token: token(ID_ADMIN), json: { esAdmin: false } })).status, 403);
    assert.equal((await pedir("POST", `${ruta}/restablecer-password`, { token: token(ID_ADMIN) })).status, 403);
    assert.equal(usuarios.has(ID_SUPER), true);
    assert.equal(jefe.esAdmin, true);
});

test("cualquier administrador puede nombrar a otro (la advertencia la muestra el panel)", async () => {
    const u = crear(ID_USUARIO, { permisos: { conContexto: true, descargarPdf: true } });
    const r = await pedir("PATCH", `/admin/usuarios/${ID_USUARIO}/gestion`, { token: token(ID_ADMIN), json: { esAdmin: true } });
    assert.equal(r.status, 200);
    assert.equal(u.esAdmin, true);
    assert.equal(u.esSuperAdmin, undefined); // ser super administrador nunca se da desde el panel
});

test("SUPERADMIN_EMAILS: al iniciar sesión la cuenta queda super administradora y aprobada", async () => {
    process.env.SUPERADMIN_EMAILS = "jefe@prueba.test";
    try {
        const u = crear(ID_USUARIO, { email: "jefe@prueba.test", estado: "pendiente", password: await bcrypt.hash("Clave123!", 4) });
        const r = await pedir("POST", "/auth/login", { json: { email: "jefe@prueba.test", password: "Clave123!" } });
        assert.equal(r.status, 200);
        assert.equal(r.cuerpo.usuario.esSuperAdmin, true);
        assert.equal(r.cuerpo.usuario.esAdmin, true);
        assert.equal(u.estado, "aprobado");
    } finally {
        delete process.env.SUPERADMIN_EMAILS;
    }
});
