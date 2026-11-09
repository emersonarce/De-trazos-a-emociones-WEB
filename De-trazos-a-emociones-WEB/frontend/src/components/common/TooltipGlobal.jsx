import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './TooltipGlobal.css';

// Tooltips con el diseño de la app, para toda la interfaz. Toma el atributo
// title (o data-tip) del elemento bajo el puntero o con el foco y lo muestra
// como un globo propio. El title se pasa a data-tip para que no salga también
// el recuadro nativo del navegador; si el elemento no tiene texto (un botón con
// solo ícono), el texto queda como aria-label para los lectores de pantalla.
const RETRASO_MS = 350;
const MARGEN = 8;

const textoDe = (el) => {
  const titulo = el.getAttribute('title');
  if (titulo) {
    el.setAttribute('data-tip', titulo);
    el.removeAttribute('title');
    if (!el.hasAttribute('aria-label') && !el.textContent.trim()) el.setAttribute('aria-label', titulo);
  }
  return el.getAttribute('data-tip') || '';
};

const TooltipGlobal = () => {
  const [tip, setTip] = useState(null); // { texto, rect }
  const [pos, setPos] = useState(null); // { top, left, lado }
  const globoRef = useRef(null);
  const actual = useRef(null);
  const timer = useRef(0);

  useEffect(() => {
    const ocultar = () => {
      actual.current = null;
      clearTimeout(timer.current);
      setTip(null);
    };
    const programar = (el, inmediato) => {
      if (el === actual.current) return;
      actual.current = el;
      clearTimeout(timer.current);
      setTip(null);
      const texto = textoDe(el);
      if (!texto) return;
      timer.current = setTimeout(() => {
        if (actual.current === el && el.isConnected) setTip({ texto, rect: el.getBoundingClientRect() });
      }, inmediato ? 0 : RETRASO_MS);
    };

    const alEntrar = (e) => {
      if (e.pointerType === 'touch') return;
      const el = e.target.closest?.('[title], [data-tip]');
      if (el) programar(el, false);
    };
    const alSalir = (e) => {
      const el = actual.current;
      if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) ocultar();
    };
    const alEnfocar = (e) => {
      const el = e.target.closest?.('[title], [data-tip]');
      if (el && e.target.matches(':focus-visible')) programar(el, true);
    };

    document.addEventListener('pointerover', alEntrar);
    document.addEventListener('pointerout', alSalir);
    document.addEventListener('focusin', alEnfocar);
    document.addEventListener('focusout', ocultar);
    document.addEventListener('pointerdown', ocultar);
    document.addEventListener('keydown', ocultar);
    window.addEventListener('scroll', ocultar, true);
    window.addEventListener('blur', ocultar);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener('pointerover', alEntrar);
      document.removeEventListener('pointerout', alSalir);
      document.removeEventListener('focusin', alEnfocar);
      document.removeEventListener('focusout', ocultar);
      document.removeEventListener('pointerdown', ocultar);
      document.removeEventListener('keydown', ocultar);
      window.removeEventListener('scroll', ocultar, true);
      window.removeEventListener('blur', ocultar);
    };
  }, []);

  // Ubica el globo: arriba del elemento; abajo si no cabe; a la derecha para
  // los íconos de la barra lateral. Siempre dentro de la ventana.
  useLayoutEffect(() => {
    if (!tip || !globoRef.current) {
      setPos(null);
      return;
    }
    const { rect } = tip;
    const g = globoRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let lado = 'arriba';
    let top = rect.top - g.height - 10;
    let left = rect.left + rect.width / 2 - g.width / 2;
    if (rect.right < 110 && rect.width < 90) {
      lado = 'derecha';
      top = rect.top + rect.height / 2 - g.height / 2;
      left = rect.right + 10;
    } else if (top < MARGEN) {
      lado = 'abajo';
      top = rect.bottom + 10;
    }
    left = Math.max(MARGEN, Math.min(left, vw - g.width - MARGEN));
    top = Math.max(MARGEN, Math.min(top, vh - g.height - MARGEN));
    setPos({ top, left, lado });
  }, [tip]);

  if (!tip) return null;
  return createPortal(
    <div
      ref={globoRef}
      className={`tooltip-global ${pos ? `visible ${pos.lado}` : ''}`}
      style={pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 }}
      role="tooltip"
    >
      {tip.texto}
    </div>,
    document.body
  );
};

export default TooltipGlobal;
