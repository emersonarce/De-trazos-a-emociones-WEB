const test = require("node:test");
const assert = require("node:assert/strict");
const { edadDesdeFecha, construirContextoFinal } = require("../services/ia/contexto");

test("edadDesdeFecha calcula los años cumplidos y rechaza fechas inválidas", () => {
    const hoy = new Date();
    const haceSiete = new Date(hoy.getFullYear() - 7, hoy.getMonth(), hoy.getDate()).toISOString().slice(0, 10);
    assert.equal(edadDesdeFecha(haceSiete), 7);
    assert.equal(edadDesdeFecha(""), null);
    assert.equal(edadDesdeFecha("no es fecha"), null);
});

test("sin datos (modo solo dibujo) el contexto queda vacío", () => {
    assert.equal(construirContextoFinal({}), "");
    assert.equal(construirContextoFinal(), "");
});

test("arma las secciones solo con los datos presentes", () => {
    const ctx = construirContextoFinal({ nombre: "Ana", edad: "8", situacion_actual: "Cambio de colegio", descripcion_dibujo: "Su familia" });
    assert.match(ctx, /## Información del niño\n- Nombre: Ana\n- Edad: 8 años/);
    assert.match(ctx, /- Situación en casa\/entorno: Cambio de colegio/);
    assert.match(ctx, /- Descripción aportada por el adulto: Su familia/);
    assert.doesNotMatch(ctx, /Género|Comportamiento|espontáneo/);
});

test("sanitizarContexto: solo campos permitidos, como texto, recortados y sin el nombre", () => {
    const { sanitizarContexto } = require("../services/ia/contexto");
    assert.equal(sanitizarContexto(undefined), null);
    assert.equal(sanitizarContexto("texto"), null);
    assert.equal(sanitizarContexto([1]), null);
    const r = sanitizarContexto({
        nombre: "Otro", situacion_actual: "  Cambio de colegio  ", genero: "niña",
        edad: 8, comportamiento: null, $where: "x", diagnostico_previo: "a".repeat(1500)
    });
    assert.deepEqual(Object.keys(r).sort(), ["diagnostico_previo", "edad", "genero", "situacion_actual"]);
    assert.equal(r.situacion_actual, "Cambio de colegio");
    assert.equal(r.edad, "8");
    assert.equal(r.diagnostico_previo.length, 1000);
});

test("el esquema de Analysis conserva la descripción del dibujo en contexto_nino", () => {
    const Analysis = require("../models/Analysis");
    const a = new Analysis({
        usuarioId: "000000000000000000000000",
        ruta_imagen: "/uploads/x.jpg",
        resultado_ia: { emocion_predominante: "calma" },
        contexto_nino: { descripcion_dibujo: "Su familia en la playa", campo_inventado: "x" }
    });
    assert.equal(a.validateSync(), undefined);
    const ctx = a.toObject().contexto_nino;
    assert.equal(ctx.descripcion_dibujo, "Su familia en la playa");
    assert.equal(ctx.campo_inventado, undefined); // los campos desconocidos se descartan
});
