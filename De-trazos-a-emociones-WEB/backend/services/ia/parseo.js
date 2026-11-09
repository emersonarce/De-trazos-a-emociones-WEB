// Convierte la respuesta del modelo en el objeto que guarda la app:
// { rasgos_observados, interpretacion, emocion_predominante, intensidad, lectura_orientativa }
// Nunca falla: si no logra separar los campos, devuelve el texto como lectura
// con parseo_incompleto: true para que el frontend muestre algo y avise.

// minicpm-v (basado en un modelo chino) a veces mete palabras en chino y
// puntuación de ancho completo en medio del español ("en一方面，el sol").
// Se pasa la puntuación a su forma normal y se quitan los caracteres CJK.
const PUNTUACION_ANCHA = { "，": ", ", "、": ", ", "。": ". ", "：": ": ", "；": "; ", "！": "! ", "？": "? ", "（": " (", "）": ") " };
function limpiarTextoIA(texto) {
    if (typeof texto !== "string") return texto;
    return texto
        .replace(/[，、。：；！？（）]/g, (c) => PUNTUACION_ANCHA[c])
        .replace(/[　-〿぀-ヿ㐀-䶿一-鿿가-힯豈-﫿＀-￯]+/g, "")
        .replace(/[ \t]+([,.;:!?)])/g, "$1")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
}
const sinTildes = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function limpiarResultadoIA(datos) {
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) return datos;
    for (const [clave, valor] of Object.entries(datos)) {
        if (clave === "raw") continue; // el texto crudo se guarda tal cual
        if (typeof valor === "string") datos[clave] = limpiarTextoIA(valor);
        else if (Array.isArray(valor)) datos[clave] = valor.map(limpiarTextoIA);
    }
    if (typeof datos.emocion_predominante === "string") {
        datos.emocion_predominante = normalizarEmocion(datos.emocion_predominante);
    }
    return datos;
}

// El modelo a veces mete la intensidad en el nombre de la emoción o la escribe
// sin tilde ("Melancolia alta"). La intensidad ya tiene su propio campo, así
// que se quita del nombre, y se ponen las tildes de las emociones comunes.
const CON_TILDE = {
    alegria: "alegría", melancolia: "melancolía", frustracion: "frustración", preocupacion: "preocupación",
    tension: "tensión", energia: "energía", satisfaccion: "satisfacción", confusion: "confusión",
    desesperacion: "desesperación", decepcion: "decepción", agitacion: "agitación", estres: "estrés",
    panico: "pánico", apatia: "apatía", emocion: "emoción", ilusion: "ilusión"
};
const PALABRAS_INTENSIDAD = /\b(?:de\s+)?(?:intensidad\s+)?(?:muy\s+)?(?:alta|alto|media|medio|baja|bajo|leve|moderada|moderado|intensa|intenso)\b/gi;

function normalizarEmocion(texto) {
    if (typeof texto !== "string") return texto;
    const sinIntensidad = texto
        .replace(PALABRAS_INTENSIDAD, " ")
        .replace(/\(\s*\)/g, " ")
        .replace(/\s{2,}/g, " ")
        .replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, "")
        .trim();
    const base = sinIntensidad || texto.trim();
    return base.replace(/[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+/g, (palabra) => {
        const correcta = CON_TILDE[sinTildes(palabra).toLowerCase()];
        if (!correcta) return palabra;
        return palabra[0] === palabra[0].toUpperCase() ? correcta[0].toUpperCase() + correcta.slice(1) : correcta;
    });
}

// Respaldo cuando no se pudo separar la respuesta en campos.
function respaldo(texto, rawContent) {
    return {
        ok: false,
        datos: {
            rasgos_observados: [],
            interpretacion: "",
            emocion_predominante: "No determinada",
            intensidad: "media",
            lectura_orientativa: texto,
            parseo_incompleto: true,
            raw: rawContent
        }
    };
}

// Respuesta en JSON (variantes "estructurado" y "equilibrado"). Si el JSON
// llega incompleto o mal formado, recupera el texto crudo.
function parsearRespuestaIA(rawContent) {
    const limpio = String(rawContent || "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    // 1) Intento directo
    try {
        return { ok: true, datos: JSON.parse(limpio) };
    } catch {
        // continúa con la recuperación
    }

    // 2) Intento extrayendo el primer bloque {...}
    const inicio = limpio.indexOf("{");
    const fin = limpio.lastIndexOf("}");
    if (inicio !== -1 && fin !== -1 && fin > inicio) {
        try {
            return { ok: true, datos: JSON.parse(limpio.slice(inicio, fin + 1)) };
        } catch {
            // continúa con el respaldo
        }
    }

    // 3) Respaldo: se guarda el texto crudo con la misma forma.
    return respaldo(limpio, rawContent);
}

// Respuesta en texto con títulos fijos (variante "libre"):
//   RASGOS OBSERVADOS: / INTERPRETACIÓN: / EMOCIÓN PREDOMINANTE: /
//   INTENSIDAD: / LECTURA ORIENTATIVA:
// Tolera negritas o almohadillas de markdown, numeración y títulos sin tilde.
const TITULOS = [
    ["rasgos", /^rasgos( observados)?$/],
    ["interpretacion", /^interpretacion$/],
    ["emocion", /^emocion( predominante)?$/],
    ["intensidad", /^intensidad( emocional)?$/],
    ["lectura", /^lectura( orientativa)?$/]
];

function detectarTitulo(linea) {
    const limpia = linea.replace(/[*_#`>]/g, "").trim();
    const m = limpia.match(/^(?:\d+\s*[.)-]\s*)?([^:]{3,40}?)\s*(?::\s*(.*))?$/);
    if (!m) return null;
    const titulo = sinTildes(m[1]).toLowerCase().replace(/\s+/g, " ").trim();
    const encontrado = TITULOS.find(([, re]) => re.test(titulo));
    return encontrado ? { clave: encontrado[0], resto: (m[2] || "").trim() } : null;
}

// Une líneas en párrafos: las líneas en blanco separan párrafos.
const enParrafos = (lineas) =>
    lineas.join("\n").replace(/[*_`]/g, "").replace(/\n{3,}/g, "\n\n").trim();

function parsearTextoLibre(rawContent) {
    const texto = String(rawContent || "").replace(/```\w*/g, "").trim();
    const secciones = {};
    let actual = null;
    for (const linea of texto.split(/\r?\n/)) {
        const titulo = detectarTitulo(linea);
        if (titulo) {
            actual = titulo.clave;
            secciones[actual] = secciones[actual] || [];
            if (titulo.resto) secciones[actual].push(titulo.resto);
        } else if (actual) {
            secciones[actual].push(linea);
        }
    }

    const rasgos = (secciones.rasgos || [])
        .map((l) => l.replace(/^\s*(?:[-*•·]|\d+[.)])\s*/, "").replace(/[*_`]/g, "").trim())
        .filter(Boolean)
        .slice(0, 10);
    const emocion = enParrafos(secciones.emocion || [])
        .split("\n")[0]
        .replace(/[.;:]+$/, "")
        .trim();
    const textoIntensidad = sinTildes(enParrafos(secciones.intensidad || [])).toLowerCase();
    const intensidad = (textoIntensidad.match(/\b(alta|media|baja)\b/) || [])[1] || "media";
    const interpretacion = enParrafos(secciones.interpretacion || []);
    const lectura = enParrafos(secciones.lectura || []);

    // Mínimo para considerarlo bien separado: la emoción y algún texto de análisis.
    if (!emocion || !(interpretacion || lectura)) {
        return respaldo(texto, rawContent);
    }

    return {
        ok: true,
        datos: {
            rasgos_observados: rasgos,
            interpretacion,
            emocion_predominante: emocion,
            intensidad,
            lectura_orientativa: lectura
        }
    };
}

module.exports = { limpiarTextoIA, limpiarResultadoIA, normalizarEmocion, parsearRespuestaIA, parsearTextoLibre };
