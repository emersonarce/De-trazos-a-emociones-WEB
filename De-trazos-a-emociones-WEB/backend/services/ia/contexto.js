// Contexto del niño que acompaña al dibujo en el prompt.

// Calcula la edad en años a partir de una fecha de nacimiento (YYYY-MM-DD).
// Devuelve null si no hay fecha válida. La fecha sola se lee como fecha local:
// new Date("2018-03-15") la toma en UTC y en Colombia cae en el día anterior.
function edadDesdeFecha(fechaNacimiento, hoy = new Date()) {
    if (!fechaNacimiento) return null;
    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fechaNacimiento));
    const nac = ymd ? new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])) : new Date(fechaNacimiento);
    if (isNaN(nac.getTime())) return null;
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad >= 0 ? edad : null;
}

// Construye el bloque de contexto del niño para el prompt, a partir de un objeto.
// Sin datos devuelve "" (modo "solo dibujo").
function construirContextoFinal(ctx = {}) {
    const {
        nombre, edad, fecha_nacimiento, genero,
        situacion_actual, comportamiento, diagnostico_previo,
        dibujo_espontaneo, comento_mientras, tiempo_dibujo,
        descripcion_dibujo
    } = ctx;

    const edadCalculada = edadDesdeFecha(fecha_nacimiento) ?? (edad ? parseInt(edad, 10) : null);

    let contextoNino = "";
    if (nombre || edadCalculada != null || genero) {
        contextoNino += "## Información del niño\n";
        if (nombre) contextoNino += `- Nombre: ${nombre}\n`;
        if (edadCalculada != null) contextoNino += `- Edad: ${edadCalculada} años\n`;
        if (genero) contextoNino += `- Género: ${genero}\n`;
        contextoNino += "\n";
    }
    if (situacion_actual || comportamiento || diagnostico_previo) {
        contextoNino += "## Situación actual\n";
        if (situacion_actual) contextoNino += `- Situación en casa/entorno: ${situacion_actual}\n`;
        if (comportamiento) contextoNino += `- Comportamiento reciente: ${comportamiento}\n`;
        if (diagnostico_previo) contextoNino += `- Diagnóstico previo: ${diagnostico_previo}\n`;
        contextoNino += "\n";
    }
    if (dibujo_espontaneo || comento_mientras || tiempo_dibujo || descripcion_dibujo) {
        contextoNino += "## Contexto del dibujo\n";
        if (descripcion_dibujo) contextoNino += `- Descripción aportada por el adulto: ${descripcion_dibujo}\n`;
        if (dibujo_espontaneo) contextoNino += `- ¿Fue espontáneo?: ${dibujo_espontaneo}\n`;
        if (comento_mientras) contextoNino += `- Comentó mientras dibujaba: ${comento_mientras}\n`;
        if (tiempo_dibujo) contextoNino += `- Tiempo que tardó: ${tiempo_dibujo}\n`;
        contextoNino += "\n";
    }

    return contextoNino.trim()
        ? `Ten en cuenta el siguiente contexto del niño para enriquecer tu análisis:\n\n${contextoNino}\n`
        : "";
}

// Campos del contexto que se pueden ajustar al reanalizar. El nombre no:
// identifica al niño en el historial.
const CAMPOS_EDITABLES = [
    "edad", "fecha_nacimiento", "genero",
    "situacion_actual", "comportamiento", "diagnostico_previo",
    "dibujo_espontaneo", "comento_mientras", "tiempo_dibujo", "descripcion_dibujo"
];
const LARGO_MAXIMO = 1000;

// Contexto editado que llega del frontend, limpio: solo campos permitidos, como
// texto, sin espacios sobrantes y con un largo máximo. null si no vino ninguno.
function sanitizarContexto(entrada) {
    if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) return null;
    const limpio = {};
    for (const campo of CAMPOS_EDITABLES) {
        if (entrada[campo] === undefined || entrada[campo] === null) continue;
        limpio[campo] = String(entrada[campo]).trim().slice(0, LARGO_MAXIMO);
    }
    return limpio;
}

module.exports = { edadDesdeFecha, construirContextoFinal, sanitizarContexto, CAMPOS_EDITABLES };
