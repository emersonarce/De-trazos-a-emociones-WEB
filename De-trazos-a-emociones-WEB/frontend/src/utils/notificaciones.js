// Avisos de la campana de notificaciones (components/common/Notificaciones.jsx):
// las señales para acompañar y los cumpleaños cercanos de cada niño, armados a
// partir de sus análisis. Las señales van primero, la más reciente arriba; los
// cumpleaños, del más próximo al más lejano.
import { infoCumple, emocionPredominante } from './emociones.js';
import { senalParaAcompanar, textoSenal } from './alerta.js';

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Niños con sus análisis, sin los dibujos independientes (igual que el Inicio).
export function ninosConAnalisis(analisis = []) {
  const mapa = new Map();
  for (const a of analisis) {
    if (a.independiente) continue;
    const nombre = (a.contexto_nino?.nombre || '').trim() || 'Sin nombre';
    if (!mapa.has(nombre)) mapa.set(nombre, { nombre, fecha_nacimiento: '', analisis: [] });
    const nino = mapa.get(nombre);
    if (!nino.fecha_nacimiento && a.contexto_nino?.fecha_nacimiento) nino.fecha_nacimiento = a.contexto_nino.fecha_nacimiento;
    nino.analisis.push(a);
  }
  return [...mapa.values()];
}

// La señal en pocas palabras, para la fila compacta.
export function resumenSenal(senal) {
  if (senal.tipo === 'seguidos') return `${senal.cantidad} dibujos seguidos con malestar`;
  if (senal.tipo === 'semana') return `${senal.cantidad} dibujos con malestar en 7 días`;
  return 'Más malestar que bienestar este mes';
}

// [{ id, tipo: 'senal' | 'cumple', nino, ... }]. El id identifica el aviso para
// marcarlo como leído: el de una señal cambia con cada dibujo nuevo (vuelve a
// avisar) y el de un cumpleaños, con la fecha del cumpleaños.
export function notificacionesDe(analisis = [], hoy = new Date()) {
  const senales = [];
  const cumples = [];
  for (const nino of ninosConAnalisis(analisis)) {
    const senal = senalParaAcompanar(nino.analisis, hoy.getTime());
    if (senal) {
      const ultimo = Math.max(...nino.analisis.map((a) => new Date(a.fecha).getTime() || 0));
      senales.push({
        id: `senal|${nino.nombre}|${senal.tipo}|${ultimo}`,
        tipo: 'senal',
        nino: nino.nombre,
        resumen: resumenSenal(senal),
        texto: textoSenal(senal, nino.nombre),
        ultimo,
      });
    }
    const cumple = infoCumple(nino.fecha_nacimiento, undefined, hoy);
    if (cumple) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + cumple.dias);
      cumples.push({
        id: `cumple|${nino.nombre}|${ymd(fecha)}`,
        tipo: 'cumple',
        nino: nino.nombre,
        edad: cumple.edad,
        dias: cumple.dias,
        cuando: cumple.cuando,
        emocion: emocionPredominante(nino.analisis),
      });
    }
  }
  senales.sort((a, b) => b.ultimo - a.ultimo);
  cumples.sort((a, b) => a.dias - b.dias);
  return [...senales, ...cumples];
}

// Abre la campana con el aviso `id` desplegado (por ejemplo, desde el Historial).
export const EVENTO_ABRIR = 'notificaciones:abrir';
export const abrirNotificacion = (id) => window.dispatchEvent(new CustomEvent(EVENTO_ABRIR, { detail: { id } }));
