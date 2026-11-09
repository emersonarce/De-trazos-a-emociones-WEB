const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { Jimp } = require("jimp");
const { reducirAJpeg, recortarCuadradoAJpeg, motorImagen } = require("../utils/imagen");

// Las imágenes de prueba se crean con Jimp para que la prueba funcione también
// donde sharp no carga (como el servidor de la universidad).
const crear = async (ancho, alto, mime) => new Jimp({ width: ancho, height: alto, color: 0xff8800ff }).getBuffer(mime);
const medir = async (archivo) => {
    const img = await Jimp.read(archivo);
    return [img.bitmap.width, img.bitmap.height, img.mime];
};

test(`reducirAJpeg (${motorImagen}) achica a 800 px sin agrandar las pequeñas`, async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "imagen-"));
    await reducirAJpeg(await crear(1600, 1200, "image/png"), path.join(dir, "g.jpg"));
    assert.deepEqual(await medir(path.join(dir, "g.jpg")), [800, 600, "image/jpeg"]);
    await reducirAJpeg(await crear(500, 300, "image/jpeg"), path.join(dir, "p.jpg"));
    assert.deepEqual(await medir(path.join(dir, "p.jpg")), [500, 300, "image/jpeg"]);
    fs.rmSync(dir, { recursive: true });
});

test(`recortarCuadradoAJpeg (${motorImagen}) deja la foto de perfil en 256x256`, async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "imagen-"));
    await recortarCuadradoAJpeg(await crear(900, 400, "image/png"), path.join(dir, "f.jpg"));
    assert.deepEqual(await medir(path.join(dir, "f.jpg")), [256, 256, "image/jpeg"]);
    fs.rmSync(dir, { recursive: true });
});
