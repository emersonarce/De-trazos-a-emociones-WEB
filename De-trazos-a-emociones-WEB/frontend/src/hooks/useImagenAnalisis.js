import { useEffect, useState } from 'react';
import { API_URL } from '../config';

// Carga la imagen protegida de un análisis enviando el token (un <img src> no
// puede mandar cabeceras, por eso se descarga como blob y se usa un objectURL).
// Devuelve { url, error }; url es null mientras carga.
export function useImagenAnalisis(analisisId, activo = true) {
  const [estado, setEstado] = useState({ id: null, url: null, error: false });

  useEffect(() => {
    if (!analisisId || !activo) return undefined;
    let cancelado = false;
    let objectUrl;
    const cargar = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/analisis/${analisisId}/imagen`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelado) return;
        if (!res.ok) { setEstado({ id: analisisId, url: null, error: true }); return; }
        const blob = await res.blob();
        if (cancelado) return;
        objectUrl = URL.createObjectURL(blob);
        setEstado({ id: analisisId, url: objectUrl, error: false });
      } catch {
        if (!cancelado) setEstado({ id: analisisId, url: null, error: true });
      }
    };
    cargar();
    return () => {
      cancelado = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [analisisId, activo]);

  // Si cambió el análisis, no mostrar la imagen del anterior mientras carga.
  const vigente = estado.id === analisisId;
  return { url: vigente ? estado.url : null, error: vigente && estado.error };
}
