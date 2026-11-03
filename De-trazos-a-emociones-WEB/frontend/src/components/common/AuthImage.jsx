import { useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useImagenAnalisis } from '../../hooks/useImagenAnalisis';
import './AuthImage.css';

// true cuando el elemento está por verse (o ya se vio). Una lista puede tener
// cientos de dibujos: así cada miniatura se pide al acercarse a la pantalla y
// no todas de golpe al abrirla.
const useCercaDeVerse = (ref) => {
  const [visto, setVisto] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (visto || !ref.current) return undefined;
    const observador = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) {
        setVisto(true);
        observador.disconnect();
      }
    }, { rootMargin: '300px' });
    observador.observe(ref.current);
    return () => observador.disconnect();
  }, [visto, ref]);
  return visto;
};

// Imagen protegida de un análisis (se carga con el token; ver useImagenAnalisis).
// Si el archivo no está en este servidor (p. ej. el análisis se hizo en otro
// equipo que comparte la misma base de datos), lo dice en vez de quedar vacía.
const AuthImage = ({ analisisId, alt = 'Dibujo', className, style, onClick }) => {
  const ref = useRef(null);
  const visto = useCercaDeVerse(ref);
  const { url, error } = useImagenAnalisis(analisisId, visto);

  if (error) {
    return (
      <div
        className={`${className || ''} auth-img-faltante`}
        style={style}
        onClick={onClick}
        role="img"
        aria-label="Imagen no disponible en este servidor"
        title="La imagen de este dibujo no está disponible en este servidor"
      >
        <ImageOff size={20} />
        <span>Imagen no disponible</span>
      </div>
    );
  }
  if (!url) {
    return <div ref={ref} className={className} style={style} aria-label={alt} />;
  }
  return <img src={url} alt={alt} className={className} style={style} onClick={onClick} />;
};

export default AuthImage;
