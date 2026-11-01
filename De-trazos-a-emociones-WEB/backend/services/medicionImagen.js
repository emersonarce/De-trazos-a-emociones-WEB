// Medición de color y trazo calculada sobre la imagen, sin IA.
//
// Complementa la descripción del modelo con datos que el adulto puede
// contrastar: colores predominantes, uso de la hoja, tonos cálidos, fríos y
// oscuros, intensidad del color y si predominan las áreas coloreadas o las
// líneas. Es orientativa: la luz, las sombras y lo que aparezca fuera de la
// hoja pueden afectarla.
const { leerPixeles } = require("../utils/imagen");

const CALIDOS = new Set(["rojo", "naranja", "amarillo", "rosado", "marrón"]);
const FRIOS = new Set(["verde", "azul", "morado"]);
const OSCURO = 0.35; // brillo por debajo del cual un píxel se considera oscuro

// RGB (0-255) -> [tono 0-360, saturación 0-1, brillo 0-1]
function aHsv(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const v = max / 255;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    let h = 0;
    if (d > 0) {
        if (max === r) h = 60 * (((g - b) / d) % 6);
        else if (max === g) h = 60 * ((b - r) / d + 2);
        else h = 60 * ((r - g) / d + 4);
    }
    return [h < 0 ? h + 360 : h, s, v];
}

// Nombre del color de un píxel que no es papel.
function nombreColor(h, s, v) {
    if (v < 0.22) return "negro";
    if (s < 0.2) return v < OSCURO ? "negro" : "gris";
    if (h >= 12 && h < 50 && v < 0.55) return "marrón";
    if (h < 12 || h >= 340) return v > 0.85 && s < 0.45 ? "rosado" : "rojo";
    if (h < 40) return "naranja";
    if (h < 65) return "amarillo";
    if (h < 172) return "verde"; // incluye verde limón y verde menta
    if (h < 255) return "azul";
    if (h < 290) return "morado";
    return "rosado";
}

const pct = (parte, total) => (total > 0 ? Math.round((1000 * parte) / total) / 10 : 0);

// Región que se mide: se recortan las franjas del borde de la foto que casi no
// tienen papel (la mesa u otros objetos alrededor de la hoja), hasta un 15 %
// por lado, para no recortar dibujos que llegan al borde de la hoja.
function regionDeLaHoja(esPapel, width, height) {
    const enFila = (y, x0, x1) => {
        let c = 0;
        for (let x = x0; x <= x1; x += 1) c += esPapel[y * width + x];
        return c / (x1 - x0 + 1);
    };
    const enColumna = (x, y0, y1) => {
        let c = 0;
        for (let y = y0; y <= y1; y += 1) c += esPapel[y * width + x];
        return c / (y1 - y0 + 1);
    };
    const maxX = Math.floor(width * 0.15);
    const maxY = Math.floor(height * 0.15);
    let x0 = 0;
    let y0 = 0;
    let x1 = width - 1;
    let y1 = height - 1;
    for (let pasada = 0; pasada < 2; pasada += 1) {
        while (y0 < maxY && enFila(y0, x0, x1) < 0.1) y0 += 1;
        while (y1 > height - 1 - maxY && enFila(y1, x0, x1) < 0.1) y1 -= 1;
        while (x0 < maxX && enColumna(x0, y0, y1) < 0.1) x0 += 1;
        while (x1 > width - 1 - maxX && enColumna(x1, y0, y1) < 0.1) x1 -= 1;
    }
    return { x0, y0, x1, y1, recortada: x0 > 0 || y0 > 0 || x1 < width - 1 || y1 < height - 1 };
}

// Mide una imagen ya decodificada: { data, width, height, canales }.
function medirPixeles({ data, width, height, canales }) {
    const n = width * height;
    const H = new Float32Array(n);
    const S = new Float32Array(n);
    const V = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
        const k = i * canales;
        [H[i], S[i], V[i]] = aHsv(data[k], data[k + 1], data[k + 2]);
    }

    // Brillo típico del papel: mediana de los píxeles claros y poco saturados.
    const claros = [];
    for (let i = 0; i < n; i += 1) if (S[i] < 0.25 && V[i] > 0.45) claros.push(V[i]);
    claros.sort((a, b) => a - b);
    const brilloPapel = claros.length ? claros[Math.floor(claros.length / 2)] : 1;
    const umbral = brilloPapel - 0.14;
    const esPapel = new Uint8Array(n);
    for (let i = 0; i < n; i += 1) esPapel[i] = S[i] < 0.22 && V[i] >= umbral ? 1 : 0;

    const { x0, y0, x1, y1, recortada } = regionDeLaHoja(esPapel, width, height);
    const dibujado = new Uint8Array(n);
    const colores = {};
    let total = 0;
    let trazo = 0;
    let oscuros = 0;
    let calidos = 0;
    let frios = 0;
    let neutros = 0;
    let sumaSat = 0;
    let conColor = 0;
    for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
            const i = y * width + x;
            total += 1;
            if (esPapel[i]) continue;
            dibujado[i] = 1;
            trazo += 1;
            const nombre = nombreColor(H[i], S[i], V[i]);
            colores[nombre] = (colores[nombre] || 0) + 1;
            if (V[i] < OSCURO) oscuros += 1;
            if (CALIDOS.has(nombre)) calidos += 1;
            else if (FRIOS.has(nombre)) frios += 1;
            else neutros += 1;
            if (nombre !== "gris" && nombre !== "negro") {
                sumaSat += S[i];
                conColor += 1;
            }
        }
    }

    // Píxeles con trazo rodeados de trazo: áreas coloreadas (relleno), no líneas.
    let interiores = 0;
    for (let y = y0 + 1; y < y1; y += 1) {
        for (let x = x0 + 1; x < x1; x += 1) {
            const i = y * width + x;
            if (dibujado[i] && dibujado[i - 1] && dibujado[i + 1] && dibujado[i - width] && dibujado[i + width]) interiores += 1;
        }
    }

    const relleno = pct(interiores, trazo);
    return {
        version: 1,
        // Parte de la foto que se midió (en % de la foto) y si se recortó el borde.
        region: { x: pct(x0, width), y: pct(y0, height), ancho: pct(x1 - x0 + 1, width), alto: pct(y1 - y0 + 1, height) },
        borde_recortado: recortada,
        uso_hoja: pct(trazo, total),
        colores: Object.entries(colores)
            .map(([nombre, cantidad]) => ({ nombre, porcentaje: pct(cantidad, trazo) }))
            .filter((c) => c.porcentaje >= 1)
            .sort((a, b) => b.porcentaje - a.porcentaje)
            .slice(0, 6),
        tonos: { calidos: pct(calidos, trazo), frios: pct(frios, trazo), neutros: pct(neutros, trazo) },
        tonos_oscuros: pct(oscuros, trazo),
        intensidad_color: conColor ? Math.round((100 * sumaSat) / conColor) : 0,
        relleno,
        trazo: relleno >= 50 ? "relleno" : "linea",
    };
}

// Mide la imagen de un archivo. Devuelve null si no se puede (no debe impedir
// el análisis).
async function medirImagen(entrada) {
    try {
        return medirPixeles(await leerPixeles(entrada, { max: 320 }));
    } catch (error) {
        console.warn("No se pudo medir el color de la imagen:", error.message);
        return null;
    }
}

module.exports = { medirImagen, medirPixeles, nombreColor, aHsv };
