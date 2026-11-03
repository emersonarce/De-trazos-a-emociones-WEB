/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GuidedTour from '../components/common/GuidedTour';
import { puedePdf } from '../utils/permisos';

const TourContext = createContext(null);
export const useTour = () => useContext(TourContext);

const leerNombre = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}').nombre || '';
  } catch {
    return '';
  }
};

export function TourProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [activo, setActivo] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);

  const nombre = leerNombre();

  // Recorrido multi-página: cada paso vive en una ruta y señala un elemento.
  const pasos = useMemo(
    () => [
      { route: '/app', titulo: `¡Hola, ${nombre || 'bienvenido'}!`, texto: 'Te muestro en un recorrido rápido cómo usar la app. Puedes saltarlo cuando quieras.' },
      { route: '/app', selector: '[data-tour="nav"]', titulo: 'Menú de navegación', texto: 'Desde esta barra llegas a Analizar, Panel, Historial, Mis niños, Reportes y Configuración.' },
      { route: '/app', selector: '[data-tour="modo"]', titulo: 'Cómo analizar', texto: 'Elige "Con contexto del niño" para un análisis completo, o "Solo dibujo" para uno rápido.' },
      { route: '/app', selector: '[data-tour="pasos"]', titulo: 'Sigue los pasos', texto: 'Completa el contexto, sube el dibujo y obtén el análisis. Toca cada paso para avanzar.' },
      { route: '/dashboard', selector: '[data-tour="dash"]', titulo: 'El Panel del niño', texto: 'Aquí ves el seguimiento de cada niño: su emoción predominante y su evolución.' },
      { route: '/dashboard', selector: '[data-tour="agregar"]', titulo: 'Agregar un niño', texto: 'Con este botón registras un niño nuevo con su contexto para empezar su seguimiento.' },
      { route: '/dashboard', selector: '[data-tour="actividades"]', titulo: 'Actividades sugeridas', texto: 'Ideas para acompañar al niño según su emoción. Toca una para ver por qué ayuda.' },
      { route: '/dashboard', selector: '[data-tour="comparar"]', titulo: 'Antes y ahora', texto: 'Compara dos dibujos del niño (incluso del mismo día por hora) para ver cómo cambia su estado.' },
      { route: '/dashboard', selector: '[data-tour="exportar"]', titulo: 'Exportar a PDF', texto: 'Descarga el historial del niño en PDF. También puedes exportar el detalle de cada análisis.' },
      { route: '/historial', selector: '[data-tour="hist"]', titulo: 'Historial y evolución', texto: 'Revisa todos los análisis de un niño y su evolución en el tiempo.' },
      { route: '/ninos', selector: '[data-tour="ninos"]', titulo: 'Mis niños', texto: 'Consulta la información y la situación actual de cada niño registrado.' },
      { route: '/app', selector: '[data-tour="perfil"]', titulo: 'Tu cuenta', texto: '¡Listo! Desde tu perfil (aquí en la barra) cambias tu foto, entras a Configuración (tema y contraseña) o cierras sesión. Ya puedes empezar subiendo un dibujo.' },
    ].filter((p) => p.selector !== '[data-tour="exportar"]' || puedePdf()), // sin el permiso no hay botón de PDF
    [nombre]
  );

  const paso = activo ? pasos[i] : null;

  // El Analyzer lanza el recorrido al montarse; como el último paso vuelve a
  // /app, sin esta guarda el recorrido en curso empezaría otra vez desde cero.
  const activoRef = useRef(false);
  useEffect(() => {
    activoRef.current = activo;
  }, [activo]);

  const start = useCallback(() => {
    if (activoRef.current) return;
    setI(0);
    setRect(null);
    setActivo(true);
  }, []);

  const cerrar = useCallback(() => {
    setActivo(false);
    setRect(null);
    try {
      localStorage.setItem('tutorial_visto', '1');
      localStorage.removeItem('tutorial_forzar');
    } catch {
      /* ignore */
    }
  }, []);

  // 1) Navegar a la ruta del paso si no estamos ahí.
  useEffect(() => {
    if (!paso) return;
    if (paso.route && location.pathname !== paso.route) {
      navigate(paso.route);
    }
  }, [paso, location.pathname, navigate]);

  // 2) Localizar el elemento del paso (con reintentos, porque tras navegar tarda
  //    en montarse) y seguir su posición en scroll/resize.
  useEffect(() => {
    if (!paso) return;
    if (!paso.selector) return; // paso centrado, sin elemento
    if (paso.route && location.pathname !== paso.route) return; // aún no llegamos

    let cancelado = false;
    let intentos = 0;

    const fijarDesde = (el) => {
      const r = el.getBoundingClientRect();
      if (!cancelado) setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const medir = () => {
      if (cancelado) return;
      const el = document.querySelector(paso.selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fijarDesde(el); // posición inmediata (evita el parpadeo centrado)
        setTimeout(() => !cancelado && fijarDesde(el), 350); // reajuste tras el scroll
      } else if (intentos < 30) {
        intentos += 1;
        setTimeout(medir, 120);
      }
    };

    const t = setTimeout(medir, 0);

    const onMove = () => {
      const el = document.querySelector(paso.selector);
      if (el) fijarDesde(el);
    };
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);

    return () => {
      cancelado = true;
      clearTimeout(t);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [paso, location.pathname]);

  const siguiente = () => {
    if (i < pasos.length - 1) {
      setRect(null);
      setI((n) => n + 1);
    } else {
      cerrar();
    }
  };
  const anterior = () => {
    setRect(null);
    setI((n) => Math.max(0, n - 1));
  };

  return (
    <TourContext.Provider value={{ start }}>
      {children}
      {activo && paso && (
        <GuidedTour
          step={paso}
          index={i}
          total={pasos.length}
          rect={rect}
          onPrev={anterior}
          onNext={siguiente}
          onClose={cerrar}
        />
      )}
    </TourContext.Provider>
  );
}
