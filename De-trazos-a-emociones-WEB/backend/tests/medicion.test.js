const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { Jimp } = require("jimp");
const { medirPixeles, medirImagen, nombreColor } = require("../services/medicionImagen");
const { motorImagen } = require("../utils/imagen");

// Imagen RGB en memoria: hoja blanca y una función que pinta píxeles.
function imagen(ancho, alto, pintar = () => null) {
    const data = Buffer.alloc(ancho * alto * 3, 255);
    for (let y = 0; y < alto; y += 1) {
        for (let x = 0; x < ancho; x += 1) {
            const color = pintar(x, y);
            if (color) data.set(color, (y * ancho + x) * 3);
        }
    }
    return { data, width: ancho, height: alto, canales: 3 };
}

test("nombreColor reconoce los colores básicos", () => {
    assert.equal(nombreColor(0, 0.9, 0.9), "rojo");
    assert.equal(nombreColor(30, 0.9, 0.95), "naranja");
    assert.equal(nombreColor(55, 0.9, 0.95), "amarillo");
    assert.equal(nombreColor(120, 0.8, 0.7), "verde");
    assert.equal(nombreColor(210, 0.8, 0.8), "azul");
    assert.equal(nombreColor(275, 0.6, 0.7), "morado");
    assert.equal(nombreColor(320, 0.5, 0.9), "rosado");
    assert.equal(nombreColor(30, 0.7, 0.4), "marrón");
    assert.equal(nombreColor(0, 0.05, 0.55), "gris");
    assert.equal(nombreColor(0, 0, 0.1), "negro");
});

test("un cuadrado rojo relleno: color, uso de la hoja y tipo de trazo", () => {
    const m = medirPixeles(imagen(100, 100, (x, y) => (x >= 20 && x < 50 && y >= 20 && y < 50 ? [220, 30, 30] : null)));
    assert.equal(m.colores[0].nombre, "rojo");
    assert.ok(Math.abs(m.uso_hoja - 9) < 1, `uso_hoja ${m.uso_hoja}`);
    assert.equal(m.trazo, "relleno");
    assert.equal(m.tonos.calidos, 100);
    assert.equal(m.tonos_oscuros, 0);
    assert.ok(m.intensidad_color > 80);
});

test("líneas finas oscuras se reconocen como trazo de línea", () => {
    const m = medirPixeles(imagen(120, 120, (x, y) => (x % 15 === 0 || y % 15 === 0 ? [20, 20, 20] : null)));
    assert.equal(m.trazo, "linea");
    assert.equal(m.colores[0].nombre, "negro");
    assert.ok(m.tonos_oscuros > 90);
    assert.equal(m.tonos.neutros, 100);
});

test("la franja de mesa en el borde de la foto no se cuenta como dibujo", () => {
    const m = medirPixeles(imagen(200, 100, (x, y) => {
        if (x < 20) return [90, 55, 30]; // mesa
        if (x >= 100 && x < 120 && y >= 40 && y < 60) return [30, 60, 200]; // dibujo azul
        return null;
    }));
    assert.equal(m.borde_recortado, true);
    assert.ok(m.region.x >= 9 && m.region.x <= 11, `región ${JSON.stringify(m.region)}`);
    assert.equal(m.colores[0].nombre, "azul");
    assert.ok(!m.colores.some((c) => c.nombre === "marrón"));
});

test("un dibujo que ocupa más del 15 % del borde no se recorta de más", () => {
    const m = medirPixeles(imagen(100, 100, (x) => (x < 60 ? [40, 120, 220] : null)));
    assert.ok(m.region.x <= 15, `región ${JSON.stringify(m.region)}`);
    assert.equal(m.colores[0].nombre, "azul");
    assert.ok(m.uso_hoja > 40);
});

test("una hoja en blanco no falla", () => {
    const m = medirPixeles(imagen(50, 50));
    assert.equal(m.uso_hoja, 0);
    assert.deepEqual(m.colores, []);
    assert.equal(m.intensidad_color, 0);
});

test(`medirImagen (${motorImagen}) mide un archivo y devuelve null si no puede`, async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "medicion-"));
    const archivo = path.join(dir, "d.png");
    const img = new Jimp({ width: 200, height: 150, color: 0xffffffff });
    img.scan(60, 40, 80, 60, function (x, y, idx) {
        this.bitmap.data[idx] = 40; this.bitmap.data[idx + 1] = 160; this.bitmap.data[idx + 2] = 60;
    });
    fs.writeFileSync(archivo, await img.getBuffer("image/png"));
    const m = await medirImagen(archivo);
    assert.equal(m.colores[0].nombre, "verde");
    assert.ok(m.uso_hoja > 10 && m.uso_hoja < 20, `uso_hoja ${m.uso_hoja}`);
    assert.equal(await medirImagen(path.join(dir, "no-existe.png")), null);
    fs.rmSync(dir, { recursive: true });
});
