// "Clima emocional" del Historial: ubica cada análisis entre emociones más
// agradables (arriba) y más difíciles (abajo); la distancia al centro es la
// intensidad. Es una simplificación orientativa para ver cambios en el tiempo,
// no una medida clínica.
import { intensityInfo, valenciaEmocion } from './emociones.js';

// +1 agradable, -1 difícil, 0 neutra/no reconocida (la misma clasificación de
// emociones que las caras y la alerta).
export { valenciaEmocion };

// Periodos del gráfico: todo el historial, o un año, mes, semana (de lunes a
// domingo) o día concretos.
export const NIVELES = [['todo', 'Todo'], ['anio', 'Año'], ['mes', 'Mes'], ['semana', 'Semana'], ['dia', 'Día']];

const DIA_MS = 86400000;
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

const fecha = (anio, mes, dia = 1, hora = 0) => new Date(anio, mes, dia, hora);
const inicioDia = (d) => fecha(d.getFullYear(), d.getMonth(), d.getDate());
const sumarDias = (d, n) => fecha(d.getFullYear(), d.getMonth(), d.getDate() + n);
const lunesDe = (d) => sumarDias(inicioDia(d), -((d.getDay() + 6) % 7));
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Ventana { desde, hasta } (hasta excluido) del periodo que contiene la fecha
// `ref`. «Todo» va del primer al último análisis, con un margen a los lados.
export function ventanaPeriodo(nivel, ref, sessions = []) {
  const d = new Date(ref);
  if (nivel === 'anio') return { desde: fecha(d.getFullYear(), 0), hasta: fecha(d.getFullYear() + 1, 0) };
  if (nivel === 'mes') return { desde: fecha(d.getFullYear(), d.getMonth()), hasta: fecha(d.getFullYear(), d.getMonth() + 1) };
  if (nivel === 'semana') {
    const lunes = lunesDe(d);
    return { desde: lunes, hasta: sumarDias(lunes, 7) };
  }
  if (nivel === 'dia') return { desde: inicioDia(d), hasta: sumarDias(d, 1) };
  const tiempos = sessions.map((s) => new Date(s.fecha).getTime()).filter(Number.isFinite);
  if (!tiempos.length) return { desde: inicioDia(d), hasta: sumarDias(d, 1) };
  const min = Math.min(...tiempos);
  const max = Math.max(...tiempos);
  const margen = Math.max((max - min) * 0.04, DIA_MS / 2);
  return { desde: new Date(min - margen), hasta: new Date(max + margen) };
}

// Fecha de referencia un periodo antes (paso -1) o después (paso 1).
export function moverPeriodo(nivel, ref, paso) {
  const d = new Date(ref);
  if (nivel === 'anio') return fecha(d.getFullYear() + paso, d.getMonth());
  if (nivel === 'mes') return fecha(d.getFullYear(), d.getMonth() + paso);
  if (nivel === 'semana') return sumarDias(d, 7 * paso);
  if (nivel === 'dia') return sumarDias(d, paso);
  return d;
}

// Nombre del periodo, para mostrarlo entre las flechas.
export function etiquetaPeriodo(nivel, { desde }) {
  if (nivel === 'anio') return String(desde.getFullYear());
  if (nivel === 'mes') return `${capital(MESES[desde.getMonth()])} de ${desde.getFullYear()}`;
  if (nivel === 'semana') {
    const fin = sumarDias(desde, 6);
    const otroAnio = desde.getFullYear() !== fin.getFullYear() ? ` ${desde.getFullYear()}` : '';
    return `${desde.getDate()} ${MESES_CORTOS[desde.getMonth()]}${otroAnio} – ${fin.getDate()} ${MESES_CORTOS[fin.getMonth()]} ${fin.getFullYear()}`;
  }
  if (nivel === 'dia') return capital(`${DIAS[desde.getDay()]} ${desde.getDate()} de ${MESES[desde.getMonth()]} de ${desde.getFullYear()}`);
  return 'Todo el historial';
}

// Marcas del eje horizontal: { t, texto, zoom }. `zoom` ({ nivel, ref }) es el
// periodo al que se acerca el gráfico al hacer clic en la marca.
export function marcasEje(nivel, { desde, hasta }) {
  const marcas = [];
  const dias = (hasta - desde) / DIA_MS;
  if (nivel === 'dia') {
    for (let h = 0; h <= 24; h += 4) marcas.push({ t: fecha(desde.getFullYear(), desde.getMonth(), desde.getDate(), h), texto: `${h}:00`, zoom: null });
  } else if (nivel === 'semana' || (nivel === 'todo' && dias <= 10)) {
    for (let d = inicioDia(desde); d < hasta; d = sumarDias(d, 1)) {
      marcas.push({ t: new Date(d.getTime() + DIA_MS / 2), texto: `${DIAS_CORTOS[d.getDay()]} ${d.getDate()}`, zoom: { nivel: 'dia', ref: d } });
    }
  } else if (nivel === 'mes' || (nivel === 'todo' && dias <= 62)) {
    for (let d = lunesDe(desde); d < hasta; d = sumarDias(d, 7)) {
      marcas.push({ t: d, texto: `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`, zoom: { nivel: 'semana', ref: d } });
    }
  } else if (nivel === 'anio') {
    for (let m = 0; m < 12; m++) {
      marcas.push({ t: fecha(desde.getFullYear(), m, 15), texto: MESES_CORTOS[m], zoom: { nivel: 'mes', ref: fecha(desde.getFullYear(), m) } });
    }
  } else {
    // Todo: una marca cada 1, 2, 3 o 6 meses según lo largo del historial; en
    // enero va el año (clic: ese año), en los demás el mes (clic: ese mes).
    const cada = dias <= 280 ? 1 : dias <= 550 ? 2 : dias <= 1100 ? 3 : 6;
    for (let d = fecha(desde.getFullYear(), desde.getMonth() + 1); d < hasta; d = fecha(d.getFullYear(), d.getMonth() + 1)) {
      if (d.getMonth() % cada !== 0) continue;
      const enero = d.getMonth() === 0;
      marcas.push({ t: d, texto: enero ? String(d.getFullYear()) : MESES_CORTOS[d.getMonth()], zoom: { nivel: enero ? 'anio' : 'mes', ref: d } });
    }
  }
  return marcas.filter((m) => m.t >= desde && m.t <= hasta);
}

// Puntos del gráfico dentro de la ventana (sin ventana, todos), en orden
// cronológico: { analisis, fecha, t, emocion, intensidad, valor } con valor entre
// -3 (difícil, alta) y +3 (agradable, alta).
export function puntosClima(sessions = [], { desde, hasta } = {}) {
  return sessions
    .map((s) => ({ s, t: new Date(s.fecha).getTime() }))
    .filter(({ t }) => Number.isFinite(t) && (!desde || t >= desde.getTime()) && (!hasta || t < hasta.getTime()))
    .sort((a, b) => a.t - b.t)
    .map(({ s, t }) => {
      const emocion = s.resultado_ia?.emocion_predominante || '';
      const inten = intensityInfo(s.resultado_ia?.intensidad || '');
      return { analisis: s, fecha: s.fecha, t, emocion, intensidad: inten.label, valor: valenciaEmocion(emocion) * inten.valor };
    });
}

// Promedio del clima por tramo (día, semana o mes, según lo largo del periodo),
// para la línea de tendencia cuando hay muchos puntos: [{ t, valor }] con t en
// la mitad del tramo.
export function promediosClima(puntos = []) {
  if (!puntos.length) return [];
  const dias = (puntos[puntos.length - 1].t - puntos[0].t) / DIA_MS;
  const tramo = dias > 180
    ? (d) => [fecha(d.getFullYear(), d.getMonth()), fecha(d.getFullYear(), d.getMonth() + 1)]
    : dias > 31
      ? (d) => [lunesDe(d), sumarDias(lunesDe(d), 7)]
      : (d) => [inicioDia(d), sumarDias(d, 1)];
  const grupos = new Map();
  for (const p of puntos) {
    const [ini, fin] = tramo(new Date(p.t));
    const g = grupos.get(ini.getTime()) || { t: (ini.getTime() + fin.getTime()) / 2, suma: 0, n: 0 };
    g.suma += p.valor;
    g.n += 1;
    grupos.set(ini.getTime(), g);
  }
  return [...grupos.values()].map((g) => ({ t: g.t, valor: g.suma / g.n }));
}

// Frase breve sobre la tendencia: compara la mitad más reciente con la anterior.
export function resumenClima(puntos = []) {
  if (puntos.length < 2) return null;
  const mitad = Math.floor(puntos.length / 2);
  const promedio = (lista) => lista.reduce((a, p) => a + p.valor, 0) / lista.length;
  const diferencia = promedio(puntos.slice(puntos.length - mitad)) - promedio(puntos.slice(0, mitad));
  if (diferencia >= 1) return { tipo: 'mejora', texto: 'Los dibujos más recientes reflejan emociones más agradables que los anteriores.' };
  if (diferencia <= -1) return { tipo: 'baja', texto: 'Los dibujos más recientes reflejan emociones más difíciles que los anteriores. Puede ser un buen momento para conversar con calma.' };
  return { tipo: 'estable', texto: 'El clima emocional de los dibujos se mantiene parecido en este periodo.' };
}
