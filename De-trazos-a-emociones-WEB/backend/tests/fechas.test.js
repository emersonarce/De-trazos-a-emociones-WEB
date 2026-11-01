// Fechas de nacimiento: se leen como fecha local. Se fija la zona de Colombia
// (UTC−5), donde new Date("YYYY-MM-DD") cae en el día anterior.
process.env.TZ = "America/Bogota";

const test = require("node:test");
const assert = require("node:assert/strict");
const { edadDesdeFecha } = require("../services/ia/contexto");

test("edadDesdeFecha suma el año el día del cumpleaños, no el día antes", () => {
    assert.equal(edadDesdeFecha("2018-03-15", new Date(2026, 2, 14, 20)), 7);
    assert.equal(edadDesdeFecha("2018-03-15", new Date(2026, 2, 15, 8)), 8);
});
