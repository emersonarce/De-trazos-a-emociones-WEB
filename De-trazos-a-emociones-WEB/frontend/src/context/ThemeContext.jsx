import { createContext, useContext, useState, useEffect } from 'react';

/* eslint-disable react-refresh/only-export-components */

const ThemeContext = createContext(null);

const TEMAS = ['dark', 'light'];
const PALETAS = ['violeta', 'teal', 'durazno', 'oceano'];

const leer = (clave, valores, def) => {
  try {
    const v = localStorage.getItem(clave);
    return valores.includes(v) ? v : def;
  } catch {
    return def;
  }
};

export const ThemeProvider = ({ children }) => {
  const [tema, setTema] = useState(() => leer('tema', TEMAS, 'dark'));
  const [paleta, setPaleta] = useState(() => leer('paleta', PALETAS, 'violeta'));

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', tema);
    root.setAttribute('data-palette', paleta);
    try {
      localStorage.setItem('tema', tema);
      localStorage.setItem('paleta', paleta);
    } catch {
      /* almacenamiento no disponible: el tema se aplica igual en esta sesión */
    }
  }, [tema, paleta]);

  return (
    <ThemeContext.Provider value={{ tema, paleta, setTema, setPaleta }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return ctx;
};
