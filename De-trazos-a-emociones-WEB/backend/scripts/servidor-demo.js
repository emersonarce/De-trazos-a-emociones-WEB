// Arranca el backend con la base de datos de prueba (ver demo.js). Solo local.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { nombreBaseDemo } = require("./demo/base");

process.env.MONGO_DB = nombreBaseDemo();
console.log(`Modo demo: base de datos «${process.env.MONGO_DB}» (datos inventados).`);
require("../server");
