// Catálogo FIJO de actividades y consejos por emoción, revisable por el equipo.
// NO se genera con IA. Se usa para sugerir acompañamiento según la emoción
// predominante del niño. El lenguaje es orientativo, nunca clínico ni diagnóstico.
// Cada actividad incluye un "fundamento": el porqué de la sugerencia.

import { BookOpen, ClipboardList, Flashlight, HeartHandshake, MessageCircle, MessagesSquare, Palette, PersonStanding, Trees, Wind } from 'lucide-react';
import { emotionVisual } from '../utils/emociones';

const PURPURA = { bg: 'rgba(139, 121, 242, 0.15)', color: 'var(--purple-light)' };
const TEAL = { bg: 'rgba(45,212,191,0.15)', color: 'var(--teal)' };
const AMBAR = { bg: 'rgba(251,191,36,0.15)', color: 'var(--amber)' };

const CATALOGO = {
  alegria: {
    actividades: [
      { icon: Palette, nombre: 'Dibujen juntos lo que lo hace feliz', desc: 'Acompáñalo sin pantallas y deja que elija el tema. Celebra sus ideas sin corregir.', fundamento: 'Expresar lo positivo con el dibujo refuerza las emociones agradables y le ayuda a reconocer qué le hace bien.', tag: 'Conexión', ...PURPURA },
      { icon: MessageCircle, nombre: 'Pregúntale qué fue lo mejor de su día', desc: 'Darle espacio para contar lo bueno refuerza su bienestar y la confianza.', fundamento: 'Poner en palabras lo bueno entrena la atención a lo positivo y fortalece el vínculo al sentirse escuchado.', tag: 'Diálogo', ...AMBAR },
      { icon: Trees, nombre: 'Un rato de juego libre al aire libre', desc: 'El movimiento y el aire libre ayudan a sostener los momentos de alegría.', fundamento: 'El juego libre y el movimiento liberan energía y sostienen el bienestar emocional.', tag: 'Juego', ...TEAL },
    ],
    consejos: [
      { titulo: 'Refuerza lo positivo', texto: 'Nómbrale lo que ves ("te vi muy contento hoy"); ayuda a que reconozca sus emociones buenas.' },
      { titulo: 'Comparte el momento', texto: 'Participa de lo que disfruta. La alegría compartida fortalece el vínculo.' },
    ],
  },
  tristeza: {
    actividades: [
      { icon: HeartHandshake, nombre: 'Un rato de compañía tranquila', desc: 'A veces un abrazo o estar cerca en silencio acompaña más que muchas preguntas.', fundamento: 'La presencia cercana y sin exigencias le transmite seguridad y le muestra que no está solo en lo que siente.', tag: 'Calma', ...TEAL },
      { icon: BookOpen, nombre: 'Un cuento sobre emociones', desc: 'Leer un cuento donde el personaje se siente triste ayuda a poner nombre a lo que siente.', fundamento: 'Las historias dan nombre a la emoción y ayudan a entender que la tristeza es pasajera y compartida.', tag: 'Diálogo', ...AMBAR },
      { icon: Palette, nombre: 'Dibujar cómo se siente hoy', desc: 'Invítalo a dibujar su emoción. Es una forma suave de expresar lo que no dice con palabras.', fundamento: 'El dibujo es una vía segura para expresar lo que todavía no puede poner en palabras.', tag: 'Expresión', ...PURPURA },
    ],
    consejos: [
      { titulo: 'Valida lo que siente', texto: 'Dile que está bien sentirse triste y que no está solo. Evita minimizar ("no es para tanto").' },
      { titulo: 'No fuerces la conversación', texto: 'Ofrece tu presencia y espera a que quiera hablar; a veces llega más tarde.' },
    ],
  },
  ansiedad: {
    actividades: [
      { icon: Wind, nombre: 'Respiración de la burbuja', desc: 'Inhalar lento y soplar como inflando una burbuja grande, varias veces juntos. Calma el cuerpo.', fundamento: 'La respiración lenta activa la calma del cuerpo y le da una herramienta concreta para autorregularse.', tag: 'Calma', ...TEAL },
      { icon: ClipboardList, nombre: 'Rutina visible del día', desc: 'Anticipar lo que viene (con dibujos o lista) reduce la incertidumbre que alimenta la ansiedad.', fundamento: 'Anticipar lo que viene reduce la incertidumbre, una de las principales fuentes de ansiedad infantil.', tag: 'Rutina', ...PURPURA },
      { icon: MessageCircle, nombre: 'Nombrar la preocupación', desc: 'Pregúntale "¿qué es lo que más te preocupa?" y escúchalo sin apurarlo.', fundamento: 'Poner en palabras la preocupación la hace más manejable y le muestra que puede pedir ayuda.', tag: 'Diálogo', ...AMBAR },
    ],
    consejos: [
      { titulo: 'Normaliza la emoción', texto: 'Cuéntale que a veces tú también te sientes nervioso y cómo lo manejas.' },
      { titulo: 'Ofrece previsibilidad', texto: 'Las rutinas claras y los avisos de los cambios le dan seguridad.' },
    ],
  },
  enojo: {
    actividades: [
      { icon: PersonStanding, nombre: 'Descargar la energía', desc: 'Correr, saltar o apretar una pelota blanda ayuda a soltar la tensión del enojo.', fundamento: 'La actividad física canaliza la tensión del enojo de forma segura, sin dañar ni dañarse.', tag: 'Juego', ...TEAL },
      { icon: Palette, nombre: 'Dibujar el enojo con colores', desc: 'Dejar que dibuje su enojo como quiera es una salida segura para esa emoción.', fundamento: 'Representar la emoción le da una salida simbólica y le ayuda a observarla desde afuera.', tag: 'Expresión', ...PURPURA },
      { icon: MessageCircle, nombre: 'Poner en palabras lo que pasó', desc: 'Cuando esté más calmado, ayúdalo a contar qué lo molestó, sin juzgar.', fundamento: 'Hablar de lo ocurrido ya en calma desarrolla su capacidad de resolver conflictos.', tag: 'Diálogo', ...AMBAR },
    ],
    consejos: [
      { titulo: 'Acompaña la calma primero', texto: 'Primero ayúdalo a calmarse; las conversaciones funcionan mejor después, no en pleno enojo.' },
      { titulo: 'Pon límites con cariño', texto: 'Está bien sentir enojo; lo que se cuida es cómo se expresa. Ofrécele alternativas.' },
    ],
  },
  calma: {
    actividades: [
      { icon: Palette, nombre: 'Aprovechar para crear juntos', desc: 'Un momento de calma es ideal para dibujar o construir algo sin prisa.', fundamento: 'Aprovechar la calma para crear fortalece el vínculo y asocia la tranquilidad con momentos agradables.', tag: 'Conexión', ...PURPURA },
      { icon: BookOpen, nombre: 'Lectura compartida', desc: 'Leer juntos sostiene la tranquilidad y fortalece el vínculo.', fundamento: 'Leer juntos sostiene la serenidad y crea un espacio de cercanía predecible.', tag: 'Calma', ...TEAL },
      { icon: MessageCircle, nombre: 'Conversar con tranquilidad', desc: 'Los momentos calmados son buenos para hablar de cómo se ha sentido en la semana.', fundamento: 'Los momentos calmados son los mejores para hablar de emociones sin presión.', tag: 'Diálogo', ...AMBAR },
    ],
    consejos: [
      { titulo: 'Refuerza el bienestar', texto: 'Hazle notar lo bien que se siente estar tranquilos juntos.' },
      { titulo: 'Mantén lo que funciona', texto: 'Identifica qué ayudó a esta calma para repetirlo otros días.' },
    ],
  },
  miedo: {
    actividades: [
      { icon: Flashlight, nombre: 'Explorar el miedo con seguridad', desc: 'Hablar del miedo con una linterna o un peluche "valiente" lo hace más manejable.', fundamento: 'Acercarse al miedo mediante el juego, en un entorno seguro, reduce su intensidad poco a poco.', tag: 'Juego', ...TEAL },
      { icon: BookOpen, nombre: 'Cuento de superar un miedo', desc: 'Historias donde el personaje enfrenta un miedo ayudan a procesarlo.', fundamento: 'Ver a un personaje enfrentar un miedo le da modelos y la esperanza de que él también puede.', tag: 'Diálogo', ...AMBAR },
      { icon: HeartHandshake, nombre: 'Compañía al dormir', desc: 'Si el miedo aparece de noche, una rutina tranquila y tu cercanía dan seguridad.', fundamento: 'Una rutina tranquila y la cercanía del adulto dan la seguridad que el miedo nocturno necesita.', tag: 'Calma', ...PURPURA },
    ],
    consejos: [
      { titulo: 'No ridiculices el miedo', texto: 'Para el niño es real. Reconócelo ("entiendo que te asuste") antes de tranquilizarlo.' },
      { titulo: 'Avanza de a poco', texto: 'Acompáñalo a enfrentar el miedo en pasos pequeños, a su ritmo.' },
    ],
  },
  default: {
    actividades: [
      { icon: Palette, nombre: 'Dibujen juntos 15 minutos', desc: 'Siéntate con el niño sin pantallas. Deja que elija qué dibujar. No corrijas, solo acompaña.', fundamento: 'Compartir la actividad sin corregir fortalece el vínculo y le da espacio para expresarse.', tag: 'Conexión', ...PURPURA },
      { icon: BookOpen, nombre: 'Cuento antes de dormir', desc: 'Un cuento donde el personaje vive una emoción ayuda a procesarla.', fundamento: 'Las historias ayudan a procesar emociones y crean una rutina que da seguridad.', tag: 'Calma', ...TEAL },
      { icon: MessagesSquare, nombre: 'Pregúntale cómo estuvo su día', desc: 'No "¿cómo te fue?" sino "¿qué fue lo más raro que pasó hoy?".', fundamento: 'Las preguntas abiertas invitan a contar más y le muestran interés genuino.', tag: 'Diálogo', ...AMBAR },
    ],
    consejos: [
      { titulo: 'Acompaña sin presionar', texto: 'Ofrece tu presencia y escucha; no siempre hace falta resolver, a veces basta estar.' },
      { titulo: 'Observa con cariño', texto: 'Registrar sus dibujos con regularidad ayuda a notar cómo va cambiando su ánimo.' },
    ],
  },
};

// Usa la misma clasificación de emociones que las caras. Asombro y cariño, que
// son agradables, comparten las actividades de alegría.
const CATALOGO_DE = { asombro: 'alegria', carino: 'alegria' };
export function actividadesPara(emocion = '') {
  const { clave } = emotionVisual(emocion || '');
  return CATALOGO[CATALOGO_DE[clave] || clave] || CATALOGO.default;
}
