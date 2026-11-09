// Esquema de la respuesta del modelo. Ollama lo usa (parámetro "format") para
// forzar un JSON válido con estos campos. Requiere Ollama 0.5.0 o superior.
const ESQUEMA_ANALISIS = {
    type: "object",
    properties: {
        rasgos_observados: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 10 },
        interpretacion: { type: "string" },
        emocion_predominante: { type: "string" },
        intensidad: { type: "string", enum: ["baja", "media", "alta"] },
        lectura_orientativa: { type: "string" }
    },
    required: [
        "rasgos_observados",
        "interpretacion",
        "emocion_predominante",
        "intensidad",
        "lectura_orientativa"
    ]
};

module.exports = { ESQUEMA_ANALISIS };
