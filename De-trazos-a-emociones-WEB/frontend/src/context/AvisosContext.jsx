/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { mensajeDeError } from '../utils/errores';

// Avisos flotantes de la app (reemplazan los alert() del navegador).
//   const { avisar, avisarError } = useAvisos();
//   avisarError('No se pudo eliminar el análisis', err);
//   avisar({ tipo: 'exito', titulo: 'Listo' });
// Los muestra <AvisosFlotantes />.
const AvisosContext = createContext(null);
export const useAvisos = () => useContext(AvisosContext);

const MAX_VISIBLES = 3;

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const siguienteId = useRef(1);

  const cerrar = useCallback((id) => setAvisos((prev) => prev.filter((a) => a.id !== id)), []);

  const avisar = useCallback(({ tipo = 'info', titulo, texto = '' }) => {
    const id = siguienteId.current++;
    setAvisos((prev) => [...prev, { id, tipo, titulo, texto }].slice(-MAX_VISIBLES));
    return id;
  }, []);

  const avisarError = useCallback(
    (titulo, err) => avisar({ tipo: 'error', titulo, texto: mensajeDeError(err) }),
    [avisar]
  );

  const valor = useMemo(() => ({ avisos, avisar, avisarError, cerrar }), [avisos, avisar, avisarError, cerrar]);
  return <AvisosContext.Provider value={valor}>{children}</AvisosContext.Provider>;
}
