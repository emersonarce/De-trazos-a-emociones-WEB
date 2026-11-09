// Avisos de la campana (señales para acompañar y cumpleaños): npm test (node --test).
import test from 'node:test';
import assert from 'node:assert/strict';
import { notificacionesDe, ninosConAnalisis, resumenSenal } from './notificaciones.js';

const HOY = new Date(2026, 10, 3, 10);
const dibujo = (nombre, emocion, haceDias, extra = {}) => ({
  fecha: new Date(HOY.getTime() - haceDias * 86400000).toISOString(),
  contexto_nino: { nombre, ...extra },
  resultado_ia: { emocion_predominante: emocion },
});

test('notificaciones: señales primero y cumpleaños del más próximo al más lejano', () => {
  const lista = [
    dibujo('Tomi', 'Tristeza', 1, { fecha_nacimiento: '2019-11-05' }),
    dibujo('Tomi', 'Miedo', 3),
    dibujo('Tomi', 'Tristeza', 5),
    dibujo('Luna', 'Alegría', 2, { fecha_nacimiento: '2018-11-03' }),
    dibujo('Isa', 'Calma', 4),
    { ...dibujo('', 'Tristeza', 1), independiente: true },
  ];
  const avisos = notificacionesDe(lista, HOY);
  assert.deepEqual(avisos.map((n) => `${n.tipo}:${n.nino}`), ['senal:Tomi', 'cumple:Luna', 'cumple:Tomi']);
  const [senal, luna, tomi] = avisos;
  assert.equal(senal.resumen, '3 dibujos seguidos con malestar');
  assert.match(senal.texto, /^Los últimos 3 dibujos de Tomi/);
  assert.deepEqual([luna.dias, luna.edad, luna.cuando, luna.id], [0, 8, 'hoy', 'cumple|Luna|2026-11-03']);
  assert.deepEqual([tomi.dias, tomi.edad, tomi.cuando, tomi.id], [2, 7, 'en 2 días', 'cumple|Tomi|2026-11-05']);
});

test('notificaciones: una señal vuelve a avisar cuando llega un dibujo nuevo', () => {
  const lista = [dibujo('Sofi', 'Tristeza', 2), dibujo('Sofi', 'Miedo', 4), dibujo('Sofi', 'Ansiedad', 6)];
  const antes = notificacionesDe(lista, HOY)[0].id;
  const despues = notificacionesDe([dibujo('Sofi', 'Enojo', 0), ...lista], HOY)[0].id;
  assert.match(antes, /^senal\|Sofi\|seguidos\|/);
  assert.notEqual(antes, despues);
});

test('notificaciones: el Historial (un niño) y la campana (todos) dan el mismo aviso', () => {
  const sofi = [dibujo('Sofi', 'Tristeza', 2), dibujo('Sofi', 'Miedo', 4), dibujo('Sofi', 'Ansiedad', 6)];
  const todos = [...sofi, dibujo('Isa', 'Calma', 1), dibujo('Isa', 'Alegría', 3)];
  assert.equal(notificacionesDe(sofi, HOY)[0].id, notificacionesDe(todos, HOY).find((n) => n.nino === 'Sofi').id);
});

test('notificaciones: nada que avisar', () => {
  assert.deepEqual(notificacionesDe([], HOY), []);
  const lista = [dibujo('Valen', 'Alegría', 1, { fecha_nacimiento: '2018-07-23' }), dibujo('Valen', 'Calma', 3)];
  assert.deepEqual(notificacionesDe(lista, HOY), []);
});

test('notificaciones: la fecha de nacimiento sale del análisis que la tenga', () => {
  const ninos = ninosConAnalisis([
    dibujo('Mateo', 'Calma', 1),
    dibujo('Mateo', 'Enojo', 5, { fecha_nacimiento: '2016-03-12' }),
    { ...dibujo('Mateo', 'Calma', 2), independiente: true },
  ]);
  assert.equal(ninos.length, 1);
  assert.equal(ninos[0].fecha_nacimiento, '2016-03-12');
  assert.equal(ninos[0].analisis.length, 2);
});

test('notificaciones: resumen corto de cada señal', () => {
  assert.equal(resumenSenal({ tipo: 'semana', cantidad: 3 }), '3 dibujos con malestar en 7 días');
  assert.equal(resumenSenal({ tipo: 'mes', malestar: 4, bienestar: 2 }), 'Más malestar que bienestar este mes');
});
