// Procesamiento de imágenes (dibujos y foto de perfil).
//
// Usa sharp, que es nativo y rápido. Si sharp no carga, usa Jimp, que es
// JavaScript puro y funciona en cualquier CPU. Pasa, por ejemplo, en una VM con
// CPU "Common KVM processor": los binarios de sharp exigen x86-64-v2 (SSE4.2).
// IMAGEN_MOTOR=jimp en el .env fuerza Jimp (útil para probar la alternativa).
const fs = require("fs");

let sharp = null;
if ((process.env.IMAGEN_MOTOR || "").toLowerCase() !== "jimp") {
    try {
        sharp = require("sharp");
    } catch (error) {
        console.warn("sharp no está disponible en este equipo; se usará Jimp para las imágenes.");
        console.warn("  Motivo:", String(error.message).split("\n")[0]);
    }
}

const motorImagen = sharp ? "sharp" : "jimp";

// Jimp se carga solo si hace falta. WEBP se lee con @jsquash/webp (módulo ESM,
// por eso va con import()). Su .wasm se entrega ya compilado desde el disco,
// porque por defecto lo busca con fetch() y en Node eso no lee archivos locales.
let jimpPromesa = null;
const cargarJimp = () => {
    if (!jimpPromesa) {
        jimpPromesa = (async () => {
            const { createJimp } = require("@jimp/core");
            const { defaultFormats, defaultPlugins } = require("jimp");
            const { default: decodificarWebp, init: iniciarWebp } = await import("@jsquash/webp/decode.js");
            const wasm = require.resolve("@jsquash/webp/codec/dec/webp_dec.wasm");
            await iniciarWebp(await WebAssembly.compile(fs.readFileSync(wasm)));
            const webp = () => ({
                mime: "image/webp",
                hasAlpha: true,
                encode: async () => {
                    throw new Error("Escribir WEBP no está soportado (las imágenes se guardan en JPEG).");
                },
                decode: async (datos) => {
                    const r = await decodificarWebp(new Uint8Array(datos).buffer);
                    return { data: Buffer.from(r.data.buffer, r.data.byteOffset, r.data.byteLength), width: r.width, height: r.height };
                },
            });
            return createJimp({ formats: [...defaultFormats, webp], plugins: defaultPlugins });
        })();
    }
    return jimpPromesa;
};

// Reduce la imagen a máximo `max` px por lado (sin agrandarla) y la guarda en JPEG.
// `entrada` puede ser una ruta o un Buffer.
async function reducirAJpeg(entrada, destino, { max = 800, calidad = 80 } = {}) {
    if (sharp) {
        await sharp(entrada)
            .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: calidad })
            .toFile(destino);
        return;
    }
    const Jimp = await cargarJimp();
    const imagen = await Jimp.read(entrada);
    if (imagen.bitmap.width > max || imagen.bitmap.height > max) {
        imagen.scaleToFit({ w: max, h: max });
    }
    await fs.promises.writeFile(destino, await imagen.getBuffer("image/jpeg", { quality: calidad }));
}

// Recorta al centro un cuadrado de `lado` x `lado` px y lo guarda en JPEG.
async function recortarCuadradoAJpeg(entrada, destino, { lado = 256, calidad = 82 } = {}) {
    if (sharp) {
        await sharp(entrada)
            .resize(lado, lado, { fit: "cover" })
            .jpeg({ quality: calidad })
            .toFile(destino);
        return;
    }
    const Jimp = await cargarJimp();
    const imagen = await Jimp.read(entrada);
    imagen.cover({ w: lado, h: lado });
    await fs.promises.writeFile(destino, await imagen.getBuffer("image/jpeg", { quality: calidad }));
}

// Píxeles RGB de la imagen reducida a `max` px por lado, para medirla
// (services/medicionImagen.js). Devuelve { data, width, height, canales }.
async function leerPixeles(entrada, { max = 320 } = {}) {
    if (sharp) {
        const { data, info } = await sharp(entrada)
            .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
            .removeAlpha()
            .toColourspace("srgb")
            .raw()
            .toBuffer({ resolveWithObject: true });
        return { data, width: info.width, height: info.height, canales: info.channels };
    }
    const Jimp = await cargarJimp();
    const imagen = await Jimp.read(entrada);
    if (imagen.bitmap.width > max || imagen.bitmap.height > max) {
        imagen.scaleToFit({ w: max, h: max });
    }
    return { data: imagen.bitmap.data, width: imagen.bitmap.width, height: imagen.bitmap.height, canales: 4 };
}

module.exports = { reducirAJpeg, recortarCuadradoAJpeg, leerPixeles, motorImagen };
