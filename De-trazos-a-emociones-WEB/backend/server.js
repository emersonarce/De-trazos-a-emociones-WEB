// Punto de entrada: carga la configuración, conecta a MongoDB y levanta la app.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Por defecto se usa el DNS del sistema (lo más compatible, incluidos datos
// móviles). Si una red no resuelve el registro SRV de Atlas (error
// "queryTxt ETIMEOUT"), se pueden forzar DNS externos definiendo DNS_SERVERS
// en el .env, por ejemplo: DNS_SERVERS=8.8.8.8,1.1.1.1
if (process.env.DNS_SERVERS) {
    const dns = require("dns");
    dns.setServers(
        process.env.DNS_SERVERS.split(",").map((s) => s.trim()).filter(Boolean)
    );
}

const connectDB = require("./database");
const app = require("./app");
const { motorImagen } = require("./utils/imagen");
const { resolverConfigIA, modoIA } = require("./services/ia/variantes");

// Conectar a MongoDB
connectDB();

app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor iniciado en puerto", process.env.PORT || 3000);
    console.log("Procesamiento de imágenes con", motorImagen);
    const ia = resolverConfigIA();
    console.log(modoIA() === "mock"
        ? "Análisis con IA: SIMULADO (AI_MODE=mock)"
        : `Análisis con IA: ${ia.modelo} (variante ${ia.variante})`);
});
