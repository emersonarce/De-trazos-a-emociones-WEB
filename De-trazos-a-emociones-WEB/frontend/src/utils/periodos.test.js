/* global process */
// Periodos de los reportes y fechas en el PDF: npm test (node --test).
import test from 'node:test';
import assert from 'node:assert/strict';
import { ventanaReporte, analisisDelPeriodo, fechaVecina, textoRango, textoPeriodo, archivoReporte, porMes, ymd, deYmd } from './periodos.js';
import { bloquesConsolidado, portada, cabecera } from './reportHtml.js';

process.env.TZ = 'America/Bogota';
const a = (anio, mes, dia, hora, emocion = 'alegría', nombre = 'Luna') => ({
  fecha: new Date(anio, mes, dia, hora).toISOString(),
  contexto_nino: { nombre },
  resultado_ia: { emocion_predominante: emocion, intensidad: 'media' },
});
// Del más reciente al más antiguo, como los manda la API.
const ANALISIS = [
  a(2026, 10, 4, 17, 'calma'), a(2026, 10, 4, 9), a(2026, 10, 2, 8, 'tristeza', 'Tomi'),
  a(2026, 9, 20, 10), a(2026, 8, 30, 15, 'enojo', 'Tomi'),
];

test('periodos: cada análisis cae en su año, mes, semana (lunes a domingo) o día', () => {
  const ref = new Date(2026, 10, 4, 12); // miércoles 4 de noviembre
  assert.equal(ventanaReporte('todo', ref), null);
  assert.equal(analisisDelPeriodo(ANALISIS, null).length, 5);
  assert.equal(analisisDelPeriodo(ANALISIS, ventanaReporte('anio', ref)).length, 5);
  assert.equal(analisisDelPeriodo(ANALISIS, ventanaReporte('anio', new Date(2025, 5, 1))).length, 0);
  assert.equal(analisisDelPeriodo(ANALISIS, ventanaReporte('mes', ref)).length, 3);
  assert.equal(analisisDelPeriodo(ANALISIS, ventanaReporte('semana', ref)).length, 3); // 2 al 8 de noviembre
  assert.equal(analisisDelPeriodo(ANALISIS, ventanaReporte('dia', ref)).length, 2);
  assert.equal(analisisDelPeriodo(ANALISIS, ventanaReporte('dia', new Date(2026, 10, 3))).length, 0);
});

test('periodos: las flechas saltan al periodo anterior o siguiente que tenga análisis', () => {
  const dia = ventanaReporte('dia', new Date(2026, 10, 4, 12));
  assert.equal(ymd(fechaVecina(ANALISIS, dia, -1)), '2026-11-02'); // se salta el 3, sin dibujos
  assert.equal(fechaVecina(ANALISIS, dia, 1), null);
  const mes = ventanaReporte('mes', new Date(2026, 9, 20));
  assert.equal(ymd(fechaVecina(ANALISIS, mes, -1)), '2026-09-30');
  assert.equal(ymd(fechaVecina(ANALISIS, mes, 1)), '2026-11-02');
  assert.equal(fechaVecina(ANALISIS, ventanaReporte('mes', new Date(2026, 8, 1)), -1), null);
  assert.equal(fechaVecina(ANALISIS, null, -1), null);
  assert.equal(ymd(fechaVecina(ANALISIS, ventanaReporte('anio', new Date(2025, 5, 1)), 1)), '2026-09-30');
});

test('periodos: el periodo en palabras, para la página y el PDF', () => {
  const ref = new Date(2026, 10, 4, 12);
  assert.equal(textoPeriodo('anio', ventanaReporte('anio', ref)), 'Año 2026');
  assert.equal(textoPeriodo('mes', ventanaReporte('mes', ref)), 'Noviembre de 2026');
  assert.equal(textoPeriodo('semana', ventanaReporte('semana', ref)), 'Semana del 2 al 8 de noviembre de 2026');
  assert.equal(textoPeriodo('semana', ventanaReporte('semana', new Date(2026, 9, 1))), 'Semana del 28 de septiembre al 4 de octubre de 2026');
  assert.equal(textoPeriodo('semana', ventanaReporte('semana', new Date(2026, 0, 1))), 'Semana del 29 de diciembre de 2025 al 4 de enero de 2026');
  assert.equal(textoPeriodo('dia', ventanaReporte('dia', ref)), 'Miércoles 4 de noviembre de 2026');
  assert.equal(textoPeriodo('todo', null, ANALISIS), 'Del 30 de septiembre al 4 de noviembre de 2026');
  assert.equal(textoPeriodo('todo', null, ANALISIS.slice(0, 2)), 'El 4 de noviembre de 2026');
  assert.equal(textoPeriodo('todo', null, []), 'Todo el historial');
  assert.equal(textoRango(new Date(2026, 10, 2), new Date(2026, 10, 4)), 'del 2 al 4 de noviembre de 2026');
});

test('periodos: el nombre del PDF lleva la fecha del periodo', () => {
  const ref = new Date(2026, 10, 4, 12);
  assert.equal(archivoReporte('anio', ventanaReporte('anio', ref)), 'de-trazos-reporte-anual-2026.pdf');
  assert.equal(archivoReporte('mes', ventanaReporte('mes', ref)), 'de-trazos-reporte-mensual-2026-11.pdf');
  assert.equal(archivoReporte('semana', ventanaReporte('semana', ref)), 'de-trazos-reporte-semanal-2026-11-02.pdf');
  assert.equal(archivoReporte('dia', ventanaReporte('dia', ref)), 'de-trazos-reporte-diario-2026-11-04.pdf');
  assert.equal(archivoReporte('todo', null, new Date(2026, 10, 5, 9)), 'de-trazos-reporte-consolidado-2026-11-05.pdf');
});

test('periodos: en el reporte anual, los análisis de cada mes en orden', () => {
  assert.deepEqual(porMes(ANALISIS).map((m) => [m.mes, m.analisis.length]), [['Septiembre', 1], ['Octubre', 1], ['Noviembre', 3]]);
  assert.deepEqual(porMes([]), []);
});

test('periodos: el valor del calendario se lee como fecha local', () => {
  const d = deYmd('2026-11-05');
  assert.deepEqual([d.getFullYear(), d.getMonth(), d.getDate()], [2026, 10, 5]);
  assert.equal(ymd(d), '2026-11-05');
  assert.equal(deYmd(''), null);
});

test('reporte PDF: el periodo y las fechas de los análisis salen en el documento', () => {
  const html = (partes) => partes.join('\n');
  assert.match(portada({ tipo: 'Reporte semanal', periodo: 'Semana del 2 al 8 de noviembre de 2026', fecha: '5 de noviembre de 2026' }), /Semana del 2 al 8 de noviembre de 2026[\s\S]*Generado el 5 de noviembre de 2026/);
  assert.match(cabecera({ tipo: 'Reporte semanal', periodo: 'Semana del 2 al 8 de noviembre de 2026' }), /Reporte semanal · Semana del 2 al 8/);
  assert.doesNotMatch(cabecera({ tipo: 'Informe de análisis' }), /·/);

  const ninos = [
    { nombre: 'Luna', contexto: {}, analisis: ANALISIS.slice(0, 2) },
    { nombre: 'Tomi', contexto: {}, analisis: [ANALISIS[2]] },
  ];
  const semana = html(bloquesConsolidado(ninos, { nivel: 'semana', periodo: 'Semana del 2 al 8 de noviembre de 2026' }));
  assert.match(semana, /Periodo del reporte[\s\S]*Semana del 2 al 8 de noviembre de 2026[\s\S]*3 análisis de 2 niños/);
  assert.match(semana, /2 análisis, el 4 de noviembre de 2026/);
  assert.match(semana, /Análisis de Luna[\s\S]*4 de noviembre de 2026, 09:00[\s\S]*4 de noviembre de 2026, 17:00/); // en orden cronológico
  assert.match(semana, /Análisis de Tomi[\s\S]*2 de noviembre de 2026, 08:00/);

  // En un día, la lista va solo con la hora; en «Todo», sin lista.
  const dia = html(bloquesConsolidado(ninos.slice(0, 1), { nivel: 'dia', periodo: 'Miércoles 4 de noviembre de 2026' }));
  assert.match(dia, /Análisis de Luna/);
  assert.doesNotMatch(dia, /de noviembre de 2026, \d/);
  const todo = html(bloquesConsolidado(ninos, { nivel: 'todo', periodo: 'Del 2 al 4 de noviembre de 2026' }));
  assert.doesNotMatch(todo, /Análisis de Luna/);
  assert.match(todo, /1 análisis, el 2 de noviembre de 2026/);

  // En un año, cuántos hubo cada mes en vez de la lista de cada uno.
  const anio = html(bloquesConsolidado([{ nombre: 'Luna', contexto: {}, analisis: [ANALISIS[0], ANALISIS[1], ANALISIS[3]] }], { nivel: 'anio', periodo: 'Año 2026' }));
  assert.match(anio, /3 análisis, del 20 de octubre al 4 de noviembre de 2026/);
  assert.match(anio, /Análisis de Luna por mes[\s\S]*Octubre[\s\S]*1 análisis[\s\S]*Noviembre[\s\S]*2 análisis/);
  assert.doesNotMatch(anio, /de noviembre de 2026, \d/);
});
