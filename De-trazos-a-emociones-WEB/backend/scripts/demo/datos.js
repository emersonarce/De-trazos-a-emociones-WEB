// Banco de niños y análisis INVENTADOS para probar la app con muchos datos
// (solo local; ver scripts/demo.js). Todo es ficticio: alias, contextos, dibujos
// (generados por código) y lecturas. Cada perfil muestra algo de la app:
// cumpleaños hoy o en 2 días, las tres señales de alerta, varios dibujos el
// mismo día, historiales largos (gráfico con muchos puntos) y cortos.

const USUARIO_DEMO = {
    nombre: "Docente", apellido: "Demo", email: "demo@detrazos.test", password: "Demo2026!", // cumple utils/password.js
    rol: "profesor", institucion: "Colegio de prueba (datos inventados)", estado: "aprobado",
    permisos: { conContexto: true, descargarPdf: true },
};

// Números pseudoaleatorios con semilla (mulberry32): el mismo banco cada vez.
function azar(semilla) {
    let a = semilla >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const elegir = (r, lista) => lista[Math.floor(r() * lista.length)];

// Día para el que se arma el banco: «AAAA-MM-DD» (por ejemplo, el de una
// presentación) o, sin texto, hoy. A mediodía, así ningún cambio de hora mueve el día.
function fechaBanco(texto) {
    if (!texto) return new Date();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
    const fecha = m && new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
    if (!fecha || fecha.getMonth() !== Number(m[2]) - 1 || fecha.getDate() !== Number(m[3])) {
        throw new Error(`Fecha no válida: «${texto}». Usa AAAA-MM-DD, por ejemplo 2026-11-05.`);
    }
    return fecha;
}

// Nombres de emoción como los escribe el modelo, por grupo de la app.
const EMOCIONES = {
    alegria: ["Alegría", "Felicidad", "Entusiasmo"],
    calma: ["Calma", "Tranquilidad"],
    carino: ["Cariño", "Amor"],
    asombro: ["Asombro", "Curiosidad"],
    tristeza: ["Tristeza", "Soledad"],
    miedo: ["Miedo", "Inseguridad"],
    enojo: ["Enojo", "Frustración"],
    ansiedad: ["Ansiedad", "Preocupación", "Nerviosismo"],
    neutra: ["Aburrimiento"],
};
const AGRADABLES = ["alegria", "calma", "carino", "asombro"];
const DIFICILES = ["tristeza", "miedo", "enojo", "ansiedad"];

const COMENTARIOS = {
    alegria: ["Dijo que era el día del paseo al parque.", "Contó que su familia estaba celebrando.", ""],
    calma: ["Tarareó una canción mientras dibujaba.", ""],
    carino: ["Dijo que era un regalo para su mamá.", "Contó que dibujó a su abuela."],
    asombro: ["Contó que vio un arcoíris camino al colegio.", "Dijo que quiere ser astronauta."],
    tristeza: ["Dijo que el niño del dibujo estaba solo.", "Estuvo en silencio todo el tiempo."],
    miedo: ["Dijo que en la noche aparece un monstruo.", "Preguntó si podía dejar la luz prendida."],
    enojo: ["Rayó fuerte y dijo que estaba bravo con un compañero.", "Dijo que nadie lo deja jugar."],
    ansiedad: ["Preguntó varias veces si lo estaba haciendo bien.", "Dijo que mañana tiene una evaluación."],
    neutra: ["Dijo que no sabía qué dibujar.", ""],
};

const INTERPRETACION = {
    alegria: "Los colores vivos, el sol y las figuras sonrientes podrían reflejar un momento de bienestar y disfrute.",
    calma: "Los trazos suaves, los colores claros y la figura tranquila podrían sugerir un estado de calma.",
    carino: "Las figuras juntas y los corazones podrían expresar cariño y la importancia de sus vínculos cercanos.",
    asombro: "El arcoíris, las estrellas y la figura con los brazos arriba podrían mostrar curiosidad y ganas de descubrir.",
    tristeza: "La lluvia, los tonos fríos y la figura pequeña y sola podrían sugerir algo de tristeza o deseo de compañía.",
    miedo: "La figura oscura y grande frente a una persona pequeña podría expresar temor o sensación de inseguridad.",
    enojo: "Los rayones fuertes en rojo y negro y el ceño fruncido podrían reflejar enojo o frustración.",
    ansiedad: "Los garabatos y las espirales repartidos por la hoja podrían sugerir inquietud o preocupación.",
    neutra: "El dibujo en lápiz, sin color, no muestra señales marcadas de una emoción en particular.",
};

const LECTURA = {
    alegria: "Es un buen momento para reforzar lo que le hace sentir bien: pregúntale por su dibujo y celebra sus ideas.",
    calma: "Las rutinas y los momentos tranquilos que comparten parecen acompañarlo bien; vale la pena mantenerlos.",
    carino: "Reconocer y nombrar los vínculos que dibuja puede fortalecer su sensación de cercanía y seguridad.",
    asombro: "Su curiosidad es una buena puerta para conversar: pregúntale qué imaginó mientras dibujaba.",
    tristeza: "Puede ayudar acompañarlo con calma y ofrecerle espacios para hablar de lo que siente, sin presionarlo.",
    miedo: "Conviene darle seguridad: escuchar qué le preocupa y anticipar los cambios que vengan.",
    enojo: "Puede servir ayudarle a nombrar lo que lo molesta y buscar juntos formas de calmarse.",
    ansiedad: "Rutinas claras y momentos de calma, como respirar juntos o dibujar sin prisa, pueden ayudarle.",
    neutra: "No se observan señales marcadas; seguir registrando sus dibujos ayudará a ver cómo cambia su ánimo.",
};

const TIEMPOS = ["menos de 5 minutos", "5 a 15 minutos", "más de 15 minutos", "12 minutos", "25 minutos", "1 hora y 10 minutos"];

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function edadEn(fechaNacimiento, fecha) {
    const [a, m, d] = fechaNacimiento.split("-").map(Number);
    let edad = fecha.getFullYear() - a;
    if (fecha.getMonth() + 1 < m || (fecha.getMonth() + 1 === m && fecha.getDate() < d)) edad--;
    return edad;
}

// Perfiles. `animo(dias)`: probabilidad de un dibujo agradable según los días
// atrás. `fijos`: dibujos puestos a mano, [días atrás, hora, grupo, intensidad],
// para las alertas y para varios dibujos el mismo día. `libreDesde`: desde
// cuántos días atrás se generan dibujos al azar (más recientes, solo los fijos).
function perfiles(hoy) {
    const [y, m, d] = [hoy.getFullYear(), hoy.getMonth(), hoy.getDate()];
    return [
        {
            nombre: "Luna", genero: "femenino", fecha_nacimiento: ymd(new Date(y - 8, m, d)), // cumple años hoy
            situacion_actual: "Se cambió de colegio a comienzos de año; ya tiene amigas nuevas.", comportamiento: "normal", diagnostico_previo: "Ninguno conocido",
            meses: 24, porSemana: 1.2, variosMismoDia: 0.15,
            animo: (dias) => (dias > 270 && dias < 340 ? 0.3 : dias < 60 ? 0.92 : 0.75), // el cambio de colegio, hace unos 10 meses
            libreDesde: 10, fijos: [[1, 10, "carino"], [4, 15, "alegria"], [8, 11, "asombro"]],
        },
        {
            nombre: "Tomi", genero: "masculino", fecha_nacimiento: ymd(new Date(y - 7, m, d + 2)), // cumple en 2 días
            situacion_actual: "Sus papás se separaron hace dos meses; ahora vive entre dos casas.", comportamiento: "retraído", diagnostico_previo: "Ninguno conocido",
            meses: 8, porSemana: 0.6, animo: () => 0.55,
            // Señal «seguidos»: sus 3 dibujos más recientes muestran malestar.
            libreDesde: 25, fijos: [[3, 16, "tristeza", "media"], [10, 15, "miedo", "alta"], [17, 9, "tristeza", "media"]],
        },
        {
            nombre: "Sofi", genero: "femenino", edad: "9",
            situacion_actual: "Su abuela, con quien es muy unida, está en el hospital.", comportamiento: "ansioso",
            meses: 6, porSemana: 0.8, variosMismoDia: 0.1, animo: () => 0.62,
            // Señal «semana»: 3 dibujos con malestar en los últimos 7 días (el último, no).
            libreDesde: 9, fijos: [[1, 17, "alegria"], [2, 10, "miedo"], [4, 14, "ansiedad"], [6, 9, "tristeza"]],
        },
        {
            nombre: "Mateo", genero: "masculino", fecha_nacimiento: "2016-03-12",
            situacion_actual: "Dice que algunos compañeros lo molestan en el recreo.", comportamiento: "agresivo", diagnostico_previo: "TDAH (déficit de atención e hiperactividad)",
            meses: 12, porSemana: 0.7, animo: () => 0.6,
            // Señal «mes»: en los últimos 30 días, más dibujos con malestar (4) que con bienestar (2).
            libreDesde: 32, fijos: [[2, 11, "calma"], [5, 15, "enojo", "alta"], [12, 10, "enojo"], [15, 16, "alegria"], [20, 9, "tristeza"], [27, 14, "enojo"]],
        },
        {
            nombre: "Valen", genero: "femenino", fecha_nacimiento: "2018-07-23",
            situacion_actual: "Vive con sus papás y su hermano menor; está feliz con su nueva mascota.", comportamiento: "normal", diagnostico_previo: "Ninguno conocido",
            meses: 18, porSemana: 0.7, variosMismoDia: 0.1, animo: () => 0.86,
            // Tres dibujos el mismo día (hace 9 días), para ver cómo se agrupan.
            libreDesde: 12, fijos: [[3, 15, "alegria"], [9, 9, "calma", "media"], [9, 11, "calma", "media"], [9, 16, "calma", "media"]],
        },
        {
            nombre: "Isa", genero: "femenino", fecha_nacimiento: "2017-11-15",
            situacion_actual: "Está aprendiendo a manejar los nervios antes de las presentaciones del colegio.", comportamiento: "ansioso", diagnostico_previo: "Ninguno conocido",
            meses: 12, porSemana: 2.4, variosMismoDia: 0.25,
            animo: (dias) => 0.3 + 0.55 * (1 - Math.min(dias, 365) / 365), // va mejorando con el tiempo
            libreDesde: 4, fijos: [[1, 14, "calma"], [2, 10, "alegria"], [3, 16, "asombro"]],
        },
        { nombre: "Nico", genero: "masculino", edad: "5", comportamiento: "hiperactivo", fijos: [[20, 10, "alegria"], [6, 15, "asombro"]] },
        // Un solo dibujo: el gráfico pide al menos 2.
        { nombre: "Sami", genero: "no especificado", comportamiento: "normal", fijos: [[40, 11, "calma"]] },
    ];
}

// Dibujos de un perfil: { dias, hora, grupo, intensidad? }.
function dibujosDePerfil(p, r) {
    const lista = (p.fijos || []).map(([dias, hora, grupo, intensidad]) => ({ dias, hora, grupo, intensidad }));
    const total = Math.round((p.meses || 0) * 30.4);
    for (let dias = p.libreDesde || 1; dias <= total; dias++) {
        if (r() >= (p.porSemana || 0) / 7) continue;
        const horas = [9, 11, 14, 16];
        for (let i = horas.length - 1; i > 0; i--) {
            const j = Math.floor(r() * (i + 1));
            [horas[i], horas[j]] = [horas[j], horas[i]];
        }
        const cuantos = r() < (p.variosMismoDia || 0) ? 2 + Math.floor(r() * 2) : 1;
        for (const hora of horas.slice(0, cuantos)) {
            const grupo = r() < p.animo(dias) ? elegir(r, AGRADABLES) : r() < 0.9 ? elegir(r, DIFICILES) : "neutra";
            lista.push({ dias, hora, grupo });
        }
    }
    return lista;
}

const sinVacios = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ""));

// Banco completo, del más reciente al más antiguo: { fecha, grupo, emocion,
// intensidad, contexto, independiente }. Sin la imagen ni la medición, que
// agrega scripts/demo.js.
function generarBanco(hoy = new Date(), semilla = 2026) {
    const r = azar(semilla);
    const banco = [];
    const nuevo = (dias, hora, grupo, intensidad) => {
        const v = r();
        return {
            fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dias, hora, Math.floor(r() * 60)),
            grupo,
            emocion: elegir(r, EMOCIONES[grupo]),
            intensidad: intensidad || (v < 0.25 ? "baja" : v < 0.75 ? "media" : "alta"),
        };
    };
    for (const p of perfiles(hoy)) {
        for (const d of dibujosDePerfil(p, r)) {
            const item = nuevo(d.dias, d.hora, d.grupo, d.intensidad);
            item.contexto = sinVacios({
                nombre: p.nombre,
                genero: p.genero,
                fecha_nacimiento: p.fecha_nacimiento,
                edad: p.fecha_nacimiento ? String(edadEn(p.fecha_nacimiento, item.fecha)) : p.edad,
                situacion_actual: p.situacion_actual,
                comportamiento: p.comportamiento,
                diagnostico_previo: p.diagnostico_previo,
                dibujo_espontaneo: r() < 0.6 ? "espontáneo" : "se le pidió",
                comento_mientras: elegir(r, COMENTARIOS[d.grupo]),
                tiempo_dibujo: elegir(r, TIEMPOS),
            });
            item.independiente = false;
            banco.push(item);
        }
    }
    // Dibujos sueltos, sin niño.
    for (const [dias, hora, grupo] of [[5, 12, "alegria"], [18, 10, "tristeza"], [33, 15, "asombro"], [60, 9, "neutra"]]) {
        banco.push({ ...nuevo(dias, hora, grupo, "media"), contexto: {}, independiente: true });
    }
    return banco.sort((a, b) => b.fecha - a.fecha);
}

// resultado_ia inventado, con la misma forma que el del modelo.
function resultadoIA(item, dib, medicion, r) {
    const rasgos = [...dib.rasgos];
    if (medicion) rasgos.push(`El dibujo ocupa cerca del ${Math.round(medicion.uso_hoja)} % de la hoja.`);
    const situacion = item.contexto.situacion_actual;
    return {
        rasgos_observados: rasgos,
        interpretacion: INTERPRETACION[item.grupo] + (situacion ? ` Podría relacionarse con lo que se cuenta de su situación: «${situacion}»` : ""),
        emocion_predominante: item.emocion,
        intensidad: item.intensidad,
        lectura_orientativa: LECTURA[item.grupo],
        ...(medicion && { medicion_imagen: medicion }),
        duracion_ms: Math.round((4 + r() * 8) * 60000),
        variante_ia: "demo",
        modelo_ia: "datos de prueba",
    };
}

module.exports = { USUARIO_DEMO, azar, fechaBanco, generarBanco, resultadoIA };
