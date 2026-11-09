// Aplicación Express: middlewares, rutas, frontend compilado y manejo de
// errores. No se conecta a la base de datos ni escucha un puerto (eso lo hace
// server.js), así se puede probar sola (backend/tests).
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const perfilRoutes = require("./routes/perfil");
const analisisRoutes = require("./routes/analisis");

const app = express();

// CORS restringido al origen del frontend (configurable por .env).
// Por defecto se permite el Vite local; CORS_ORIGIN admite varios separados por coma.
const origenesPermitidos = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
app.use(cors({ origin: origenesPermitidos }));

app.use(express.static("public"));
// Las imágenes de los dibujos NO se sirven públicamente. Se entregan solo al
// dueño del análisis a través del endpoint protegido GET /analisis/:id/imagen.
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/perfil", perfilRoutes);

/* =========================
   SALUD (prueba rápida de que el backend responde)
   No va en "/": ahí se sirve el frontend compilado (ver más abajo).
========================= */

app.get("/salud", (req, res) => {
    res.send("Servidor con MiniCPM-V funcionando");
});

// /analizar-imagen y /analisis/*
app.use(analisisRoutes);

/* =========================
   FRONTEND COMPILADO (producción)
========================= */
// Si existe frontend/dist (resultado de "npm run build" en frontend/), este
// mismo servidor lo sirve. Así todo corre en un solo puerto y mismo origen
// (sin CORS). En desarrollo no existe dist y el frontend corre aparte con Vite.
const distDir = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    // Cualquier GET que no sea de la API devuelve index.html (React Router).
    app.use((req, res, next) => {
        if (req.method !== "GET") return next();
        res.sendFile(path.join(distDir, "index.html"));
    });
    console.log("Sirviendo frontend compilado desde", distDir);
}

/* =========================
   MANEJO DE ERRORES (p. ej. validaciones de Multer)
========================= */

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (!err) return next();
    const mensaje = err.code === "LIMIT_FILE_SIZE"
        ? "La imagen supera el tamaño máximo (8 MB)."
        : (err.message || "Error en la solicitud");
    res.status(400).json({ error: mensaje });
});

module.exports = app;
