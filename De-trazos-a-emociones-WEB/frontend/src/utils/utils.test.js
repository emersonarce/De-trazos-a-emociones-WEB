// Pruebas de utilidades puras del frontend: npm test (node --test).
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDuracion } from './tiempo.js';
import { limpiarTextoIA, limpiarResultadoIA, enParrafos } from './textoIA.js';
import { mensajeDeError } from './errores.js';
import { correoValido, avisoDeError } from '../components/auth/avisos.js';

test('formatDuracion: segundos, minutos, horas y sin dato', () => {
  assert.equal(formatDuracion(45000), '45 s');
  assert.equal(formatDuracion(60000), '1 min');
  assert.equal(formatDuracion(3492000), '58 min 12 s');
  assert.equal(formatDuracion(3780000), '1 h 3 min');
  assert.equal(formatDuracion(7200000), '2 h');
  assert.equal(formatDuracion(undefined), null);
  assert.equal(formatDuracion(-5), null);
});

test('limpiarTextoIA quita chino y respeta el español', () => {
  assert.equal(limpiarTextoIA('emocional: en一方面，el sol'), 'emocional: en, el sol');
  assert.equal(limpiarTextoIA('¿Tildes? áéíóú ñ.'), '¿Tildes? áéíóú ñ.');
  assert.deepEqual(limpiarResultadoIA({ rasgos_observados: ['a，b'], raw: 'x，y' }), { rasgos_observados: ['a, b'], raw: 'x，y' });
});

test('enParrafos respeta los saltos y agrupa frases de a 3', () => {
  assert.deepEqual(enParrafos('Uno.\n\nDos.'), ['Uno.', 'Dos.']);
  assert.deepEqual(enParrafos('Uno. Dos. Tres. Cuatro.'), ['Uno. Dos. Tres.', 'Cuatro.']);
  assert.deepEqual(enParrafos(''), []);
});

test('mensajeDeError traduce la falta de conexión', () => {
  assert.match(mensajeDeError(new TypeError('Failed to fetch')), /No pudimos conectar/);
  assert.equal(mensajeDeError(new Error('Error eliminando el análisis')), 'Error eliminando el análisis');
  assert.equal(mensajeDeError(null), 'Inténtalo de nuevo.');
});

test('avisos del login: correo y mensajes del backend', () => {
  assert.equal(correoValido('ana@correo.com'), true);
  assert.equal(correoValido('ana@correo'), false);
  assert.equal(avisoDeError(new Error('Credenciales incorrectas')).titulo, 'Correo o contraseña incorrectos');
  assert.equal(avisoDeError(new Error('Tu cuenta está pendiente de aprobación por el administrador.')).tipo, 'espera');
  assert.deepEqual(avisoDeError(new Error('El correo ya está registrado')).campos, ['email']);
});

test('emociones: nombre limpio y reconocimiento sin depender de tildes', async () => {
  const { nombreEmocion, emotionVisual, esEmocionNegativa } = await import('./emociones.js');
  assert.equal(nombreEmocion('Melancolia alta'), 'Melancolía');
  assert.equal(emotionVisual('Melancolia alta').clave, 'tristeza');
  assert.equal(emotionVisual('alegria').clave, 'alegria');
  assert.equal(emotionVisual('Estres').clave, 'ansiedad');
  assert.equal(esEmocionNegativa('melancolia'), true);
  assert.equal(limpiarResultadoIA({ emocion_predominante: 'Melancolia alta' }).emocion_predominante, 'Melancolía');
});

test('clima emocional: valencia, puntos y tendencia', async () => {
  const { valenciaEmocion, puntosClima, resumenClima } = await import('./clima.js');
  assert.equal(valenciaEmocion('Alegre'), 1);
  assert.equal(valenciaEmocion('Melancolia alta'), -1);
  assert.equal(valenciaEmocion('sorpresa'), 0);
  const ahora = Date.parse('2026-10-30T12:00:00Z');
  const s = (emocion, intensidad, fecha) => ({ fecha, resultado_ia: { emocion_predominante: emocion, intensidad } });
  // Del más reciente al más antiguo, como llegan del backend.
  const sesiones = [s('Melancolía', 'media', '2026-10-30'), s('Alegre', 'media', '2026-10-29'), s('Calma', 'alta', '2026-05-01')];
  const todo = puntosClima(sesiones, 'todo', ahora);
  assert.deepEqual(todo.map((p) => p.valor), [3, 2, -2]);
  assert.equal(puntosClima(sesiones, '3m', ahora).length, 2);
  assert.equal(resumenClima(puntosClima(sesiones, '3m', ahora)).tipo, 'baja');
  assert.equal(resumenClima([{ valor: -2 }, { valor: 1 }]).tipo, 'mejora');
  assert.equal(resumenClima([{ valor: 2 }, { valor: 2 }]).tipo, 'estable');
  assert.equal(resumenClima([{ valor: 2 }]), null);
});

test('contexto del niño: valor más reciente no vacío por campo y filas legibles', async () => {
  const { contextoDelNino, filasContexto } = await import('./contextoNino.js');
  // Del más reciente al más antiguo: el último se hizo sin contexto (solo nombre).
  const analisis = [
    { contexto_nino: { nombre: 'Sofía', situacion_actual: '' } },
    { contexto_nino: { nombre: 'Sofía', situacion_actual: 'Cambio de colegio', comportamiento: 'triste' } },
    { contexto_nino: { nombre: 'Sofía', situacion_actual: 'Viejo', genero: 'niña', fecha_nacimiento: '2017-05-10' } },
  ];
  const ctx = contextoDelNino(analisis);
  assert.equal(ctx.situacion_actual, 'Cambio de colegio');
  assert.equal(ctx.comportamiento, 'triste');
  assert.equal(ctx.genero, 'niña');
  assert.equal(ctx.diagnostico_previo, '');
  const filas = filasContexto(ctx);
  assert.deepEqual(filas.map((f) => f[0]), ['Edad', 'Género', 'Situación actual', 'Comportamiento reciente']);
  assert.equal(filas[1][1], 'Niña');
  assert.deepEqual(filasContexto({}), []);
  assert.deepEqual(filasContexto({ descripcion_dibujo: 'Su familia en la playa' }), [['Descripción del dibujo', 'Su familia en la playa']]);
});

test('medición de color y trazo: colores proporcionales y filas legibles', async () => {
  const { coloresMedicion, filasMedicion } = await import('./medicion.js');
  const m = {
    uso_hoja: 15.4, tonos: { calidos: 60.2, frios: 30, neutros: 9.8 }, tonos_oscuros: 8.3, intensidad_color: 57,
    relleno: 72.5, trazo: 'relleno', colores: [{ nombre: 'amarillo', porcentaje: 45 }, { nombre: 'azul', porcentaje: 30 }, { nombre: 'gris', porcentaje: 15 }],
  };
  const colores = coloresMedicion(m);
  assert.equal(colores.length, 3);
  assert.equal(Math.round(colores.reduce((s, c) => s + c.ancho, 0)), 100);
  assert.equal(colores[0].texto, '45 %');
  const filas = filasMedicion(m);
  assert.deepEqual(filas.map((f) => f[0]), ['Uso de la hoja', 'Tonos', 'Tonos oscuros', 'Intensidad del color', 'Tipo de trazo']);
  assert.equal(filas[0][1], '15 % de la hoja tiene trazo o color');
  assert.match(filas[4][1], /áreas coloreadas/);
  assert.deepEqual(filasMedicion(null), []);
  assert.deepEqual(coloresMedicion({}), []);
});
