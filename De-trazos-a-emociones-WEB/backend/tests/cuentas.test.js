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
const app = require("../app");

// --- Modelos en memoria ---
const usuarios = new Map();
let ordenPedido = null;
let borradosDeAnalisis = 0;
const consulta = (valor, alOrdenar) => {
    const q = {
        select: () => q,
        sort: (orden) => { if (alOrdenar) alOrdenar(orden); return q; },
        then: (ok, err) => Promise.resolve(valor).then(ok, err),
    };
    return q;
};
User.findById = (id) => consulta(usuarios.get(String(id)) || null);
User.findOne = ({ email }) => consulta([...usuarios.values()].find((u) => u.email === email) || null);
User.find = ({ estado }) => consulta([...usuarios.values()].filter((u) => u.estado === estado), (o) => { ordenPedido = o; });
User.findByIdAndDelete = async (id) => usuarios.delete(String(id));
Analysis.find = () => consulta([]);
Analysis.deleteMany = async () => { borradosDeAnalisis++; };

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
    crear(ID_ADMIN, { esAdmin: true, email: "admin@prueba.test" });
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
