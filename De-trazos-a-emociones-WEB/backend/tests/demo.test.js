const test = require("node:test");
const assert = require("node:assert/strict");
const { nombreBaseDemo } = require("../scripts/demo/base");
const { fechaBanco, generarBanco, USUARIO_DEMO } = require("../scripts/demo/datos");
const { validarPassword } = require("../utils/password");
const { dibujo, GRUPOS_DIBUJO } = require("../scripts/demo/dibujos");

test("demo: la base de prueba siempre termina en _demo", () => {
    assert.equal(nombreBaseDemo({ MONGO_URI: "mongodb+srv://u:p@c.mongodb.net/emocionesDB?retryWrites=true" }), "emocionesDB_demo");
    assert.equal(nombreBaseDemo({ MONGO_URI: "mongodb://localhost:27017" }), "test_demo");
    assert.equal(nombreBaseDemo({ MONGO_URI: "mongodb://x/emocionesDB", MONGO_DB_DEMO: "otra_demo" }), "otra_demo");
    assert.throws(() => nombreBaseDemo({ MONGO_URI: "mongodb://x/emocionesDB", MONGO_DB_DEMO: "emocionesDB" }), /_demo/);
});

test("demo: la contraseña del usuario demo cumple la política de contraseñas", () => {
    assert.equal(validarPassword(USUARIO_DEMO.password), null);
});

test("demo: el banco se puede armar para otro día (p. ej. una presentación)", () => {
    const dia = fechaBanco("2026-11-05");
    assert.deepEqual([dia.getFullYear(), dia.getMonth(), dia.getDate()], [2026, 10, 5]);
    assert.throws(() => fechaBanco("05/11/2026"), /AAAA-MM-DD/);
    assert.throws(() => fechaBanco("2026-02-30"), /AAAA-MM-DD/);
    // Luna cumple años justo ese día y Tomi dos días después.
    const banco = generarBanco(dia);
    const nacimiento = (nombre) => banco.find((a) => a.contexto.nombre === nombre).contexto.fecha_nacimiento;
    assert.equal(nacimiento("Luna").slice(5), "11-05");
    assert.equal(nacimiento("Tomi").slice(5), "11-07");
});

test("demo: el banco trae los casos que se quieren ver", async () => {
    const hoy = new Date(2026, 9, 31, 12);
    const banco = generarBanco(hoy);
    const de = (nombre) => banco.filter((a) => a.contexto.nombre === nombre);
    assert.ok(banco.length > 300, `solo ${banco.length} análisis`);
    assert.ok(banco.every((a) => a.fecha < hoy), "ningún dibujo en el futuro");
    assert.deepEqual(generarBanco(hoy).map((a) => a.emocion), banco.map((a) => a.emocion), "misma semilla, mismo banco");
    // Cumpleaños: Luna hoy, Tomi en 2 días.
    assert.match(de("Luna")[0].contexto.fecha_nacimiento, /-10-31$/);
    assert.match(de("Tomi")[0].contexto.fecha_nacimiento, /-11-02$/);
    // Valen: tres dibujos el mismo día.
    const porDia = {};
    for (const a of de("Valen")) porDia[a.fecha.toDateString()] = (porDia[a.fecha.toDateString()] || 0) + 1;
    assert.ok(Object.values(porDia).some((n) => n >= 3));
    assert.equal(de("Sami").length, 1);
    assert.equal(banco.filter((a) => a.independiente).length, 4);
    // Cada señal de alerta, con la regla de la app (frontend/src/utils/alerta.js).
    const { senalParaAcompanar } = await import("../../frontend/src/utils/alerta.js");
    const senal = (nombre) => senalParaAcompanar(
        de(nombre).map((a) => ({ fecha: a.fecha.toISOString(), resultado_ia: { emocion_predominante: a.emocion } })),
        hoy.getTime(),
    )?.tipo ?? null;
    assert.deepEqual(["Tomi", "Sofi", "Mateo", "Luna", "Valen"].map(senal), ["seguidos", "semana", "mes", null, null]);
});

test("demo: cada emoción tiene su dibujo", () => {
    let s = 1;
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (const grupo of GRUPOS_DIBUJO) {
        const d = dibujo(grupo, r);
        assert.match(d.svg, /^<svg[^>]*width="640"/, grupo);
        assert.ok(d.rasgos.length >= 3 && d.descripcion, grupo);
    }
});

test("demo: administrador y cuentas del panel (solicitudes, cuenta limitada y eliminada)", () => {
    const { USUARIO_ADMIN_DEMO, cuentasPanelDemo } = require("../scripts/demo/datos");
    assert.equal(validarPassword(USUARIO_ADMIN_DEMO.password), null);
    assert.equal(USUARIO_ADMIN_DEMO.esAdmin, true);
    assert.equal(USUARIO_ADMIN_DEMO.esSuperAdmin, true); // el admin demo es el super administrador
    assert.equal(USUARIO_ADMIN_DEMO.estado, "aprobado");
    const cuentas = cuentasPanelDemo(fechaBanco("2026-11-05"));
    for (const c of cuentas) {
        assert.equal(validarPassword(c.password), null);
        assert.match(c.email, /@detrazos\.test$/);
        assert.ok(c.createdAt instanceof Date);
    }
    assert.ok(cuentas.filter((c) => c.estado === "pendiente").length >= 2);
    // Una administradora normal (no super) para mostrar lo que solo hace el super administrador.
    assert.deepEqual(cuentas.filter((c) => c.esAdmin).map((c) => [c.email, Boolean(c.esSuperAdmin)]), [["valeria.castro@detrazos.test", false]]);
    const eliminada = cuentas.find((c) => c.estado === "eliminado");
    assert.ok(eliminada.eliminadoEn instanceof Date);
    assert.equal(eliminada.eliminadoEn.getDate(), 4); // un día antes del 5
    const correos = [USUARIO_DEMO.email, USUARIO_ADMIN_DEMO.email, ...cuentas.map((c) => c.email)];
    assert.equal(new Set(correos).size, correos.length); // sin correos repetidos
});

test("demo: historial de ejemplo del panel, coherente con las cuentas", () => {
    const { cuentasPanelDemo, historialPanelDemo } = require("../scripts/demo/datos");
    const { ACCIONES } = require("../models/AccionAdmin");
    const hoy = fechaBanco("2026-11-05");
    const correos = new Set(cuentasPanelDemo(hoy).map((c) => c.email));
    const historial = historialPanelDemo(hoy);
    assert.ok(historial.length >= 3);
    for (const h of historial) {
        assert.ok(ACCIONES.includes(h.accion), h.accion);
        assert.ok(correos.has(h.usuarioEmail), h.usuarioEmail);
        assert.ok(h.fecha < hoy);
    }
});
