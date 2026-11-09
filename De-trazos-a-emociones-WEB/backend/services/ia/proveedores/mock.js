// Proveedor simulado (AI_MODE=mock): devuelve un resultado de ejemplo en ~2,5 s,
// sin Ollama, para probar el flujo de la app. NUNCA usarlo en la prueba piloto.

// Resultado de ejemplo para AI_MODE=mock. Respeta la estructura nueva y va
// marcado con simulado: true para que el frontend lo advierta claramente.
function generarAnalisisSimulado() {
    return {
        rasgos_observados: [
            "Uso predominante de colores cálidos (amarillo y naranja) en la zona central.",
            "Trazos firmes y continuos, con presión aparente media.",
            "Una figura humana grande y sonriente en el centro de la hoja.",
            "Un sol en la esquina superior izquierda y varias flores en la parte inferior.",
            "Amplio aprovechamiento del espacio de la hoja, sin zonas vacías marcadas."
        ],
        interpretacion: "El uso de colores cálidos y una figura central sonriente podría sugerir un estado de ánimo positivo en el momento del dibujo. La firmeza de los trazos podría relacionarse con seguridad al dibujar. Este es un texto de ejemplo: el resultado es SIMULADO y no proviene de un análisis real del dibujo ni del contexto ingresado.",
        emocion_predominante: "Alegría",
        intensidad: "media",
        lectura_orientativa: "El dibujo podría sugerir un momento emocional tranquilo y positivo. Como acompañamiento, podrías preguntarle al niño qué representó y escuchar su explicación sin corregir. Recuerda que esta lectura es orientativa y no reemplaza la valoración de un profesional. (Resultado simulado, modo de prueba.)",
        simulado: true
    };
}

async function analizarSimulado() {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return generarAnalisisSimulado();
}

module.exports = { analizarSimulado, generarAnalisisSimulado };
