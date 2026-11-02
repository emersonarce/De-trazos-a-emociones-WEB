// Dibujos de prueba generados por código: NO son dibujos de niños reales.
// Escenas sencillas con trazos temblorosos, como de crayón, cuyos elementos y
// colores cambian con la emoción. dibujo(grupo, r) devuelve { svg, descripcion,
// rasgos } para guardar la imagen y armar el análisis inventado.
const ANCHO = 640;
const ALTO = 480;
const PAPEL = "#fdfbf6";

const C = {
    amarillo: "#f4c430", naranja: "#f08a24", rojo: "#e2463c", rosado: "#f07aa8", morado: "#7b4bc4",
    azul: "#3f7fd8", celeste: "#8ec5f0", verde: "#3e9b45", verdeClaro: "#8cd36a", cafe: "#8a5a33",
    gris: "#8a8f99", grisOscuro: "#555a63", negro: "#2b2b33", piel: "#f6d7b0", blanco: "#ffffff",
};

const entre = (r, a, b) => a + r() * (b - a);
const elegir = (r, lista) => lista[Math.floor(r() * lista.length)];
const n1 = (x) => Math.round(x * 10) / 10;

// Línea temblorosa que pasa cerca de los puntos (curvas por los puntos medios).
function camino(r, puntos, temblor = 2.5, cerrado = false) {
    const p = puntos.map(([x, y]) => [x + entre(r, -temblor, temblor), y + entre(r, -temblor, temblor)]);
    if (cerrado) p.push(p[0]);
    let d = `M${n1(p[0][0])} ${n1(p[0][1])}`;
    for (let i = 1; i < p.length - 1; i++) {
        d += ` Q${n1(p[i][0])} ${n1(p[i][1])} ${n1((p[i][0] + p[i + 1][0]) / 2)} ${n1((p[i][1] + p[i + 1][1]) / 2)}`;
    }
    const u = p[p.length - 1];
    return `${d} L${n1(u[0])} ${n1(u[1])}`;
}

// Polígono de lados rectos pero temblorosos (cada lado en 3 tramos), para casas y ventanas.
function poligono(r, puntos, temblor = 2) {
    const p = [];
    puntos.forEach(([x0, y0], i) => {
        const [x1, y1] = puntos[(i + 1) % puntos.length];
        for (const k of [0, 1 / 3, 2 / 3]) p.push([x0 + (x1 - x0) * k + entre(r, -temblor, temblor), y0 + (y1 - y0) * k + entre(r, -temblor, temblor)]);
    });
    return `M${p.map(([x, y]) => `${n1(x)} ${n1(y)}`).join(" L")} Z`;
}

const trazo = (d, color, ancho = 5, relleno = "none", opacidad = 1) =>
    `<path d="${d}" fill="${relleno}" fill-opacity="${opacidad}" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round" stroke-linejoin="round"/>`;

function ovalo(r, cx, cy, rx, ry, temblor = 2, pasos = 14) {
    const pts = Array.from({ length: pasos }, (_, i) => {
        const a = (i / pasos) * 2 * Math.PI;
        return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    });
    return camino(r, pts, temblor, true);
}

// --- Elementos -------------------------------------------------------------
function sol(r, cx, cy, rad) {
    let s = trazo(ovalo(r, cx, cy, rad, rad), C.naranja, 5, C.amarillo, 0.95);
    for (let i = 0; i < 10; i++) {
        const a = (i / 10) * 2 * Math.PI + entre(r, -0.1, 0.1);
        const p = (k) => [cx + Math.cos(a) * (rad + k), cy + Math.sin(a) * (rad + k)];
        s += trazo(camino(r, [p(10), p(32)], 1.5), C.amarillo, 5);
    }
    return s;
}

function luna(r, cx, cy, rad) {
    return trazo(ovalo(r, cx, cy, rad, rad), C.amarillo, 4, C.amarillo, 0.9)
        + trazo(ovalo(r, cx + rad * 0.45, cy - rad * 0.2, rad * 0.85, rad * 0.85, 1), PAPEL, 2, PAPEL, 1);
}

function casa(r, x, y, w, h, pared, techo) {
    let s = trazo(poligono(r, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]), C.cafe, 5, pared, 0.85);
    s += trazo(poligono(r, [[x - 12, y], [x + w / 2, y - h * 0.7], [x + w + 12, y]]), techo, 5, techo, 0.9);
    s += trazo(poligono(r, [[x + w * 0.4, y + h], [x + w * 0.4, y + h * 0.55], [x + w * 0.62, y + h * 0.55], [x + w * 0.62, y + h]], 1), C.cafe, 4, C.cafe, 0.75);
    s += trazo(poligono(r, [[x + w * 0.1, y + h * 0.2], [x + w * 0.32, y + h * 0.2], [x + w * 0.32, y + h * 0.44], [x + w * 0.1, y + h * 0.44]], 1), C.azul, 4, C.celeste, 0.85);
    return s;
}

function arbol(r, x, y, h) {
    return trazo(poligono(r, [[x - 9, y], [x - 7, y - h * 0.45], [x + 7, y - h * 0.45], [x + 9, y]], 1.5), C.cafe, 4, C.cafe, 0.9)
        + trazo(ovalo(r, x, y - h * 0.7, h * 0.34, h * 0.3, 6, 12), C.verde, 5, C.verdeClaro, 0.85);
}

// Figura humana de palitos. cara: feliz, triste, enojo, miedo, asombro o neutra.
function persona(r, x, y, alto, color, cara) {
    const rc = alto * 0.16;
    const cy = y - alto + rc;
    const ojo = rc * 0.38;
    let s = trazo(ovalo(r, x, cy, rc, rc, 1.2, 10), C.negro, 4, C.piel, 0.95);
    const rojoOjo = cara === "miedo" || cara === "asombro" ? 4.2 : 2.8;
    s += `<circle cx="${n1(x - ojo)}" cy="${n1(cy - rc * 0.15)}" r="${rojoOjo}" fill="${C.negro}"/>`;
    s += `<circle cx="${n1(x + ojo)}" cy="${n1(cy - rc * 0.15)}" r="${rojoOjo}" fill="${C.negro}"/>`;
    const by = cy + rc * 0.42;
    const bocas = {
        feliz: [[x - ojo, by - 3], [x, by + 6], [x + ojo, by - 3]],
        triste: [[x - ojo, by + 5], [x, by - 3], [x + ojo, by + 5]],
        enojo: [[x - ojo, by + 3], [x, by], [x + ojo, by + 3]],
        neutra: [[x - ojo, by + 1], [x + ojo, by + 1]],
    };
    if (cara === "miedo" || cara === "asombro") s += trazo(ovalo(r, x, by + 2, ojo * 0.6, ojo * 0.75, 0.6, 8), C.negro, 3, C.negro, 0.85);
    else s += trazo(camino(r, bocas[cara] || bocas.neutra, 0.6), C.negro, 3);
    if (cara === "enojo") {
        s += trazo(camino(r, [[x - ojo - 6, cy - rc * 0.55], [x - 3, cy - rc * 0.3]], 0.5), C.negro, 3);
        s += trazo(camino(r, [[x + ojo + 6, cy - rc * 0.55], [x + 3, cy - rc * 0.3]], 0.5), C.negro, 3);
    }
    const cuello = cy + rc;
    const cadera = y - alto * 0.38;
    const arriba = cara === "asombro" || (cara === "feliz" && r() < 0.35);
    s += trazo(camino(r, [[x, cuello], [x, cadera]], 1.5), color, 7);
    for (const lado of [-1, 1]) {
        s += trazo(camino(r, [[x, cuello + alto * 0.1], [x + lado * alto * 0.28, arriba ? cuello - alto * 0.12 : cuello + alto * 0.26]], 2), color, 6);
        s += trazo(camino(r, [[x, cadera], [x + lado * alto * 0.17, y]], 2), C.azul, 6);
    }
    return s;
}

function nube(r, cx, cy, w, color) {
    let s = "";
    for (const [dx, dy, k] of [[-w * 0.3, 5, 0.36], [0, -10, 0.46], [w * 0.3, 5, 0.36]]) {
        s += trazo(ovalo(r, cx + dx, cy + dy, w * k, w * k * 0.62), color, 4, color, 0.8);
    }
    return s;
}

function lluvia(r, x0, x1, y0, y1, color) {
    let s = "";
    for (let i = 0; i < 26; i++) {
        const x = entre(r, x0, x1);
        const y = entre(r, y0, y1);
        s += trazo(camino(r, [[x, y], [x - 5, y + 20]], 0.8), color, 4);
    }
    return s;
}

function corazon(r, cx, cy, t, color) {
    const pts = Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * 2 * Math.PI;
        return [cx + t * 16 * Math.sin(a) ** 3, cy - t * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))];
    });
    return trazo(camino(r, pts, 1.5, true), color, 4, color, 0.85);
}

function estrella(r, cx, cy, rad, color) {
    const pts = Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const k = i % 2 ? rad * 0.45 : rad;
        return [cx + k * Math.cos(a), cy + k * Math.sin(a)];
    });
    return trazo(camino(r, pts, 1.2, true), C.naranja, 3, color, 0.95);
}

function arcoiris(r, cx, cy, rad) {
    return [C.rojo, C.naranja, C.amarillo, C.verde, C.azul].map((color, i) => {
        const rr = rad - i * 15;
        const pts = Array.from({ length: 9 }, (_, k) => {
            const a = Math.PI + (k / 8) * Math.PI;
            return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
        });
        return trazo(camino(r, pts, 2), color, 13);
    }).join("");
}

// Garabatos en zigzag dentro de una caja (rabia, nervios, miedo).
function garabato(r, x, y, w, h, color, vueltas = 12, ancho = 4) {
    const pts = Array.from({ length: vueltas }, () => [entre(r, x, x + w), entre(r, y, y + h)]);
    return trazo(camino(r, pts, 3), color, ancho);
}

function espiral(r, cx, cy, rad, color) {
    const pts = Array.from({ length: 22 }, (_, i) => {
        const a = i * 0.75;
        const k = (rad * i) / 22;
        return [cx + k * Math.cos(a), cy + k * Math.sin(a)];
    });
    return trazo(camino(r, pts, 1), color, 4);
}

function monstruo(r, cx, cy, rad) {
    let s = trazo(ovalo(r, cx, cy, rad, rad * 1.15, 14, 16), C.negro, 5, C.morado, 0.85);
    for (const lado of [-1, 1]) {
        s += `<circle cx="${n1(cx + lado * rad * 0.35)}" cy="${n1(cy - rad * 0.25)}" r="${n1(rad * 0.16)}" fill="${C.blanco}"/>`;
        s += `<circle cx="${n1(cx + lado * rad * 0.35)}" cy="${n1(cy - rad * 0.22)}" r="${n1(rad * 0.07)}" fill="${C.negro}"/>`;
    }
    const dientes = Array.from({ length: 7 }, (_, i) => [cx - rad * 0.45 + (i * rad * 0.9) / 6, cy + rad * 0.35 + (i % 2 ? 12 : 0)]);
    return s + trazo(camino(r, dientes, 1), C.blanco, 4);
}

function pasto(r, y, color) {
    const pts = Array.from({ length: 9 }, (_, i) => [20 + (i * (ANCHO - 40)) / 8, y + entre(r, -8, 8)]);
    let s = trazo(camino(r, pts, 3), color, 7);
    for (let i = 0; i < 14; i++) {
        const x = entre(r, 30, ANCHO - 30);
        s += trazo(camino(r, [[x, y + 4], [x + entre(r, -6, 6), y - 18]], 1), color, 4);
    }
    return s;
}

function flor(r, x, y, color) {
    let s = trazo(camino(r, [[x, y], [x + 2, y - 46]], 1.5), C.verde, 4);
    for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 2 * Math.PI;
        s += trazo(ovalo(r, x + 2 + Math.cos(a) * 11, y - 52 + Math.sin(a) * 11, 8, 8, 1, 8), color, 3, color, 0.85);
    }
    return s + `<circle cx="${n1(x + 2)}" cy="${n1(y - 52)}" r="6" fill="${C.amarillo}"/>`;
}

// --- Escenas por emoción -----------------------------------------------------
// Cada una devuelve { partes, descripcion, rasgos }.
const ESCENAS = {
    alegria(r) {
        const pared = elegir(r, [C.rojo, C.azul, C.naranja]);
        const personas = r() < 0.5 ? 1 : 2;
        const conFlores = r() < 0.6;
        const partes = [sol(r, entre(r, 470, 560), entre(r, 70, 110), entre(r, 38, 55)), pasto(r, 410, C.verde),
            casa(r, entre(r, 70, 170), 250, 150, 130, pared, C.rojo)];
        for (let i = 0; i < personas; i++) partes.push(persona(r, 360 + i * 85, 405, entre(r, 125, 150), elegir(r, [C.azul, C.rojo, C.morado]), "feliz"));
        if (conFlores) for (let i = 0; i < 3; i++) partes.push(flor(r, 300 + i * 110 + entre(r, -20, 20), 440, elegir(r, [C.rosado, C.rojo, C.morado])));
        return {
            partes,
            descripcion: `Una casa, un sol grande y ${personas === 1 ? "una persona sonriente" : "dos personas sonrientes"} sobre el pasto${conFlores ? ", con flores" : ""}.`,
            rasgos: ["Aparece un sol grande en la parte de arriba, a la derecha.", "Dibujó una casa con puerta y ventana.",
                `${personas === 1 ? "Hay una figura humana" : "Hay dos figuras humanas"} con una sonrisa amplia.`, "Usó colores vivos: amarillo, rojo y verde."],
        };
    },
    calma(r) {
        const partes = [];
        for (let i = 0; i < 3; i++) partes.push(trazo(camino(r, [[30, 60 + i * 26], [320, 50 + i * 26], [610, 64 + i * 26]], 4), C.celeste, 10));
        partes.push(trazo(camino(r, [[10, 400], [180, 300], [360, 380], [520, 310], [630, 380], [630, 470], [10, 470]], 5, true), C.verde, 5, C.verdeClaro, 0.75));
        partes.push(arbol(r, entre(r, 120, 220), 380, entre(r, 150, 190)));
        partes.push(persona(r, entre(r, 380, 470), 420, entre(r, 100, 120), C.verde, "feliz"));
        if (r() < 0.6) partes.push(nube(r, entre(r, 420, 520), 90, 90, "#e7edf3"));
        return {
            partes,
            descripcion: "Un paisaje con colinas verdes, un árbol y una persona tranquila bajo el cielo azul.",
            rasgos: ["El cielo está pintado con trazos suaves en azul claro.", "Hay colinas verdes y un árbol grande.",
                "La figura humana está de pie, con una sonrisa tranquila.", "Predominan los verdes y los azules claros."],
        };
    },
    carino(r) {
        const partes = [persona(r, 250, 420, 140, C.rosado, "feliz"), persona(r, 350, 420, 115, C.morado, "feliz"),
            trazo(camino(r, [[285, 335], [315, 345]], 1), C.piel, 6)];
        const corazones = 3 + Math.floor(r() * 4);
        for (let i = 0; i < corazones; i++) partes.push(corazon(r, entre(r, 60, 580), entre(r, 60, 220), entre(r, 1.6, 3), elegir(r, [C.rosado, C.rojo])));
        if (r() < 0.5) partes.push(sol(r, 560, 80, 36));
        return {
            partes,
            descripcion: `Dos personas tomadas de la mano y ${corazones} corazones alrededor.`,
            rasgos: ["Dibujó dos figuras humanas tomadas de la mano.", `Hay ${corazones} corazones en la parte de arriba.`,
                "Las dos figuras sonríen.", "Predominan los rosados y los rojos."],
        };
    },
    asombro(r) {
        const partes = [arcoiris(r, 320, 300, entre(r, 200, 240))];
        const estrellas = 4 + Math.floor(r() * 4);
        for (let i = 0; i < estrellas; i++) partes.push(estrella(r, entre(r, 50, 590), entre(r, 40, 140), entre(r, 12, 22), C.amarillo));
        partes.push(persona(r, entre(r, 280, 360), 440, 130, C.naranja, "asombro"));
        return {
            partes,
            descripcion: `Un arcoíris grande con ${estrellas} estrellas y una persona con los brazos arriba.`,
            rasgos: ["Un arcoíris ocupa buena parte de la hoja.", `Hay ${estrellas} estrellas amarillas en el cielo.`,
                "La figura humana tiene los brazos arriba y la boca abierta.", "Usó muchos colores distintos."],
        };
    },
    tristeza(r) {
        const x = entre(r, 220, 420);
        const partes = [nube(r, x, 110, entre(r, 150, 200), C.gris), lluvia(r, x - 110, x + 110, 160, 330, C.azul),
            persona(r, x + entre(r, -40, 40), 430, entre(r, 85, 105), C.azul, "triste")];
        if (r() < 0.5) partes.push(trazo(camino(r, [[40, 440], [600, 446]], 3), C.grisOscuro, 5));
        return {
            partes,
            descripcion: "Una nube gris con lluvia y una persona pequeña sola debajo.",
            rasgos: ["Hay una nube gris grande con lluvia.", "La figura humana es pequeña y está sola.",
                "La boca de la figura está hacia abajo.", "Predominan los azules y los grises; no hay sol."],
        };
    },
    miedo(r) {
        const partes = [luna(r, 90, 80, 34)];
        for (let i = 0; i < 4; i++) partes.push(garabato(r, 20, 20 + i * 40, 600, 160, C.negro, 10, 3));
        partes.push(monstruo(r, entre(r, 380, 470), 260, entre(r, 85, 110)));
        partes.push(persona(r, entre(r, 120, 200), 440, 95, C.gris, "miedo"));
        return {
            partes,
            descripcion: "De noche, una figura oscura y grande frente a una persona pequeña.",
            rasgos: ["El fondo tiene muchos trazos oscuros, como de noche.", "Hay una figura grande y oscura con dientes.",
                "La persona es pequeña, con los ojos y la boca muy abiertos.", "Predominan el negro y el morado."],
        };
    },
    enojo(r) {
        const partes = [];
        for (let i = 0; i < 5; i++) partes.push(garabato(r, entre(r, 20, 380), entre(r, 20, 260), 240, 180, elegir(r, [C.rojo, C.negro]), 14, entre(r, 5, 9)));
        partes.push(persona(r, entre(r, 240, 400), 440, 140, C.rojo, "enojo"));
        return {
            partes,
            descripcion: "Muchos rayones rojos y negros alrededor de una persona con cara de enojo.",
            rasgos: ["Hay rayones fuertes y rápidos en rojo y negro.", "Los trazos son gruesos, con mucha presión aparente.",
                "La figura humana tiene el ceño fruncido.", "Predominan el rojo y el negro."],
        };
    },
    ansiedad(r) {
        const partes = [casa(r, entre(r, 60, 140), 270, 130, 120, C.naranja, C.cafe)];
        for (let i = 0; i < 9; i++) partes.push(garabato(r, entre(r, 20, 540), entre(r, 20, 380), 80, 70, elegir(r, [C.naranja, C.cafe]), 8, 3));
        for (let i = 0; i < 3; i++) partes.push(espiral(r, entre(r, 300, 580), entre(r, 60, 200), entre(r, 20, 34), C.cafe));
        partes.push(persona(r, entre(r, 330, 470), 440, 100, C.naranja, "neutra"));
        return {
            partes,
            descripcion: "Una casa pequeña rodeada de garabatos y espirales, con una persona a un lado.",
            rasgos: ["Hay muchos garabatos pequeños repartidos por la hoja.", "Aparecen espirales en la parte de arriba.",
                "La figura humana es pequeña y sin sonrisa.", "Predominan el naranja y el café."],
        };
    },
    neutra(r) {
        return {
            partes: [casa(r, entre(r, 120, 220), 260, 140, 120, PAPEL, C.gris).replaceAll(C.cafe, C.gris).replaceAll(C.azul, C.gris).replaceAll(C.celeste, PAPEL),
                persona(r, entre(r, 400, 480), 420, 110, C.gris, "neutra").replaceAll(C.azul, C.gris).replaceAll(C.piel, PAPEL)],
            descripcion: "Una casa y una persona dibujadas solo con lápiz, sin color.",
            rasgos: ["El dibujo está hecho solo con lápiz gris.", "Hay una casa sencilla y una figura humana.",
                "La figura tiene la boca recta.", "Casi no usó color."],
        };
    },
};

function dibujo(grupo, r) {
    const escena = (ESCENAS[grupo] || ESCENAS.neutra)(r);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}">`
        + `<rect width="${ANCHO}" height="${ALTO}" fill="${PAPEL}"/>${escena.partes.join("")}</svg>`;
    return { svg, descripcion: escena.descripcion, rasgos: escena.rasgos };
}

module.exports = { dibujo, GRUPOS_DIBUJO: Object.keys(ESCENAS) };
