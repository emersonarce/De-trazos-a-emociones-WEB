const test = require("node:test");
const assert = require("node:assert/strict");
const { limpiarTextoIA, limpiarResultadoIA, parsearRespuestaIA, parsearTextoLibre } = require("../services/ia/parseo");

test("limpiarTextoIA quita caracteres en chino y normaliza la puntuación", () => {
    assert.equal(limpiarTextoIA("emocional: en一方面，el sol"), "emocional: en, el sol");
    assert.equal(limpiarTextoIA("Fin。Nota（breve）"), "Fin. Nota (breve)");
});

test("limpiarTextoIA no toca el español normal", () => {
    const texto = "Tildes áéíóú ñ, ¿preguntas? ¡exclamaciones! “comillas”\n\nOtro párrafo.";
    assert.equal(limpiarTextoIA(texto), texto);
    assert.equal(limpiarTextoIA(undefined), undefined);
});

test("limpiarResultadoIA limpia textos y listas, pero guarda el crudo tal cual", () => {
    const r = limpiarResultadoIA({ rasgos_observados: ["Sol，triste"], lectura_orientativa: "Hola。", raw: "x，y", duracion_ms: 5 });
    assert.deepEqual(r, { rasgos_observados: ["Sol, triste"], lectura_orientativa: "Hola.", raw: "x，y", duracion_ms: 5 });
});

test("parsearRespuestaIA: JSON directo, con bloque de código y con texto alrededor", () => {
    const obj = { emocion_predominante: "calma", intensidad: "baja" };
    assert.deepEqual(parsearRespuestaIA(JSON.stringify(obj)), { ok: true, datos: obj });
    assert.deepEqual(parsearRespuestaIA("```json\n" + JSON.stringify(obj) + "\n```"), { ok: true, datos: obj });
    assert.deepEqual(parsearRespuestaIA("Aquí va: " + JSON.stringify(obj) + " fin"), { ok: true, datos: obj });
});

test("parsearRespuestaIA: JSON roto devuelve el texto como lectura y marca parseo_incompleto", () => {
    const r = parsearRespuestaIA('{"emocion_predominante": "miedo", "interpretacion": "se cortó');
    assert.equal(r.ok, false);
    assert.equal(r.datos.parseo_incompleto, true);
    assert.equal(r.datos.emocion_predominante, "No determinada");
    assert.match(r.datos.lectura_orientativa, /se cortó/);
});

test("parsearTextoLibre separa las secciones (con negritas, viñetas y numeración)", () => {
    const texto = [
        "**RASGOS OBSERVADOS:**", "- Tres niños llorando", "* Una casa inundada", "3. Rayos en el cielo", "",
        "**INTERPRETACIÓN:**", "Podría sugerir miedo.", "", "También preocupación.", "",
        "**EMOCIÓN PREDOMINANTE:** Miedo.", "",
        "## INTENSIDAD: Alta", "",
        "LECTURA ORIENTATIVA:", "Conversar con calma."
    ].join("\n");
    const r = parsearTextoLibre(texto);
    assert.equal(r.ok, true);
    assert.deepEqual(r.datos, {
        rasgos_observados: ["Tres niños llorando", "Una casa inundada", "Rayos en el cielo"],
        interpretacion: "Podría sugerir miedo.\n\nTambién preocupación.",
        emocion_predominante: "Miedo",
        intensidad: "alta",
        lectura_orientativa: "Conversar con calma."
    });
});

test("parsearTextoLibre acepta títulos sin tilde y en minúscula", () => {
    const r = parsearTextoLibre("Emocion predominante: tristeza\nintensidad: MEDIA\nInterpretacion: algo\nLectura orientativa: acompañar");
    assert.equal(r.ok, true);
    assert.equal(r.datos.emocion_predominante, "tristeza");
    assert.equal(r.datos.intensidad, "media");
    assert.equal(r.datos.interpretacion, "algo");
});

test("parsearTextoLibre no confunde frases del texto con títulos", () => {
    const r = parsearTextoLibre("INTERPRETACIÓN:\nIntensidad media en los trazos\nEMOCIÓN PREDOMINANTE: calma\nINTENSIDAD: baja");
    assert.equal(r.datos.interpretacion, "Intensidad media en los trazos");
    assert.equal(r.datos.intensidad, "baja");
});

test("parsearTextoLibre sin títulos usa el respaldo", () => {
    const r = parsearTextoLibre("Un texto cualquiera sin secciones.");
    assert.equal(r.ok, false);
    assert.equal(r.datos.parseo_incompleto, true);
    assert.equal(r.datos.lectura_orientativa, "Un texto cualquiera sin secciones.");
});

test("normalizarEmocion quita la intensidad del nombre y pone tildes", () => {
    const { normalizarEmocion } = require("../services/ia/parseo");
    assert.equal(normalizarEmocion("Melancolia alta"), "Melancolía");
    assert.equal(normalizarEmocion("Ansiedad leve"), "Ansiedad");
    assert.equal(normalizarEmocion("Alegria (alta)"), "Alegría");
    assert.equal(normalizarEmocion("Estres de intensidad media"), "Estrés");
    assert.equal(normalizarEmocion("Tristeza profunda"), "Tristeza profunda");
    assert.equal(normalizarEmocion("Medianamente tranquilo"), "Medianamente tranquilo");
    assert.equal(limpiarResultadoIA({ emocion_predominante: "melancolia alta" }).emocion_predominante, "melancolía");
});
