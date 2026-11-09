// Servicio de análisis de dibujos con IA. Las rutas solo llaman a
// obtenerAnalisisIA; el proveedor (Ollama o simulado), la variante del prompt
// y el parseo de la respuesta quedan aquí.
const { resolverConfigIA, modoIA } = require("./variantes");
const { analizarConOllama } = require("./proveedores/ollama");
const { analizarSimulado } = require("./proveedores/mock");
const { parsearRespuestaIA, parsearTextoLibre, limpiarResultadoIA } = require("./parseo");
const { construirContextoFinal } = require("./contexto");

const AVISO_JSON_INCOMPLETO = "El modelo no devolvió un JSON completo. Se muestra el texto recuperado; puedes intentar analizar de nuevo.";
const AVISO_TEXTO_INCOMPLETO = "La respuesta del modelo llegó incompleta. Se muestra el texto recuperado; puedes intentar analizar de nuevo.";

const esObjeto = (v) => v && typeof v === "object" && !Array.isArray(v);

// Guarda cuánto tardó la IA dentro del resultado (resultado_ia es Mixed, así
// que no cambia el esquema). El frontend lo muestra como "Tiempo de análisis".
function conDuracion(resultado, inicio) {
    if (esObjeto(resultado)) resultado.duracion_ms = Date.now() - inicio;
    return resultado;
}

// Devuelve { resultado, aviso }. `opciones.variante` fuerza una variante
// (lo usa el script de comparación).
async function obtenerAnalisisIA(imagenBase64, contextoFinal, opciones = {}) {
    const inicio = Date.now();
    if (modoIA() === "mock") {
        return { resultado: conDuracion(await analizarSimulado(), inicio), aviso: undefined };
    }

    const cfg = resolverConfigIA(process.env, opciones.variante);
    const respuesta = await analizarConOllama(cfg, imagenBase64, contextoFinal);
    const libre = cfg.formato === "libre";
    const parseo = libre ? parsearTextoLibre(respuesta) : parsearRespuestaIA(respuesta);
    const resultado = limpiarResultadoIA(parseo.datos);
    if (esObjeto(resultado)) {
        // Trazabilidad para el estudio: con qué variante y modelo se hizo.
        resultado.variante_ia = cfg.variante;
        resultado.modelo_ia = cfg.modelo;
    }
    return {
        resultado: conDuracion(resultado, inicio),
        aviso: parseo.ok ? undefined : (libre ? AVISO_TEXTO_INCOMPLETO : AVISO_JSON_INCOMPLETO)
    };
}

module.exports = { obtenerAnalisisIA, construirContextoFinal, conDuracion };
