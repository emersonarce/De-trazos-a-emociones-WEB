import { useRef, useEffect } from 'react';
import { crearSimulacion } from './trazosCara';
import { emotionVisual } from '../../utils/emociones';
import './IconoAnimo.css';

const prefiereMenosMovimiento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Cara de la emoción a la derecha del banner, con espacio a la izquierda para el texto.
const ubicarCara = (w, h) => {
  const angosto = w < 560;
  const tam = Math.min(h * 0.74, angosto ? 84 : 150);
  return { cx: w - tam / 2 - (angosto ? 22 : 64), cy: h / 2, tam };
};

// Más tenues sobre el saludo (mitad izquierda) para no restarle legibilidad.
const atenuar = (x, y, w) => 0.3 + 0.7 * Math.min(1, Math.max(0, (x / w - 0.3) / 0.25));

// Emociones por las que pasa la cara al hacer clic, cada una con su cara y color.
const CICLO = ['Alegría', 'Cariño', 'Asombro', 'Calma', 'Tristeza', 'Miedo', 'Enojo', 'Ansiedad'].map((nombre) => emotionVisual(nombre));
// Tras unos segundos sin clics, vuelve a la emoción predominante del niño.
const VOLVER_MS = 8000;

// Emoción predominante del niño dibujada con trazos de crayón. Ocupa todo el
// banner de bienvenida (se monta dentro de .welcome): al entrar los trazos están
// dispersos y se acomodan hasta dibujar la cara; el puntero los aparta. Al hacer
// clic, la cara explota con su color y se vuelve a juntar como otra emoción,
// cambiando de color a medida que los trazos llegan.
const IconoAnimo = ({ visual, emocion }) => {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const inicialRef = useRef(visual);
  const mostradaRef = useRef(null); // clave de la emoción del ciclo en pantalla (null = la del niño)
  const volverRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const sim = crearSimulacion(canvas, {
      cara: inicialRef.current.cara,
      color: inicialRef.current.color,
      reducido: prefiereMenosMovimiento(),
      zona: canvas.parentElement,
      ubicarCara,
      atenuar,
      densidadSueltas: 1 / 12000,
    });
    simRef.current = sim;
    return () => {
      clearTimeout(volverRef.current);
      sim.destruir();
    };
  }, []);

  // Al cambiar de niño (o de emoción), los trazos pasan a la nueva cara y color.
  useEffect(() => {
    clearTimeout(volverRef.current);
    mostradaRef.current = null;
    simRef.current?.cambiarCara(visual.cara, visual.color);
  }, [visual.cara, visual.color]);

  const volverAlNino = () => {
    mostradaRef.current = null;
    simRef.current?.transicionar(visual.cara, visual.color);
  };

  const alClic = () => {
    const actual = mostradaRef.current ?? visual.clave;
    let i = (CICLO.findIndex((e) => e.clave === actual) + 1) % CICLO.length;
    if (CICLO[i].clave === actual) i = (i + 1) % CICLO.length;
    const siguiente = CICLO[i];
    mostradaRef.current = siguiente.clave;
    simRef.current?.transicionar(siguiente.cara, siguiente.color);
    clearTimeout(volverRef.current);
    volverRef.current = setTimeout(volverAlNino, VOLVER_MS);
  };

  const descripcion = emocion ? `Emoción predominante: ${emocion}` : 'Sin emoción registrada todavía';

  return (
    <>
      <canvas
        ref={canvasRef}
        className="animo-lienzo"
        style={{ '--animo-color': visual.color }}
        aria-hidden="true"
      />
      <button
        type="button"
        className="animo-boton"
        onClick={alClic}
        // Sin title: el tooltip del navegador tapaba la animación. La
        // descripción queda solo para lectores de pantalla.
        aria-label={`${descripcion}. Haz clic para ver otras emociones.`}
      />
    </>
  );
};

export default IconoAnimo;
