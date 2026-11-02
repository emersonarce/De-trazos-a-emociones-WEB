const test = require("node:test");
const assert = require("node:assert/strict");
const { nombreBaseDemo } = require("../scripts/demo/base");
const { generarBanco } = require("../scripts/demo/datos");
const { dibujo, GRUPOS_DIBUJO } = require("../scripts/demo/dibujos");

test("demo: la base de prueba siempre termina en _demo", () => {
    assert.equal(nombreBaseDemo({ MONGO_URI: "mongodb+srv://u:p@c.mongodb.net/emocionesDB?retryWrites=true" }), "emocionesDB_demo");
    assert.equal(nombreBaseDemo({ MONGO_URI: "mongodb://localhost:27017" }), "test_demo");
    assert.equal(nombreBaseDemo({ MONGO_URI: "mongodb://x/emocionesDB", MONGO_DB_DEMO: "otra_demo" }), "otra_demo");
    assert.throws(() => nombreBaseDemo({ MONGO_URI: "mongodb://x/emocionesDB", MONGO_DB_DEMO: "emocionesDB" }), /_demo/);
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
