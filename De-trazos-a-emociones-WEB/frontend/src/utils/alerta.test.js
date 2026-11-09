// Regla de alerta («Señal para acompañar»): npm test (node --test).
import test from 'node:test';
import assert from 'node:assert/strict';
import { senalParaAcompanar, textoSenal } from './alerta.js';

const AHORA = new Date(2026, 9, 31, 12).getTime();
const dibujo = (emocion, haceDias) => ({
  fecha: new Date(AHORA - haceDias * 86400000).toISOString(),
  resultado_ia: { emocion_predominante: emocion },
});

test('alerta: 3 o más dibujos seguidos con malestar, aunque sean viejos', () => {
  const lista = [dibujo('Tristeza', 40), dibujo('Miedo', 50), dibujo('Enojo', 60), dibujo('Ansiedad', 61), dibujo('Alegría', 70)];
  assert.deepEqual(senalParaAcompanar(lista, AHORA), { tipo: 'seguidos', cantidad: 4 });
});

test('alerta: 3 con malestar en los últimos 7 días, aunque no sean seguidos', () => {
  const lista = [dibujo('Tristeza', 1), dibujo('Calma', 2), dibujo('Miedo', 3), dibujo('Ansiedad', 6), dibujo('Alegría', 9)];
  assert.deepEqual(senalParaAcompanar(lista, AHORA), { tipo: 'semana', cantidad: 3 });
});

test('alerta: en los últimos 30 días hay más malestar que bienestar', () => {
  const lista = [dibujo('Tristeza', 2), dibujo('Alegría', 10), dibujo('Miedo', 15), dibujo('Enojo', 25), dibujo('Calma', 28), dibujo('Alegría', 45)];
  assert.deepEqual(senalParaAcompanar(lista, AHORA), { tipo: 'mes', malestar: 3, bienestar: 2 });
});

test('alerta: no avisa con pocos dibujos, con empate ni con más bienestar', () => {
  assert.equal(senalParaAcompanar([], AHORA), null);
  assert.equal(senalParaAcompanar([dibujo('Tristeza', 1)], AHORA), null);
  assert.equal(senalParaAcompanar([dibujo('Tristeza', 1), dibujo('Miedo', 3)], AHORA), null);
  assert.equal(senalParaAcompanar([dibujo('Tristeza', 1), dibujo('Alegría', 5), dibujo('Miedo', 12), dibujo('Calma', 20)], AHORA), null);
  assert.equal(senalParaAcompanar([dibujo('Tristeza', 2), dibujo('Alegría', 5), dibujo('Miedo', 12), dibujo('Calma', 20), dibujo('Asombro', 25)], AHORA), null);
  // Dibujos con malestar de hace más de un mes, ya no seguidos: no avisan
  assert.equal(senalParaAcompanar([dibujo('Alegría', 1), dibujo('Tristeza', 40), dibujo('Miedo', 41), dibujo('Enojo', 42)], AHORA), null);
});

test('alerta: el texto dice qué señal se encontró', () => {
  assert.equal(textoSenal({ tipo: 'seguidos', cantidad: 4 }, 'Sofi'), 'Los últimos 4 dibujos de Sofi, seguidos, muestran emociones que suelen asociarse a malestar.');
  assert.equal(textoSenal({ tipo: 'semana', cantidad: 3 }, 'el niño'), 'En los últimos 7 días, 3 dibujos del niño muestran emociones que suelen asociarse a malestar.');
  assert.equal(textoSenal({ tipo: 'mes', malestar: 3, bienestar: 2 }, 'Tomi'), 'En los últimos 30 días hubo más dibujos de Tomi con malestar (3) que con bienestar (2).');
  assert.equal(textoSenal(null, 'Sofi'), '');
});
