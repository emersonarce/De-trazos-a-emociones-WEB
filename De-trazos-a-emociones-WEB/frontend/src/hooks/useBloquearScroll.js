import { useEffect } from 'react';

// Bloquea el scroll del <body> mientras hay un modal abierto, para que no
// queden dos barras de scroll (la de la página detrás y la del modal).
// Guarda los valores previos y los restaura al cerrar, de modo que los modales
// anidados (p. ej. "Exportar PDF" dentro del detalle) lo manejen bien.
//
// Al ocultar el scroll desaparece la barra (en Windows ocupa ~17 px) y toda la
// página se correría a la derecha; para que nada se mueva, se reserva ese
// ancho con padding mientras el modal está abierto.
export function useBloquearScroll(activo) {
  useEffect(() => {
    if (!activo) return undefined;
    const { body } = document;
    const previoOverflow = body.style.overflow;
    const previoPadding = body.style.paddingRight;
    const barra = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (barra > 0) {
      const padding = parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${padding + barra}px`;
    }
    return () => {
      body.style.overflow = previoOverflow;
      body.style.paddingRight = previoPadding;
    };
  }, [activo]);
}
