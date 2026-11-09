// Nombre de la base de datos de prueba: la de MONGO_URI con «_demo» al final, o
// MONGO_DB_DEMO. Se niega a usar una base cuyo nombre no termine en _demo, para
// no tocar nunca los datos reales.
function nombreBaseDemo(env = process.env) {
    const real = (String(env.MONGO_URI || "").match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/) || [])[1] || "test";
    const nombre = env.MONGO_DB_DEMO || `${real}_demo`;
    if (!/_demo$/.test(nombre)) {
        throw new Error(`Por seguridad, la base de prueba debe terminar en «_demo» (se pidió «${nombre}»).`);
    }
    return nombre;
}

module.exports = { nombreBaseDemo };
