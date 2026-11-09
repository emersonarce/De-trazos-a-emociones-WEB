// Rutas de la app sin base de datos: autenticación, validaciones y manejo de
// errores. Protege los endpoints ante cambios (refactorizaciones, etc.).
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "secreto-solo-para-pruebas";
process.env.AI_MODE = "mock";
const app = require("../app");

const ID = "0123456789abcdef01234567";
const valido = "Bearer " + jwt.sign({ id: "000000000000000000000000" }, process.env.JWT_SECRET, { expiresIn: "1h" });
// Vencido hace una hora (no segundos): así no depende de pequeños saltos del reloj.
const vencido = "Bearer " + jwt.sign({ id: "000000000000000000000000", exp: Math.floor(Date.now() / 1000) - 3600 }, process.env.JWT_SECRET);

let servidor;
let base;
test.before(async () => {
    servidor = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
    base = `http://127.0.0.1:${servidor.address().port}`;
});
test.after(() => servidor.close());

const pedir = async (metodo, ruta, { token, json, form } = {}) => {
    const headers = {};
    let body;
    if (token) headers.Authorization = token;
    if (form) body = form;
    else if (json && metodo !== "GET") { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
    const r = await fetch(base + ruta, { method: metodo, headers, body });
    const tipo = r.headers.get("content-type") || "";
    return { status: r.status, cuerpo: tipo.includes("json") ? await r.json() : await r.text() };
};

test("GET /salud responde", async () => {
    assert.deepEqual(await pedir("GET", "/salud"), { status: 200, cuerpo: "Servidor con MiniCPM-V funcionando" });
});

const PROTEGIDAS = [
    ["POST", "/analizar-imagen"], ["GET", "/analisis"], ["POST", "/analisis/guardar"], ["POST", "/analisis/descartar"],
    ["PATCH", `/analisis/${ID}/asignar`], ["PATCH", `/analisis/${ID}/desasignar`], ["POST", `/analisis/${ID}/reanalizar`],
    ["GET", `/analisis/${ID}/imagen`], ["POST", "/analisis/eliminar-varios"], ["DELETE", `/analisis/${ID}`],
    ["GET", "/perfil/me"], ["GET", "/perfil/foto"], ["POST", "/perfil/foto"], ["POST", "/perfil/cambiar-password"], ["DELETE", "/perfil"],
    ["GET", "/admin/usuarios"], ["PATCH", `/admin/usuarios/${ID}`], ["DELETE", `/admin/usuarios/${ID}`], ["PATCH", `/admin/usuarios/${ID}/gestion`]
];

test("todas las rutas privadas exigen token (401)", async () => {
    for (const [m, r] of PROTEGIDAS) {
        assert.deepEqual(await pedir(m, r), { status: 401, cuerpo: { message: "Token no proporcionado" } }, `${m} ${r}`);
        assert.deepEqual(await pedir(m, r, { token: "Bearer x.y.z" }), { status: 401, cuerpo: { message: "Token inválido" } }, `${m} ${r}`);
        assert.deepEqual(await pedir(m, r, { token: vencido }), { status: 401, cuerpo: { message: "El token ha expirado" } }, `${m} ${r}`);
        assert.deepEqual(await pedir(m, r, { token: "Token abc" }), { status: 401, cuerpo: { message: "Formato de token inválido" } }, `${m} ${r}`);
    }
});

test("identificadores inválidos (400)", async () => {
    for (const [m, r] of [["PATCH", "/analisis/x/asignar"], ["PATCH", "/analisis/x/desasignar"], ["POST", "/analisis/x/reanalizar"], ["GET", "/analisis/x/imagen"], ["DELETE", "/analisis/x"]]) {
        assert.deepEqual(await pedir(m, r, { token: valido, json: {} }), { status: 400, cuerpo: { error: "Identificador inválido" } }, `${m} ${r}`);
    }
});

test("validaciones de datos del análisis", async () => {
    assert.deepEqual(await pedir("POST", "/analisis/guardar", { token: valido, json: {} }), { status: 400, cuerpo: { error: "Faltan datos del análisis" } });
    assert.deepEqual(await pedir("POST", "/analisis/guardar", { token: valido, json: { analisis: {}, imagen: "/uploads/no-existe.jpg" } }), { status: 404, cuerpo: { error: "La imagen ya no está disponible" } });
    assert.deepEqual(await pedir("PATCH", `/analisis/${ID}/asignar`, { token: valido, json: {} }), { status: 400, cuerpo: { error: "Falta el niño al que asignar" } });
    assert.deepEqual(await pedir("POST", "/analisis/eliminar-varios", { token: valido, json: {} }), { status: 400, cuerpo: { error: "Debes enviar una lista de ids" } });
    assert.deepEqual(await pedir("POST", "/analisis/eliminar-varios", { token: valido, json: { ids: ["x"] } }), { status: 400, cuerpo: { error: "No hay identificadores válidos" } });
    assert.deepEqual(await pedir("POST", "/analisis/descartar", { token: valido, json: { imagen: "/uploads/no-existe.jpg" } }), { status: 200, cuerpo: { ok: true } });
});

test("subida del dibujo: sin imagen y con formato no permitido", async () => {
    assert.deepEqual(await pedir("POST", "/analizar-imagen", { token: valido, json: {} }), { status: 400, cuerpo: { error: "No se envió ninguna imagen" } });
    const form = new FormData();
    form.append("imagen", new Blob(["hola"], { type: "text/plain" }), "a.txt");
    assert.deepEqual(await pedir("POST", "/analizar-imagen", { token: valido, form }), { status: 400, cuerpo: { error: "Formato no permitido. Usa JPG, PNG o WEBP." } });
});

test("analizar con contexto exige un nombre o alias", async () => {
    const { Jimp } = require("jimp");
    const png = await new Jimp({ width: 300, height: 200, color: 0xffffffff }).getBuffer("image/png");
    const form = new FormData();
    form.append("imagen", new Blob([png], { type: "image/png" }), "dibujo.png");
    form.append("nombre", "   ");
    form.append("edad", "8");
    assert.deepEqual(await pedir("POST", "/analizar-imagen", { token: valido, form }), { status: 400, cuerpo: { error: "Escribe un nombre o alias para el niño: así sus dibujos se agrupan en su historial." } });
});

test("analizar en modo solo dibujo (IA simulada) y descartar", async () => {
    const { Jimp } = require("jimp");
    const png = await new Jimp({ width: 1200, height: 900, color: 0x3366ccff }).getBuffer("image/png");
    const form = new FormData();
    form.append("imagen", new Blob([png], { type: "image/png" }), "dibujo.png");
    form.append("persistir", "false");
    const r = await pedir("POST", "/analizar-imagen", { token: valido, form });
    assert.equal(r.status, 200);
    assert.equal(r.cuerpo.guardado, false);
    assert.equal(r.cuerpo.simulado, true);
    assert.equal(typeof r.cuerpo.analisis.duracion_ms, "number");
    assert.match(r.cuerpo.imagen, /^\/uploads\/[a-f0-9]+-resized\.jpg$/);
    assert.deepEqual(await pedir("POST", "/analisis/descartar", { token: valido, json: { imagen: r.cuerpo.imagen } }), { status: 200, cuerpo: { ok: true } });
});

test("login y registro validan campos obligatorios", async () => {
    assert.deepEqual(await pedir("POST", "/auth/login", { json: {} }), { status: 400, cuerpo: { message: "El correo y la contraseña son obligatorios" } });
    assert.deepEqual(await pedir("POST", "/auth/register", { json: {} }), { status: 400, cuerpo: { message: "Todos los campos son obligatorios" } });
});
