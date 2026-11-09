// Compara las variantes del análisis (services/ia/variantes.js) con los
// mismos dibujos, usando el Ollama real y la configuración de backend/.env.
//
// Uso (desde la carpeta del proyecto):
//   npm run comparar -- dibujo1.jpg dibujo2.png
//   npm run comparar -- dibujo1.jpg --variantes=estructurado,libre --descripcion="Su familia en la playa" --edad=7
//
// Deja un informe en comparaciones/ (Markdown para leer y JSON con todo).
// No guarda nada en la base de datos.
const path = require("path");
const fs = require("fs");
const os = require("os");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });
process.env.AI_MODE = "ollama"; // comparar el modelo real, aunque el .env diga mock

const { reducirAJpeg } = require("../utils/imagen");
const { obtenerAnalisisIA, construirContextoFinal } = require("../services/ia");
const { VARIANTES, resolverConfigIA } = require("../services/ia/variantes");

const formatoTiempo = (ms) => {
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`;
};

function leerArgumentos(argv) {
    const opciones = { imagenes: [], variantes: Object.keys(VARIANTES), descripcion: "", edad: "" };
    for (const arg of argv) {
        const [clave, ...resto] = arg.replace(/^--/, "").split("=");
        const valor = resto.join("=");
        if (arg.startsWith("--variantes=")) opciones.variantes = valor.split(",").map((v) => v.trim()).filter(Boolean);
        else if (arg.startsWith("--descripcion=")) opciones.descripcion = valor;
        else if (arg.startsWith("--edad=")) opciones.edad = valor;
        else if (!arg.startsWith("--")) opciones.imagenes.push(path.resolve(arg));
        else console.warn(`Opción desconocida: --${clave}`);
    }
    return opciones;
}

function seccionMarkdown(variante, r) {
    if (r.error) return `### ${variante}\n\n**Error:** ${r.error}\n`;
    const a = r.resultado;
    const rasgos = (a.rasgos_observados || []).map((x) => `- ${x}`).join("\n") || "_(sin rasgos)_";
    return [
        `### ${variante} — ${formatoTiempo(r.ms)}`,
        "",
        `**Emoción:** ${a.emocion_predominante} · **Intensidad:** ${a.intensidad}`,
        r.aviso ? `\n> ⚠️ ${r.aviso}\n` : "",
        "**Rasgos observados**",
        "",
        rasgos,
        "",
        "**Interpretación**",
        "",
        a.interpretacion || "_(vacía)_",
        "",
        "**Lectura orientativa**",
        "",
        a.lectura_orientativa || "_(vacía)_",
        ""
    ].join("\n");
}

async function main() {
    const op = leerArgumentos(process.argv.slice(2));
    const invalidas = op.variantes.filter((v) => !VARIANTES[v]);
    if (!op.imagenes.length || invalidas.length) {
        if (invalidas.length) console.error(`Variantes que no existen: ${invalidas.join(", ")}`);
        console.error("Uso: npm run comparar -- dibujo1.jpg [dibujo2.jpg ...] [--variantes=estructurado,equilibrado,libre] [--descripcion=\"...\"] [--edad=7]");
        process.exit(1);
    }
    const faltan = op.imagenes.filter((f) => !fs.existsSync(f));
    if (faltan.length) {
        console.error(`No se encontraron: ${faltan.join(", ")}`);
        process.exit(1);
    }

    const cfg = resolverConfigIA();
    const contexto = construirContextoFinal({ descripcion_dibujo: op.descripcion, edad: op.edad });
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "comparar-"));
    const informe = [];
    console.log(`Modelo ${cfg.modelo} · ${op.imagenes.length} dibujo(s) × ${op.variantes.length} variante(s). Cada análisis puede tardar varios minutos.\n`);

    for (const imagen of op.imagenes) {
        const destino = path.join(tmp, path.basename(imagen) + ".jpg");
        await reducirAJpeg(imagen, destino, { max: 800, calidad: 80 }); // igual que en la app
        const base64 = fs.readFileSync(destino, { encoding: "base64" });
        const resultados = {};
        for (const variante of op.variantes) {
            process.stdout.write(`${path.basename(imagen)} · ${variante}… `);
            const inicio = Date.now();
            try {
                const { resultado, aviso } = await obtenerAnalisisIA(base64, contexto, { variante });
                resultados[variante] = { ms: Date.now() - inicio, resultado, aviso };
                console.log(`${formatoTiempo(Date.now() - inicio)} · ${resultado.emocion_predominante} (${resultado.intensidad})${aviso ? " · respuesta incompleta" : ""}`);
            } catch (error) {
                resultados[variante] = { ms: Date.now() - inicio, error: error.message };
                console.log(`ERROR: ${error.message}`);
            }
        }
        informe.push({ imagen: path.basename(imagen), resultados });
    }
    fs.rmSync(tmp, { recursive: true, force: true });

    const carpeta = path.join(__dirname, "..", "..", "comparaciones");
    fs.mkdirSync(carpeta, { recursive: true });
    const d = new Date();
    const dos = (n) => String(n).padStart(2, "0");
    const sello = `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}-${dos(d.getHours())}${dos(d.getMinutes())}`;
    const md = [
        `# Comparación de variantes — ${new Date().toLocaleString("es-CO")}`,
        "",
        `Modelo: \`${cfg.modelo}\` · num_predict ${cfg.numPredict} · num_ctx ${cfg.numCtx}` + (contexto ? ` · contexto: ${[op.edad && `edad ${op.edad}`, op.descripcion && `"${op.descripcion}"`].filter(Boolean).join(", ")}` : " · sin contexto"),
        "",
        ...informe.flatMap(({ imagen, resultados }) => [
            `## ${imagen}`,
            "",
            ...Object.entries(resultados).map(([v, r]) => seccionMarkdown(v, r))
        ])
    ].join("\n");
    const archivoMd = path.join(carpeta, `comparacion-${sello}.md`);
    fs.writeFileSync(archivoMd, md);
    fs.writeFileSync(archivoMd.replace(/\.md$/, ".json"), JSON.stringify({ modelo: cfg.modelo, contexto, informe }, null, 2));
    console.log(`\nInforme: ${archivoMd}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
