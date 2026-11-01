// Catálogo FIJO de ideas para acompañar el cumpleaños de un niño, revisable por
// el equipo. NO se genera con IA. El lenguaje es orientativo, nunca clínico.

import { CalendarCheck, Gift, MessageCircle, Palette, PartyPopper, Sparkles } from 'lucide-react';

export const IDEAS_CUMPLE = {
  // Faltan de 1 a 3 días.
  antes: [
    { icon: MessageCircle, titulo: 'Pregúntale cómo le gustaría celebrarlo', texto: 'Dejarle elegir algo sencillo, como una canción, un juego o un postre, le muestra que su día importa.' },
    { icon: Palette, titulo: 'Invítalo a dibujar su cumpleaños', texto: 'Que dibuje cómo imagina su día o qué desea. Es una forma alegre de expresarse mientras llega la fecha.' },
    { icon: CalendarCheck, titulo: 'Cuéntale el plan del día', texto: 'Saber qué va a pasar le da tranquilidad, sobre todo si los cambios de rutina lo inquietan.' },
  ],
  // Es hoy.
  hoy: [
    { icon: PartyPopper, titulo: 'Felicítalo por su nombre', texto: 'Un saludo cálido al empezar el día le hace sentir que es importante para ti.' },
    { icon: Gift, titulo: 'Un detalle hecho a mano', texto: 'Una tarjeta, una canción o un dibujo hecho en grupo valen más que un regalo grande.' },
    { icon: Sparkles, titulo: 'Pregúntale qué fue lo mejor del día', texto: 'Al final de la jornada, escucha lo que más disfrutó. Recordar lo bueno refuerza el momento.' },
  ],
};
