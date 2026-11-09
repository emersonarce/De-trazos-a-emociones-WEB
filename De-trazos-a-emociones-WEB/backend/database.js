
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        // MONGO_DB (opcional) cambia la base de datos de MONGO_URI; lo usa el modo
        // demo (npm run dev:demo) para trabajar con datos de prueba aparte.
        const base = process.env.MONGO_DB;
        const conn = await mongoose.connect(process.env.MONGO_URI, base ? { dbName: base } : {});

        console.log(`MongoDB Conectado: ${conn.connection.host}${base ? ` (base ${base})` : ""}`);
    } catch (error) {
        console.error(`Error de conexión a MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;