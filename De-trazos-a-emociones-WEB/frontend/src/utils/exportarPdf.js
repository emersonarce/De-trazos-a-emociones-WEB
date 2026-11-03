import { portada, cabecera, bloquesDetalle, bloquesHistorial, bloquesConsolidado, notaFinal, RUEDA } from './reportHtml';
import { TITULO_REPORTE } from './periodos';

// PDF A4 con la identidad de la app: portada con el logo, cabecera compacta en
// las páginas siguientes y pie con número de página. El contenido va en
// bloques (tarjetas) que se capturan por separado y se acomodan sin partirlos;
// solo un bloque más alto que una página se reparte en tramos.

const ANCHO_PX = 794; // ancho del HTML capturado (A4 a 96 dpi)
const A4 = { w: 210, h: 297 }; // mm
const PX_A_MM = A4.w / ANCHO_PX;
const ESCALA = 2; // nitidez de la captura
const MARGEN_INF = 16; // mm reservados al pie
const SEPARACION = 5; // mm entre bloques

// Logo (misma geometría que components/common/Logo.jsx) con los colores del
// tema claro, rasterizado a PNG para el HTML y el PDF.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="192" height="192">
  <circle cx="19" cy="19" r="11.5" fill="${RUEDA[0]}" fill-opacity="0.9"/>
  <circle cx="29" cy="19" r="11.5" fill="${RUEDA[1]}" fill-opacity="0.9"/>
  <circle cx="19" cy="29" r="11.5" fill="${RUEDA[2]}" fill-opacity="0.9"/>
  <circle cx="29" cy="29" r="11.5" fill="${RUEDA[3]}" fill-opacity="0.9"/>
  <path d="M11 26 C16 20.5 20 30 24 26 C28 22 32 31.5 37 26" fill="none" stroke="#ffffff"
    stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
let logoPromesa = null;
const logoPng = () => {
  if (!logoPromesa) {
    logoPromesa = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 192;
        c.height = 192;
        c.getContext('2d').drawImage(img, 0, 0, 192, 192);
        try {
          resolve(c.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(LOGO_SVG)}`;
    });
  }
  return logoPromesa;
};

// Espera a que las imágenes del nodo terminen de cargar antes de capturar.
const esperarImagenes = (nodo) =>
  Promise.all(
    Array.from(nodo.querySelectorAll('img')).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          })
    )
  );

const htmlAPdf = async ({ tipo, periodo, bloques }, nombreArchivo) => {
  // jsPDF y html2canvas se cargan bajo demanda (chunks aparte).
  const [{ jsPDF }, html2canvasMod] = await Promise.all([import('jspdf'), import('html2canvas')]);
  const html2canvas = html2canvasMod.default;
  const logo = await logoPng();
  const fecha = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  const cont = document.createElement('div');
  Object.assign(cont.style, { position: 'fixed', left: '-10000px', top: '0', width: `${ANCHO_PX}px`, background: '#ffffff' });
  const crear = (html, padding) => {
    const d = document.createElement('div');
    Object.assign(d.style, { padding, background: '#ffffff', boxSizing: 'border-box' });
    d.innerHTML = html;
    cont.appendChild(d);
    return d;
  };
  const elPortada = crear(portada({ logo, tipo, periodo, fecha }), '0');
  const elCabecera = crear(cabecera({ logo, tipo, periodo }), '0');
  const elBloques = bloques.map((b) => crear(b, '0 36px'));
  document.body.appendChild(cont);

  try {
    await esperarImagenes(cont);
    try {
      await document.fonts?.ready;
    } catch {
      /* las fuentes de respaldo sirven igual */
    }
    const capturar = (el) => html2canvas(el, { scale: ESCALA, backgroundColor: '#ffffff', useCORS: true, logging: false });
    const cPortada = await capturar(elPortada);
    const cCabecera = await capturar(elCabecera);
    const cBloques = [];
    for (const el of elBloques) cBloques.push(await capturar(el));

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const alto = (canvas) => (canvas.height / ESCALA) * PX_A_MM;
    const poner = (canvas, y) => doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, y, A4.w, alto(canvas));
    const limite = A4.h - MARGEN_INF;
    const inicioPagina = alto(cCabecera) + 6;

    poner(cPortada, 0);
    let y = alto(cPortada) + 8;
    const nuevaPagina = () => {
      doc.addPage();
      poner(cCabecera, 0);
      y = inicioPagina;
    };

    for (const c of cBloques) {
      const h = alto(c);
      if (y + h > limite && (h <= limite - inicioPagina || y > limite - 30)) nuevaPagina();
      if (y + h <= limite) {
        poner(c, y);
        y += h + SEPARACION;
        continue;
      }
      // Bloque más alto que una página: se reparte en tramos.
      const pxPorMm = c.height / h;
      let desde = 0;
      while (desde < c.height) {
        const tramoPx = Math.min(c.height - desde, Math.floor((limite - y) * pxPorMm));
        const tramo = document.createElement('canvas');
        tramo.width = c.width;
        tramo.height = tramoPx;
        tramo.getContext('2d').drawImage(c, 0, desde, c.width, tramoPx, 0, 0, c.width, tramoPx);
        poner(tramo, y);
        desde += tramoPx;
        y += tramoPx / pxPorMm + SEPARACION;
        if (desde < c.height) nuevaPagina();
      }
    }

    // Pie en cada página.
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setDrawColor(228, 226, 238);
      doc.setLineWidth(0.2);
      doc.line(12, A4.h - 11, A4.w - 12, A4.h - 11);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(107, 104, 128);
      doc.text('De trazos a emociones · Apoyo orientativo, no reemplaza el criterio de un profesional', 12, A4.h - 6.5);
      doc.text(`Página ${i} de ${total}`, A4.w - 12, A4.h - 6.5, { align: 'right' });
    }

    doc.save(nombreArchivo || 'de-trazos-a-emociones.pdf');
  } finally {
    document.body.removeChild(cont);
  }
};

// Informe de un análisis (detalle y/o historial del niño).
export async function exportarAnalisis({ detalle, imagenDataUrl, historial, nombreArchivo }) {
  const bloques = [
    ...(detalle ? bloquesDetalle(detalle, imagenDataUrl) : []),
    ...(historial && historial.lista?.length ? bloquesHistorial(historial.nombre, historial.lista) : []),
    notaFinal(),
  ];
  const tipo = detalle ? 'Informe de análisis' : 'Historial emocional';
  await htmlAPdf({ tipo, bloques }, nombreArchivo);
}

// Reporte de los niños en un periodo: `nivel` ('todo', 'mes', 'semana' o 'dia')
// y `periodo`, el periodo en palabras, que sale en la portada y en cada página.
export async function exportarReporte(ninos, { nivel = 'todo', periodo = '', nombreArchivo } = {}) {
  await htmlAPdf(
    { tipo: TITULO_REPORTE[nivel], periodo, bloques: [...bloquesConsolidado(ninos, { nivel, periodo }), notaFinal()] },
    nombreArchivo || 'de-trazos-reporte.pdf'
  );
}
