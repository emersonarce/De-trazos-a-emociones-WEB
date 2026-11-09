// Proveedor Ollama (IA local): arma la petición según la variante y devuelve
// el texto que responde el modelo.
const axios = require("axios");
const { ESQUEMA_ANALISIS } = require("../esquema");
const { promptCompleto, promptLibre } = require("../prompt");

function construirPeticionOllama(cfg, imagenBase64, contextoFinal) {
    const prompt = cfg.prompt === "libre" ? promptLibre(contextoFinal) : promptCompleto(contextoFinal);
    const messages = cfg.mensaje === "sistema"
        ? [
            { role: "system", content: prompt },
            { role: "user", content: "Analiza esta imagen", images: [imagenBase64] }
        ]
        : [{ role: "user", content: prompt, images: [imagenBase64] }];

    const options = { num_predict: cfg.numPredict, num_ctx: cfg.numCtx, temperature: cfg.temperatura };
    if (cfg.repeatPenalty != null) options.repeat_penalty = cfg.repeatPenalty;
    if (cfg.repeatLastN != null) options.repeat_last_n = cfg.repeatLastN;

    const peticion = { model: cfg.modelo, messages, stream: false, options, keep_alive: "10m" };
    if (cfg.formato === "schema") peticion.format = ESQUEMA_ANALISIS;
    else if (cfg.formato === "json") peticion.format = "json";
    return peticion;
}

// Mensaje claro para los fallos más comunes (en vez de "connect ECONNREFUSED…").
function mensajeErrorOllama(error, cfg) {
    if (["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "EHOSTUNREACH"].includes(error.code)) {
        return "No se pudo conectar con el motor de IA (Ollama). Verifica que el servicio esté encendido.";
    }
    const detalle = error.response?.data?.error;
    if (detalle && /not found/i.test(detalle)) {
        return `El modelo "${cfg.modelo}" no está instalado en Ollama. Instálalo con: ollama pull ${cfg.modelo}`;
    }
    if (detalle) return `El motor de IA respondió con un error: ${detalle}`;
    return error.message;
}

async function analizarConOllama(cfg, imagenBase64, contextoFinal) {
    try {
        const response = await axios.post(cfg.url, construirPeticionOllama(cfg, imagenBase64, contextoFinal), {
            // Sin timeout: en CPU el análisis puede tardar muchos minutos.
            timeout: 0,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        return response.data.message.content;
    } catch (error) {
        throw new Error(mensajeErrorOllama(error, cfg));
    }
}

module.exports = { construirPeticionOllama, analizarConOllama, mensajeErrorOllama };
