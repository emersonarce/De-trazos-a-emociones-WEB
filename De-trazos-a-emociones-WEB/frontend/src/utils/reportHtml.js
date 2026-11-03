// HTML (con estilos en línea) de los informes PDF. Cada función devuelve
// BLOQUES: tarjetas que exportarPdf.js captura por separado con html2canvas y
// acomoda en páginas A4 sin partirlas. Documento claro con la identidad de la
// app (logo, tipografía de la marca, color de cada emoción). Todo el lenguaje
// es orientativo, nunca clínico.

import { limpiarResultadoIA, enParrafos } from './textoIA.js';
import { emotionVisual, intensityInfo, formatFechaHora, formatHora, textoEdad, emocionPredominante } from './emociones.js';
import { filasContexto, textoGenero } from './contextoNino.js';
import { coloresMedicion, filasMedicion, NOTA_MEDICION } from './medicion.js';
import { porMes, rangoAnalisis } from './periodos.js';

// Colores fijos para impresión (los del tema claro de la app): el PDF se ve
// igual aunque la app esté en tema oscuro.
const TEXT = '#1f2433';
const MUTED = '#6b6880';
const BORDER = '#e4e2ee';
const ACCENT = '#5b49cf';
const SUAVE = '#f6f5fb';
const EMO = {
  alegria: '#0f9e9a', calma: '#4f9a33', asombro: '#b7860b', carino: '#d14d8f',
  tristeza: '#3b6fd4', miedo: '#8150d6', enojo: '#d8453f', ansiedad: '#d9771f', neutra: '#64748b',
};
// Colores de la rueda del logo (tema claro).
export const RUEDA = ['#eaa22a', '#2f9e7d', '#4a7fd1', '#e0697f'];

const DISPLAY = "Fraunces, Georgia, 'Times New Roman', serif";
const SANS = "'DM Sans', Arial, sans-serif";

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
const colorEmocion = (emocion) => EMO[emotionVisual(emocion || '').clave] || EMO.neutra;
const capital = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

const chipEmocion = (emocion) => {
  const c = colorEmocion(emocion);
  return `<span style="display:inline-flex;align-items:center;gap:7px;background:${rgba(c, 0.1)};color:${c};
    border:1px solid ${rgba(c, 0.3)};padding:5px 13px;border-radius:999px;font-size:13px;font-weight:700;">
    <span style="width:8px;height:8px;border-radius:50%;background:${c};display:inline-block;"></span>${esc(capital(emocion) || 'Sin dato')}</span>`;
};

// Intensidad en tres tramos con el color de la emoción.
const barrasIntensidad = (emocion, intensidad) => {
  const c = colorEmocion(emocion);
  const inten = intensityInfo(intensidad || '');
  const tramos = [1, 2, 3]
    .map((n) => `<span style="display:inline-block;width:22px;height:6px;border-radius:6px;margin-right:4px;
      background:${n <= inten.valor ? c : '#e9e7f1'};"></span>`)
    .join('');
  return `<span style="display:inline-flex;align-items:center;">${tramos}
    <span style="display:inline-block;width:104px;font-size:12px;color:${MUTED};margin-left:6px;">Intensidad ${esc(inten.label)}</span></span>`;
};

const tituloSeccion = (texto) =>
  `<div style="font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${ACCENT};margin:0 0 10px;">${esc(texto)}</div>`;

const parrafos = (texto) =>
  enParrafos(texto)
    .map((p) => `<p style="margin:0 0 9px;color:${TEXT};font-size:13px;line-height:1.65;">${esc(p)}</p>`)
    .join('');

// Tarjeta (un bloque del PDF).
const card = (inner, { acento } = {}) =>
  `<div style="background:#ffffff;border:1px solid ${BORDER};border-radius:16px;padding:20px 22px;
    font-family:${SANS};color:${TEXT};${acento ? `border-left:4px solid ${acento};` : ''}">${inner}</div>`;

// ---------- Portada y cabecera ----------

// Primera página: logo, marca, tipo de documento, periodo (en los reportes) y fecha.
export const portada = ({ logo, tipo, periodo, fecha }) => `
  <div style="font-family:${SANS};background:linear-gradient(135deg,#efeafd 0%,#f7f4ff 50%,#fdf3ec 100%);
    padding:30px 36px 0;border-bottom:1px solid ${BORDER};">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:14px;flex-shrink:0;">
        ${logo ? `<img src="${logo}" style="width:58px;height:58px;" />` : ''}
        <div>
          <div style="font-family:${DISPLAY};font-size:28px;font-weight:700;color:${TEXT};line-height:1.1;">De trazos a emociones</div>
          <div style="font-size:11px;letter-spacing:0.14em;color:${MUTED};font-weight:700;margin-top:5px;">PSICOLOGÍA INFANTIL · IA</div>
        </div>
      </div>
      <div style="text-align:right;max-width:340px;">
        <div style="font-family:${DISPLAY};font-size:17px;font-weight:700;color:${ACCENT};">${esc(tipo)}</div>
        ${periodo ? `<div style="font-size:13px;font-weight:700;color:${TEXT};margin-top:5px;line-height:1.35;text-wrap:balance;">${esc(periodo)}</div>` : ''}
        <div style="font-size:11px;color:${MUTED};margin-top:4px;">Generado el ${esc(fecha)}</div>
      </div>
    </div>
    <div style="display:flex;height:4px;margin-top:22px;">
      ${RUEDA.map((c) => `<div style="flex:1;background:${c};"></div>`).join('')}
    </div>
  </div>`;

// Páginas siguientes: cabecera compacta.
export const cabecera = ({ logo, tipo, periodo }) => `
  <div style="font-family:${SANS};display:flex;align-items:center;justify-content:space-between;
    padding:14px 36px 12px;border-bottom:1px solid ${BORDER};background:#ffffff;">
    <div style="display:flex;align-items:center;gap:9px;">
      ${logo ? `<img src="${logo}" style="width:24px;height:24px;" />` : ''}
      <span style="font-family:${DISPLAY};font-size:15px;font-weight:700;color:${TEXT};">De trazos a emociones</span>
    </div>
    <span style="font-size:11px;color:${MUTED};">${esc(periodo ? `${tipo} · ${periodo}` : tipo)}</span>
  </div>`;

// ---------- Detalle de un análisis ----------

export const bloquesDetalle = (analisis, imagenDataUrl) => {
  const r = limpiarResultadoIA(analisis.resultado_ia || {});
  const ctx = analisis.contexto_nino || {};
  const nombre = ctx.nombre;
  const esIndep = analisis.independiente || !nombre || nombre === 'Sin nombre';
  const c = colorEmocion(r.emocion_predominante);
  const rasgos = Array.isArray(r.rasgos_observados) ? r.rasgos_observados.filter(Boolean) : [];
  const lectura = r.lectura_orientativa || r.analisis_completo || '';
  const sinContexto = analisis.analizado_sin_contexto === true;
  const filas = esIndep || sinContexto ? [] : filasContexto(ctx);
  const datosNino = [textoEdad(ctx), ctx.genero && textoGenero(ctx.genero)].filter(Boolean).join(' · ');
  const bloques = [];

  // El contexto que se muestra es el que se usó en ESTE análisis. Si el dibujo
  // se analizó sin contexto (modo Solo dibujo, asignado después al niño), se
  // dice así, en vez de presentar sus datos básicos como si se hubieran usado.
  const contextoHtml = filas.length
    ? `<div style="margin-top:18px;padding:14px 16px;background:${SUAVE};border-radius:12px;">
        ${tituloSeccion('Contexto con el que se analizó')}
        <div style="display:flex;flex-wrap:wrap;gap:10px 22px;">
          ${filas.map(([etq, val]) => `
            <div style="${['Situación actual', 'Diagnóstico previo', 'Descripción del dibujo', 'Comentó mientras dibujaba'].includes(etq) ? 'width:100%;' : 'min-width:140px;'}">
              <div style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};">${esc(etq)}</div>
              <div style="font-size:12.5px;color:${TEXT};margin-top:2px;line-height:1.5;">${esc(val)}</div>
            </div>`).join('')}
        </div>
      </div>`
    : (esIndep || sinContexto)
      ? `<div style="margin-top:18px;padding:12px 16px;background:${SUAVE};border-radius:12px;font-size:12.5px;line-height:1.55;color:${TEXT};">
          ${tituloSeccion('Contexto del análisis')}
          Este dibujo se analizó <b>sin el contexto del niño</b> (modo «Solo dibujo»): la lectura se basa ${ctx.descripcion_dibujo ? 'en el dibujo y en la descripción aportada' : 'solo en lo que se ve en el dibujo'}.
          ${ctx.descripcion_dibujo ? `<div style="margin-top:8px;"><div style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};">Descripción del dibujo</div><div style="margin-top:2px;">${esc(ctx.descripcion_dibujo)}</div></div>` : ''}
          ${!esIndep && datosNino ? `<div style="margin-top:6px;color:${MUTED};">Datos del niño: ${esc(datosNino)}</div>` : ''}
        </div>`
      : '';

  // 1) Encabezado del análisis, dibujo y contexto.
  bloques.push(card(`
    <div style="display:flex;gap:20px;align-items:flex-start;">
      <div style="flex:1;min-width:0;">
        <div style="font-family:${DISPLAY};font-size:22px;font-weight:700;margin:0 0 4px;">
          ${esIndep ? 'Análisis del dibujo' : `Análisis de ${esc(nombre)}`}
        </div>
        <div style="font-size:12px;color:${MUTED};margin:0 0 14px;">${esc(formatFechaHora(analisis.fecha))}</div>
        <div style="font-size:11px;color:${MUTED};font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px;">Emoción predominante</div>
        <div style="margin:0 0 10px;">${chipEmocion(r.emocion_predominante)}</div>
        ${barrasIntensidad(r.emocion_predominante, r.intensidad)}
      </div>
      ${imagenDataUrl ? `<img src="${imagenDataUrl}" style="width:210px;max-height:210px;object-fit:contain;border-radius:12px;border:1px solid ${BORDER};background:#fff;" />` : ''}
    </div>
    ${contextoHtml}
  `, { acento: c }));

  // 2) Rasgos observados.
  if (rasgos.length) {
    bloques.push(card(`${tituloSeccion('Rasgos observados')}
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${rasgos.map((x) => `<span style="display:inline-block;padding:7px 12px;border-radius:10px;background:${SUAVE};
          font-size:12.5px;color:${TEXT};line-height:1.45;">${esc(x)}</span>`).join('')}
      </div>`));
  }
  // 3) Medición de color y trazo, calculada sobre la imagen (sin IA).
  const filasMed = filasMedicion(r.medicion_imagen);
  if (filasMed.length) {
    const colores = coloresMedicion(r.medicion_imagen);
    bloques.push(card(`${tituloSeccion('Medición de color y trazo (calculada sobre la imagen, sin IA)')}
      ${colores.length ? `<div style="display:flex;height:14px;border-radius:999px;overflow:hidden;border:1px solid ${BORDER};margin:0 0 8px;">
          ${colores.map((col) => `<span style="display:block;width:${col.ancho}%;background:${col.color};"></span>`).join('')}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:${MUTED};margin:0 0 12px;">
          ${colores.map((col) => `<span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${col.color};margin-right:5px;"></span>${esc(capital(col.nombre))} <b style="color:${TEXT};">${esc(col.texto)}</b></span>`).join('')}
        </div>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:10px 22px;">
        ${filasMed.map(([etq, val]) => `<div style="min-width:200px;">
          <div style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};">${esc(etq)}</div>
          <div style="font-size:12.5px;color:${TEXT};margin-top:2px;line-height:1.5;">${esc(val)}</div></div>`).join('')}
      </div>
      <div style="font-size:11px;color:${MUTED};margin-top:10px;line-height:1.5;">${esc(NOTA_MEDICION)}</div>`));
  }
  // 4) Interpretación.
  if (r.interpretacion) bloques.push(card(`${tituloSeccion('Interpretación')}${parrafos(r.interpretacion)}`));
  // 5) Lectura orientativa (destacada con el color de la emoción).
  if (lectura) {
    bloques.push(`<div style="font-family:${SANS};border-radius:16px;padding:20px 22px;border:1px solid ${rgba(c, 0.3)};
      background:${rgba(c, 0.05)};border-left:4px solid ${c};">
      ${tituloSeccion('Lectura orientativa')}${parrafos(lectura)}</div>`);
  }
  return bloques;
};

// ---------- Historial de un niño ----------

// Distribución de emociones (barras con el color de cada emoción).
const graficoDistribucion = (lista) => {
  const conteo = {};
  lista.forEach((a) => {
    const e = (limpiarResultadoIA(a.resultado_ia || {}).emocion_predominante || 'Sin dato').toLowerCase();
    conteo[e] = (conteo[e] || 0) + 1;
  });
  const entradas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entradas.map(([, n]) => n));
  const filas = entradas
    .map(([emo, n]) => {
      const c = colorEmocion(emo);
      return `<div style="display:flex;align-items:center;gap:10px;margin:0 0 9px;">
        <div style="width:130px;font-size:12.5px;color:${TEXT};white-space:nowrap;overflow:hidden;">${esc(capital(emo))}</div>
        <div style="flex:1;background:#eeecf5;border-radius:8px;height:14px;">
          <div style="width:${Math.round((n / max) * 100)}%;background:${c};height:14px;border-radius:8px;"></div>
        </div>
        <div style="width:24px;text-align:right;font-size:12px;font-weight:700;color:${TEXT};">${n}</div>
      </div>`;
    })
    .join('');
  return filas || `<div style="color:${MUTED};font-size:13px;">Sin datos.</div>`;
};

const FILAS_POR_BLOQUE = 14;

// Lista de análisis (fecha, o solo la hora, emoción e intensidad) en el orden
// recibido, en bloques para no partir filas entre páginas.
const bloquesLista = (titulo, lista, { soloHora = false, acento } = {}) => {
  const bloques = [];
  for (let i = 0; i < lista.length; i += FILAS_POR_BLOQUE) {
    const filas = lista.slice(i, i + FILAS_POR_BLOQUE).map((a) => {
      const r = limpiarResultadoIA(a.resultado_ia || {});
      return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid ${BORDER};">
        <span style="font-size:12.5px;color:${TEXT};width:190px;">${esc(soloHora ? formatHora(a.fecha) : formatFechaHora(a.fecha))}</span>
        <span style="flex:1;">${chipEmocion(r.emocion_predominante)}</span>
        ${barrasIntensidad(r.emocion_predominante, r.intensidad)}
      </div>`;
    }).join('');
    bloques.push(card(`${tituloSeccion(i === 0 ? titulo : `${titulo} (continuación)`)}${filas}`, { acento }));
  }
  return bloques;
};
const porFecha = (lista, orden) => [...lista].sort((a, b) => orden * (new Date(a.fecha || 0) - new Date(b.fecha || 0)));

// Reporte anual: cuántos análisis hubo cada mes y su emoción predominante.
const bloqueMeses = (titulo, lista, acento) => card(`${tituloSeccion(titulo)}${porMes(lista).map(({ mes, analisis }) => `
  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid ${BORDER};">
    <span style="font-size:12.5px;color:${TEXT};width:190px;">${esc(mes)}</span>
    <span style="flex:1;">${chipEmocion(emocionPredominante(analisis))}</span>
    <span style="width:90px;text-align:right;font-size:12.5px;color:${MUTED};">${analisis.length} análisis</span>
  </div>`).join('')}`, { acento });

export const bloquesHistorial = (nombre, lista) => {
  const emo = emocionPredominante(lista);
  const resumen = card(`
    <div style="font-family:${DISPLAY};font-size:22px;font-weight:700;margin:0 0 4px;">Historial de ${esc(nombre)}</div>
    <div style="font-size:12px;color:${MUTED};margin:0 0 16px;">${lista.length} análisis registrados</div>
    <div style="display:flex;align-items:center;gap:10px;margin:0 0 18px;">
      <span style="font-size:12px;color:${MUTED};">Emoción predominante:</span>${chipEmocion(emo)}
    </div>
    ${tituloSeccion('Distribución de emociones')}
    ${graficoDistribucion(lista)}
  `);
  // Del más reciente al más antiguo, como en el Historial.
  return [resumen, ...bloquesLista('Análisis registrados', porFecha(lista, -1))];
};

// ---------- Reporte por periodo ----------

// `ninos`: [{ nombre, contexto, analisis }] con solo los análisis del periodo.
// `nivel`: 'todo', 'anio', 'mes', 'semana' o 'dia'; `periodo`: el periodo en
// palabras. Abre con un resumen del periodo y sigue con una tarjeta por niño
// (con las fechas de sus análisis); en un año, también cuántos hubo cada mes, y
// en un mes, semana o día, la lista de cada análisis en orden cronológico (en
// un día, solo con la hora).
export const bloquesConsolidado = (ninos, { nivel = 'todo', periodo = '' } = {}) => {
  if (!ninos.length) {
    return [card(`<div style="color:${MUTED};font-size:14px;">No hay análisis para incluir en este reporte.</div>`)];
  }
  const todos = ninos.flatMap((n) => n.analisis);
  const general = emocionPredominante(todos);
  const bloques = [card(`
    ${tituloSeccion('Periodo del reporte')}
    <div style="font-family:${DISPLAY};font-size:22px;font-weight:700;margin:0 0 8px;">${esc(periodo || 'Todo el historial')}</div>
    <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px 10px;font-size:12.5px;color:${MUTED};">
      <span>${todos.length} análisis de ${ninos.length === 1 ? '1 niño' : `${ninos.length} niños`}</span>
      ${general ? `<span>·</span><span>Emoción más frecuente:</span>${chipEmocion(general)}` : ''}
    </div>
  `, { acento: ACCENT })];

  for (const n of ninos) {
    const emo = emocionPredominante(n.analisis);
    const edad = textoEdad(n.contexto || {});
    const sit = n.contexto?.situacion_actual;
    // En el reporte de un día la fecha ya es la del periodo.
    const cuantos = `${n.analisis.length} análisis${nivel === 'dia' ? '' : `, ${rangoAnalisis(n.analisis)}`}`;
    bloques.push(card(`
      <div style="font-family:${DISPLAY};font-size:20px;font-weight:700;margin:0 0 4px;">${esc(n.nombre)}</div>
      <div style="font-size:12px;color:${MUTED};margin:0 0 12px;">
        ${[edad && esc(edad), n.contexto?.genero && esc(textoGenero(n.contexto.genero)), esc(cuantos)].filter(Boolean).join('&nbsp;&nbsp;·&nbsp;&nbsp;')}
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin:0 0 14px;">
        <span style="font-size:12px;color:${MUTED};">Emoción predominante:</span>${chipEmocion(emo)}
      </div>
      ${sit ? `<div style="font-size:12.5px;color:${TEXT};margin:0 0 14px;padding:10px 12px;background:${SUAVE};border-radius:10px;"><b>Situación actual:</b> ${esc(sit)}</div>` : ''}
      ${tituloSeccion('Distribución de emociones')}
      ${graficoDistribucion(n.analisis)}
    `, { acento: colorEmocion(emo) }));
    if (nivel === 'anio') {
      bloques.push(bloqueMeses(`Análisis de ${n.nombre} por mes`, n.analisis, colorEmocion(emo)));
    } else if (nivel !== 'todo') {
      bloques.push(...bloquesLista(`Análisis de ${n.nombre}`, porFecha(n.analisis, 1), { soloHora: nivel === 'dia', acento: colorEmocion(emo) }));
    }
  }
  return bloques;
};

// Nota final del documento.
export const notaFinal = () =>
  `<div style="font-family:${SANS};font-size:11px;color:${MUTED};line-height:1.6;padding:12px 16px;border-radius:12px;background:${SUAVE};">
    Este documento es un apoyo orientativo y no reemplaza el diagnóstico ni el criterio de un profesional.
    La interpretación de los dibujos considera siempre el contexto del niño.
  </div>`;
