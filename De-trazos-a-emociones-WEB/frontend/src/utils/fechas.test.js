/* global process */
// Fechas de nacimiento y aviso de cumpleaños: npm test (node --test).
import test from 'node:test';
import assert from 'node:assert/strict';
import { edadDesde, formatFecha, infoCumple } from './emociones.js';

// Zona de Colombia (UTC−5): ahí new Date('YYYY-MM-DD') cae en el día anterior.
process.env.TZ = 'America/Bogota';
const HOY = new Date(2026, 9, 31, 20, 0); // 31 de octubre de 2026, 8 p. m.

test('edadDesde suma el año el día del cumpleaños, no el día antes', () => {
  assert.equal(edadDesde('2018-10-31', new Date(2026, 9, 30, 20)), 7);
  assert.equal(edadDesde('2018-10-31', HOY), 8);
  assert.equal(edadDesde('no es fecha', HOY), null);
});

test('formatFecha muestra la fecha de nacimiento sin correrla un día', () => {
  assert.equal(formatFecha('2018-03-15'), '15 de marzo de 2018');
});

test('infoCumple avisa el mismo día y hasta 3 días antes', () => {
  assert.deepEqual(infoCumple('2018-10-31', undefined, HOY), { dias: 0, cuando: 'hoy', edad: 8 });
  assert.deepEqual(infoCumple('2019-11-01', undefined, HOY), { dias: 1, cuando: 'mañana', edad: 7 });
  assert.deepEqual(infoCumple('2017-11-03', undefined, HOY), { dias: 3, cuando: 'en 3 días', edad: 9 });
  assert.equal(infoCumple('2017-11-04', undefined, HOY), null); // faltan 4 días
  assert.equal(infoCumple('2018-10-30', undefined, HOY), null); // fue ayer
  assert.deepEqual(infoCumple('2016-01-01', undefined, new Date(2026, 11, 30)), { dias: 2, cuando: 'en 2 días', edad: 11 });
});

test('infoCumple ignora fechas que no son de un niño', () => {
  assert.equal(infoCumple('2026-10-31', undefined, HOY), null); // nació hoy
  assert.equal(infoCumple('0201-10-31', undefined, HOY), null); // año a medio escribir
  assert.equal(infoCumple('', undefined, HOY), null);
});
