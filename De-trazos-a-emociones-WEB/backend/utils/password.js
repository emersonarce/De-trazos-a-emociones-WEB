// Política de contraseña segura. Devuelve un mensaje de error si no cumple,
// o null si es válida. Se usa en el registro y al cambiar la contraseña.
function validarPassword(pw) {
    if (!pw || pw.length < 8) {
        return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!/[A-Z]/.test(pw)) {
        return "La contraseña debe incluir al menos una letra mayúscula";
    }
    if (!/[a-z]/.test(pw)) {
        return "La contraseña debe incluir al menos una letra minúscula";
    }
    if (!/[0-9]/.test(pw)) {
        return "La contraseña debe incluir al menos un número";
    }
    if (!/[^A-Za-z0-9]/.test(pw)) {
        return "La contraseña debe incluir al menos un símbolo (por ejemplo: ! @ # $ %)";
    }
    return null;
}

// Contraseña temporal para cuando el administrador restablece una cuenta (las
// contraseñas se guardan cifradas y nadie puede verlas). Cumple la política de
// arriba y no usa caracteres que se confunden al dictarla o copiarla (0/O,
// 1/l/I).
const GRUPOS_TEMPORAL = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!@#$%&*?"];
function generarPasswordTemporal(largo = 10) {
    const crypto = require("crypto");
    const elegir = (s) => s[crypto.randomInt(s.length)];
    const todos = GRUPOS_TEMPORAL.join("");
    const caracteres = GRUPOS_TEMPORAL.map(elegir); // al menos uno de cada grupo
    while (caracteres.length < largo) caracteres.push(elegir(todos));
    for (let i = caracteres.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
    }
    return caracteres.join("");
}

module.exports = { validarPassword, generarPasswordTemporal };
