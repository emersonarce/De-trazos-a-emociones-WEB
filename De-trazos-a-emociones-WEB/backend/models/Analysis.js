const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema({
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    contexto_nino: {
        nombre: String,
        edad: String,
        fecha_nacimiento: String,
        genero: String,
        situacion_actual: String,
        comportamiento: String,
        diagnostico_previo: String,
        dibujo_espontaneo: String,
        comento_mientras: String,
        tiempo_dibujo: String,
        // Descripción breve del dibujo que escribe el adulto (con o sin contexto).
        descripcion_dibujo: String
    },

    ruta_imagen: {
        type: String,
        required: true
    },

    resultado_ia: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },

    // true = dibujo analizado "suelto", no pertenece a ningún niño.
    independiente: {
        type: Boolean,
        default: false
    },

    // true = el análisis se generó sin el contexto del niño (modo solo dibujo).
    analizado_sin_contexto: {
        type: Boolean,
        default: false
    },

    fecha: {
        type: Date,
        default: Date.now
    }
});

// El historial de cada usuario, del más reciente al más antiguo (GET /analisis).
AnalysisSchema.index({ usuarioId: 1, fecha: -1 });

module.exports = mongoose.model("Analysis", AnalysisSchema);