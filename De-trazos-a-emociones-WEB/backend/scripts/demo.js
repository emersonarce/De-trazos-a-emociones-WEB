// Banco de datos de PRUEBA para ver la app con muchos datos. Solo para uso local.
// Crea un usuario demo con niños, dibujos generados por código y análisis
// inventados en una base de datos APARTE (la de MONGO_URI con «_demo» al final);
// la base real no se toca. Las imágenes van a backend/uploads con el prefijo demo-.
//   npm run demo:crear    borra el banco anterior y crea uno nuevo
//   npm run demo:borrar   borra la base demo y las imágenes demo-*
//   npm run dev:demo      arranca el backend con la base demo
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
// Igual que server.js: DNS_SERVERS fuerza DNS externos si la red no resuelve Atlas.
if (process.env.DNS_SERVERS) require("dns").setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()).filter(Boolean));
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const sharp = require("sharp");
const User = require("../models/User");
const Analysis = require("../models/Analysis");
const { medirImagen } = require("../services/medicionImagen");
const { validarPassword } = require("../utils/password");
const { nombreBaseDemo } = require("./demo/base");
const { USUARIO_DEMO, azar, generarBanco, resultadoIA } = require("./demo/datos");
const { dibujo, GRUPOS_DIBUJO } = require("./demo/dibujos");

const UPLOADS = path.join(__dirname, "..", "uploads");
const VERSIONES = 6; // dibujos distintos por emoción

async function conectar() {
    if (mongoose.connection.readyState === 1) return mongoose.connection.db.databaseName;
    if (!process.env.MONGO_URI) throw new Error("Falta MONGO_URI en backend/.env.");
    const base = nombreBaseDemo();
    await mongoose.connect(process.env.MONGO_URI, { dbName: base });
    // Segundo seguro: confirmar a qué base quedó conectado antes de borrar o escribir.
    if (mongoose.connection.db.databaseName !== base) throw new Error(`Se conectó a «${mongoose.connection.db.databaseName}» y no a «${base}».`);
    return base;
}

async function borrar() {
    const base = await conectar();
    await mongoose.connection.dropDatabase();
    const imagenes = fs.existsSync(UPLOADS) ? fs.readdirSync(UPLOADS).filter((f) => f.startsWith("demo-")) : [];
    for (const f of imagenes) fs.unlinkSync(path.join(UPLOADS, f));
    console.log(`Base «${base}» borrada y ${imagenes.length} imágenes demo eliminadas.`);
}

async function crear() {
    await borrar();
    fs.mkdirSync(UPLOADS, { recursive: true });
    const r = azar(7);

    // Varias versiones del dibujo de cada emoción, con su medición de color real.
    const dibujos = {};
    for (const grupo of GRUPOS_DIBUJO) {
        dibujos[grupo] = [];
        for (let v = 0; v < VERSIONES; v++) {
            const d = dibujo(grupo, r);
            const imagen = await sharp(Buffer.from(d.svg)).jpeg({ quality: 82 }).toBuffer();
            dibujos[grupo].push({ ...d, imagen, medicion: await medirImagen(imagen) });
        }
    }

    // La contraseña demo cumple la misma política que el registro.
    const errorPassword = validarPassword(USUARIO_DEMO.password);
    if (errorPassword) throw new Error(`Contraseña demo no válida: ${errorPassword}.`);
    const usuario = await User.create({ ...USUARIO_DEMO, password: await bcrypt.hash(USUARIO_DEMO.password, 12) });
    const banco = generarBanco(new Date());
    const docs = banco.map((item, i) => {
        const d = dibujos[item.grupo][Math.floor(r() * VERSIONES)];
        // Un archivo por análisis: al borrar un análisis la app borra su imagen.
        const archivo = `demo-${String(i + 1).padStart(4, "0")}.jpg`;
        fs.writeFileSync(path.join(UPLOADS, archivo), d.imagen);
        return {
            usuarioId: usuario._id,
            contexto_nino: { ...item.contexto, descripcion_dibujo: d.descripcion },
            ruta_imagen: `/uploads/${archivo}`,
            resultado_ia: resultadoIA(item, d, d.medicion, r),
            independiente: item.independiente,
            analizado_sin_contexto: item.independiente,
            fecha: item.fecha,
        };
    });
    await Analysis.insertMany(docs);

    const porNino = {};
    for (const item of banco) {
        const nombre = item.contexto.nombre || "(dibujos sueltos)";
        porNino[nombre] = (porNino[nombre] || 0) + 1;
    }
    console.log(`\nBanco de prueba creado en «${mongoose.connection.db.databaseName}»: ${docs.length} análisis.`);
    console.log(Object.entries(porNino).map(([n, c]) => `  ${n}: ${c}`).join("\n"));
    console.log(`\nPara verlo: npm run dev:demo (en lugar de npm run dev) y entra con ${USUARIO_DEMO.email} / ${USUARIO_DEMO.password}.`);
    console.log("Luna cumple años hoy y Tomi en 2 días. Alertas: Tomi (seguidos), Sofi (semana) y Mateo (mes).");
}

const acciones = { crear, borrar };
const accion = acciones[process.argv[2]];
if (!accion) {
    console.log("Uso: node backend/scripts/demo.js crear | borrar");
    process.exit(1);
}
accion()
    .then(() => mongoose.disconnect())
    .catch(async (e) => {
        console.error(`Error: ${e.message}`);
        await mongoose.disconnect();
        process.exit(1);
    });
