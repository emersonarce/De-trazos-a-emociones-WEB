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

test('emociones: se reconocen por palabra, no por pedazos de palabra', async () => {
  const { emotionVisual, esEmocionNegativa } = await import('./emociones.js');
  // «ira» dentro de otra palabra no es enojo, y las negaciones no son alegría ni calma
  for (const e of ['Admiración', 'Inspiración']) {
    assert.equal(emotionVisual(e).clave, 'asombro', e);
    assert.equal(esEmocionNegativa(e), false, e);
  }
  assert.equal(emotionVisual('Descontento').clave, 'enojo');
  assert.equal(emotionVisual('Intranquilidad').clave, 'ansiedad');
  // Malestar que antes no contaba para la alerta
  for (const e of ['Nerviosismo', 'Inseguridad', 'Preocupación', 'Rabia', 'Temor']) assert.equal(esEmocionNegativa(e), true, e);
  // Lo que ya funcionaba se mantiene
  assert.equal(emotionVisual('Ira').clave, 'enojo');
  assert.equal(emotionVisual('Contento').clave, 'alegria');
  assert.equal(emotionVisual('Paz interior').clave, 'calma');
  assert.equal(esEmocionNegativa('Tristeza'), true);
  assert.equal(esEmocionNegativa('Alegría con algo de tristeza'), true);
  assert.equal(esEmocionNegativa('Calma'), false);
});

test('emociones: cada grupo tiene su cara y su color', async () => {
  const { emotionVisual, valenciaEmocion } = await import('./emociones.js');
  const casos = {
    Cariño: 'carino', Enamoramiento: 'carino', Curiosidad: 'asombro', Sorpresa: 'asombro',
    Infelicidad: 'tristeza', Desamor: 'tristeza', Pánico: 'miedo', Orgullo: 'alegria',
    Serenidad: 'calma', Aburrimiento: 'neutra',
  };
  for (const [e, clave] of Object.entries(casos)) assert.equal(emotionVisual(e).clave, clave, e);
  // Miedo y tristeza ya no comparten la misma cara
  assert.notEqual(emotionVisual('Miedo').Icono, emotionVisual('Tristeza').Icono);
  assert.notEqual(emotionVisual('Miedo').cara, emotionVisual('Tristeza').cara);
  assert.equal(emotionVisual('Cariño').color, 'var(--emo-carino)');
  assert.equal(valenciaEmocion('Asombro'), 1);
  assert.equal(valenciaEmocion('Ansiedad'), -1);
});

test('clima emocional: valencia, puntos y tendencia', async () => {
  const { valenciaEmocion, puntosClima, resumenClima, ventanaPeriodo, promediosClima } = await import('./clima.js');
  assert.equal(valenciaEmocion('Alegre'), 1);
  assert.equal(valenciaEmocion('Melancolia alta'), -1);
  assert.equal(valenciaEmocion('sorpresa'), 1);
  assert.equal(valenciaEmocion('Aburrimiento'), 0);
  const s = (emocion, intensidad, fecha) => ({ fecha, resultado_ia: { emocion_predominante: emocion, intensidad } });
  // Del más reciente al más antiguo, como llegan del backend; dos el mismo día.
  const sesiones = [
    s('Melancolía', 'media', '2026-10-30T16:00:00'), s('Alegre', 'baja', '2026-10-30T09:00:00'),
    s('Alegre', 'media', '2026-10-29T10:00:00'), s('Calma', 'alta', '2026-05-01T09:00:00'),
  ];
  // «Todo» trae todos (sin tope de 12), en orden cronológico.
  const todo = puntosClima(sesiones, ventanaPeriodo('todo', 0, sesiones));
  assert.deepEqual(todo.map((p) => p.valor), [3, 2, 1, -2]);
  const octubre = puntosClima(sesiones, ventanaPeriodo('mes', new Date(2026, 9, 15)));
  assert.equal(octubre.length, 3);
  assert.equal(resumenClima(octubre).tipo, 'baja');
  const elDia = puntosClima(sesiones, ventanaPeriodo('dia', new Date(2026, 9, 30, 12)));
  assert.deepEqual(elDia.map((p) => p.emocion), ['Alegre', 'Melancolía']);
  // Promedio por tramo: los dos del 30 de octubre van juntos (1 y -2).
  assert.deepEqual(promediosClima(octubre).map((p) => p.valor), [2, -0.5]);
  assert.equal(resumenClima([{ valor: -2 }, { valor: 1 }]).tipo, 'mejora');
  assert.equal(resumenClima([{ valor: 2 }, { valor: 2 }]).tipo, 'estable');
  assert.equal(resumenClima([{ valor: 2 }]), null);
});

test('clima emocional: periodos, flechas y marcas del eje', async () => {
  const { ventanaPeriodo, moverPeriodo, etiquetaPeriodo, marcasEje } = await import('./clima.js');
  const ref = new Date(2026, 9, 31, 15); // sábado 31 de octubre de 2026
  const etiqueta = (nivel, r = ref) => etiquetaPeriodo(nivel, ventanaPeriodo(nivel, r));
  assert.equal(etiqueta('anio'), '2026');
  assert.equal(etiqueta('mes'), 'Octubre de 2026');
  assert.equal(etiqueta('semana'), '26 oct – 1 nov 2026');
  assert.equal(etiqueta('dia'), 'Sábado 31 de octubre de 2026');
  assert.equal(etiqueta('semana', new Date(2026, 11, 30)), '28 dic 2026 – 3 ene 2027');
  assert.equal(etiqueta('mes', moverPeriodo('mes', ref, 1)), 'Noviembre de 2026');
  assert.equal(etiqueta('mes', moverPeriodo('mes', new Date(2026, 0, 31), 1)), 'Febrero de 2026');
  assert.equal(etiqueta('semana', moverPeriodo('semana', ref, -1)), '19 oct – 25 oct 2026');
  assert.equal(etiqueta('dia', moverPeriodo('dia', ref, 1)), 'Domingo 1 de noviembre de 2026');
  assert.equal(etiqueta('anio', moverPeriodo('anio', ref, -1)), '2025');
  // Marcas: meses del año (clic: ese mes), días de la semana (clic: ese día), horas del día.
  const meses = marcasEje('anio', ventanaPeriodo('anio', ref));
  assert.deepEqual([meses.length, meses[0].texto, meses[0].zoom.nivel], [12, 'ene', 'mes']);
  const semana = marcasEje('semana', ventanaPeriodo('semana', ref));
  assert.deepEqual(semana.map((m) => m.texto), ['lun 26', 'mar 27', 'mié 28', 'jue 29', 'vie 30', 'sáb 31', 'dom 1']);
  assert.equal(semana[5].zoom.nivel, 'dia');
  const lunesDelMes = marcasEje('mes', ventanaPeriodo('mes', ref));
  assert.deepEqual(lunesDelMes.map((m) => m.texto), ['5 oct', '12 oct', '19 oct', '26 oct']);
  assert.equal(marcasEje('dia', ventanaPeriodo('dia', ref)).length, 7);
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
  assert.equal(filas[1][1], 'Femenino');
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

test('reanalizar: el contexto propuesto no mezcla niños sin nombre', async () => {
  const { contextoParaReanalizar } = await import('./contextoNino.js');
  const sinNombre = { contexto_nino: { edad: '8' } };
  const otroSinNombre = { contexto_nino: { situacion_actual: 'De otro niño' } };
  const propio = contextoParaReanalizar(sinNombre, [sinNombre, otroSinNombre]);
  assert.equal(propio.edad, '8');
  assert.equal(propio.situacion_actual, '');
  const tomas = { contexto_nino: { nombre: 'Tomás', edad: '7' } };
  const tomasAntes = { contexto_nino: { nombre: 'Tomás', situacion_actual: 'Cambio de colegio', edad: '6' } };
  const ctx = contextoParaReanalizar(tomas, [tomas, tomasAntes, otroSinNombre]);
  assert.equal(ctx.situacion_actual, 'Cambio de colegio');
  assert.equal(ctx.edad, '7');
  assert.equal(ctx.nombre, 'Tomás');
});

test('contexto: género, diagnóstico previo y tiempo con opciones', async () => {
  const { normalizarGenero, textoGenero, opcionDiagnostico, opcionTiempo, tiempoExacto } = await import('./contextoNino.js');
  assert.equal(normalizarGenero('niña'), 'femenino');
  assert.equal(normalizarGenero('masculino'), 'masculino');
  assert.equal(textoGenero('niño'), 'Masculino');
  assert.equal(textoGenero('no especificado'), 'Prefiero no decirlo');
  assert.deepEqual(opcionDiagnostico(''), { opcion: '', otro: '' });
  assert.deepEqual(opcionDiagnostico('Ninguno conocido.'), { opcion: 'Ninguno conocido', otro: '' });
  assert.deepEqual(opcionDiagnostico('TDAH'), { opcion: 'TDAH (déficit de atención e hiperactividad)', otro: '' });
  assert.deepEqual(opcionDiagnostico('Epilepsia'), { opcion: 'otro', otro: 'Epilepsia' });
  assert.deepEqual(opcionTiempo('5 a 15 minutos'), { opcion: '5 a 15 minutos', horas: '', minutos: '' });
  assert.deepEqual(opcionTiempo('12 minutos'), { opcion: '', horas: '', minutos: '12' });
  assert.deepEqual(opcionTiempo('2 horas'), { opcion: '', horas: '2', minutos: '' });
  assert.deepEqual(opcionTiempo('1 hora y 20 minutos'), { opcion: '', horas: '1', minutos: '20' });
  assert.deepEqual(opcionTiempo('un buen rato'), { opcion: '', horas: '', minutos: '' });
  assert.equal(tiempoExacto('', '12'), '12 minutos');
  assert.equal(tiempoExacto('', '1'), '1 minuto');
  assert.equal(tiempoExacto('1', ''), '1 hora');
  assert.equal(tiempoExacto('1', '20'), '1 hora y 20 minutos');
  assert.equal(tiempoExacto('2', '1'), '2 horas y 1 minuto');
  assert.equal(tiempoExacto('', ''), '');
  assert.equal(tiempoExacto('0', '0'), '');
});

test('tiempo exacto en un solo campo «hh:mm» (duración, sin a. m. ni p. m.)', async () => {
  const { mascaraDuracion, duracionDesdeTexto, textoDuracion } = await import('./contextoNino.js');
  // Las cifras entran por la derecha, como en un cronómetro.
  assert.equal(mascaraDuracion(''), '');
  assert.equal(mascaraDuracion('0'), '');
  assert.equal(mascaraDuracion('1'), '00:01');
  assert.equal(mascaraDuracion('00:015'), '00:15');
  assert.equal(mascaraDuracion('00:150'), '01:50');
  assert.equal(mascaraDuracion('1:30'), '01:30');
  assert.equal(mascaraDuracion('15:001'), '15:00'); // máximo 4 cifras
  assert.equal(mascaraDuracion('00:1'), '00:01'); // borrar corre las cifras
  // Se guarda igual que antes.
  assert.equal(duracionDesdeTexto('00:15'), '15 minutos');
  assert.equal(duracionDesdeTexto('01:00'), '1 hora');
  assert.equal(duracionDesdeTexto('01:20'), '1 hora y 20 minutos');
  assert.equal(duracionDesdeTexto('00:90'), '1 hora y 30 minutos');
  assert.equal(duracionDesdeTexto(''), '');
  // Y se vuelve a mostrar desde lo guardado (las opciones no van en el campo).
  assert.equal(textoDuracion('1 hora y 20 minutos'), '01:20');
  assert.equal(textoDuracion('12 minutos'), '00:12');
  assert.equal(textoDuracion('2 horas'), '02:00');
  assert.equal(textoDuracion('90 minutos'), '01:30');
  assert.equal(textoDuracion('5 a 15 minutos'), '');
  assert.equal(textoDuracion('un buen rato'), '');
  assert.equal(textoDuracion(''), '');
});

test('avisos de cuenta eliminada: al iniciar sesión y al registrarse con ese correo', () => {
  const login = avisoDeError(new Error('Esta cuenta fue eliminada. Si fue un error, pídele al administrador que la restaure.'));
  assert.equal(login.titulo, 'Esta cuenta fue eliminada');
  const registro = avisoDeError(new Error('Ese correo es de una cuenta eliminada. Si quieres recuperarla, pídele al administrador que la restaure.'));
  assert.equal(registro.titulo, 'Este correo es de una cuenta eliminada');
  assert.deepEqual(registro.campos, ['email']);
});

test('historial del panel: cada acción en una frase con su detalle', async () => {
  const { describirAccion } = await import('./historialAdmin.js');
  const base = { adminNombre: 'Admin Demo', usuarioNombre: 'Paula Díaz' };
  assert.equal(describirAccion({ ...base, accion: 'aprobar_solicitud' }).texto, 'Admin Demo aprobó la solicitud de Paula Díaz');
  assert.equal(describirAccion({ ...base, accion: 'deshabilitar' }).tono, 'alerta');
  const rol = describirAccion({ ...base, accion: 'cambiar_rol', detalle: { de: 'profesor', a: 'psicologo' } });
  assert.equal(rol.detalle, 'Profesor(a) → Psicólogo(a)');
  assert.equal(describirAccion({ ...base, accion: 'cambiar_permiso', detalle: { permiso: 'eliminarCuenta', valor: true } }).texto,
    'Admin Demo le dio a Paula Díaz el permiso «Eliminar su cuenta»');
  assert.match(describirAccion({ ...base, accion: 'cambiar_permiso', detalle: { permiso: 'descargarPdf', valor: false } }).texto, /le quitó/);
  const eliminar = describirAccion({ ...base, accion: 'eliminar_definitivo', detalle: { analisis: 12, estadoAnterior: 'eliminado' } });
  assert.equal(eliminar.tono, 'peligro');
  assert.equal(eliminar.detalle, 'Se borraron 12 análisis con sus imágenes. La cuenta estaba eliminada por su usuario.');
  assert.equal(describirAccion({ ...base, accion: 'eliminar_definitivo', detalle: { analisis: 1 } }).detalle, 'Se borró 1 análisis con su imagen.');
  assert.match(describirAccion({ ...base, accion: 'restablecer_password' }).texto, /restableció la contraseña de Paula Díaz/);
  // Sin nombres (p. ej. cuentas viejas), usa el correo.
  assert.equal(describirAccion({ accion: 'restaurar', adminEmail: 'a@x.co', usuarioEmail: 'p@x.co' }).texto, 'a@x.co restauró la cuenta de p@x.co');
});

test('historial: eliminar la cuenta de un administrador lo dice en el detalle', async () => {
  const { describirAccion } = await import('./historialAdmin.js');
  const r = describirAccion({ accion: 'eliminar_definitivo', adminNombre: 'Admin Demo', usuarioNombre: 'Valeria Castro', detalle: { analisis: 0, estadoAnterior: 'aprobado', eraAdmin: true } });
  assert.equal(r.detalle, 'No tenía análisis. La cuenta estaba aprobada. Era administrador(a).');
});
