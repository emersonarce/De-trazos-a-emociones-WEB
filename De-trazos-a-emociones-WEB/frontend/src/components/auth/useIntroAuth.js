import { useState, useEffect, useCallback } from 'react';

// El formulario del login y el registro aparece cuando termina la animación
// del logo (AuthGraphics llama a "terminar"). Para no hacer esperar a nadie,
// también aparece al primer clic o tecla, y de inmediato en pantallas pequeñas
// (sin el panel de la animación) o con "reducir movimiento".
const sinIntro = () =>
  typeof window === 'undefined' ||
  window.matchMedia?.('(max-width: 900px)').matches ||
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useIntroAuth() {
  const [lista, setLista] = useState(sinIntro);
  const terminar = useCallback(() => setLista(true), []);

  useEffect(() => {
    if (lista) return undefined;
    window.addEventListener('pointerdown', terminar);
    window.addEventListener('keydown', terminar);
    return () => {
      window.removeEventListener('pointerdown', terminar);
      window.removeEventListener('keydown', terminar);
    };
  }, [lista, terminar]);

  return [lista, terminar];
}
