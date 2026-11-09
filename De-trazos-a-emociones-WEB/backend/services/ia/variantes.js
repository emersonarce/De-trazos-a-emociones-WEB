// Cómo se le pide el análisis al modelo. IA_VARIANTE (en el .env) elige una:
//
//   estructurado (por defecto): el prompt completo va como mensaje de sistema,
//       la respuesta se fuerza a JSON con esquema y se penaliza la repetición
//       (1.2). Es el comportamiento que la app tenía hasta ahora.
//   equilibrado: el mismo prompt va junto a la imagen, JSON simple (sin
//       esquema) y una penalización suave (1.05).
//   libre: un prompt más breve junto a la imagen y respuesta en texto con
//       títulos fijos, que el backend separa en los mismos campos. Sin
//       penalización propia (usa la de Ollama). Es lo más parecido al primer
//       prototipo.
//
// Para compararlas con los mismos dibujos: backend/scripts/comparar-variantes.js

const VARIANTES = {
    estructurado: { formato: "schema", mensaje: "sistema", prompt: "completo", repeatPenalty: 1.2, repeatLastN: 256 },
    equilibrado: { formato: "json", mensaje: "usuario", prompt: "completo", repeatPenalty: 1.05, repeatLastN: 64 },
    libre: { formato: "libre", mensaje: "usuario", prompt: "libre", repeatPenalty: null, repeatLastN: null }
};

const VARIANTE_POR_DEFECTO = "estructurado";

const numero = (valor, porDefecto) => {
    const n = Number(valor);
    return valor !== undefined && valor !== "" && Number.isFinite(n) ? n : porDefecto;
};

let avisoVarianteMostrado = false;

// Configuración efectiva del análisis. `varianteForzada` se usa en el script
// de comparación; la app usa la del .env.
function resolverConfigIA(env = process.env, varianteForzada) {
    let nombre = String(varianteForzada || env.IA_VARIANTE || VARIANTE_POR_DEFECTO).toLowerCase().trim();
    if (!VARIANTES[nombre]) {
        if (!avisoVarianteMostrado) {
            console.warn(`IA_VARIANTE="${nombre}" no existe; se usa "${VARIANTE_POR_DEFECTO}". Opciones: ${Object.keys(VARIANTES).join(", ")}.`);
            avisoVarianteMostrado = true;
        }
        nombre = VARIANTE_POR_DEFECTO;
    }
    const cfg = { variante: nombre, ...VARIANTES[nombre] };

    // OLLAMA_FORMAT_MODE=json (anterior a IA_VARIANTE) sigue funcionando: para
    // versiones de Ollama sin soporte de esquema.
    if (cfg.formato === "schema" && String(env.OLLAMA_FORMAT_MODE || "").toLowerCase() === "json") {
        cfg.formato = "json";
    }
    cfg.repeatPenalty = numero(env.OLLAMA_REPEAT_PENALTY, cfg.repeatPenalty);

    cfg.url = env.OLLAMA_URL || "http://127.0.0.1:11434/api/chat";
    // minicpm-v es pequeño y rápido pero de redacción limitada; modelos más
    // grandes dan mejor análisis pero son más lentos (sobre todo en CPU).
    cfg.modelo = env.OLLAMA_MODEL || "minicpm-v";
    // Configurables para equipos sin GPU o con pocos recursos.
    cfg.numPredict = parseInt(env.OLLAMA_NUM_PREDICT, 10) || 4000;
    cfg.numCtx = parseInt(env.OLLAMA_NUM_CTX, 10) || 8192;
    cfg.temperatura = numero(env.OLLAMA_TEMPERATURE, 0.3);
    return cfg;
}

// AI_MODE: "ollama" (por defecto, análisis real) o "mock" (resultado simulado
// para probar el flujo sin Ollama). NUNCA debe usarse "mock" en la prueba piloto.
const modoIA = (env = process.env) => (env.AI_MODE || "ollama").toLowerCase();

module.exports = { VARIANTES, VARIANTE_POR_DEFECTO, resolverConfigIA, modoIA };
