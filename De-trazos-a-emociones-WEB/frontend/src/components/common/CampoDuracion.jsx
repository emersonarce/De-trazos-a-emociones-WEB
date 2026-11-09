import { useState } from 'react';
import { mascaraDuracion, duracionDesdeTexto, textoDuracion } from '../../utils/contextoNino';

// Tiempo exacto que tardó el niño, en un solo campo «hh:mm». Es una duración:
// no lleva a. m. ni p. m. Las cifras entran por la derecha, como en un
// cronómetro («15» → 00:15; «130» → 01:30).
const CampoDuracion = ({ valor = '', onCambiar, className = '' }) => {
  const [texto, setTexto] = useState(() => textoDuracion(valor));

  // Si el valor cambia desde fuera (se elige una de las opciones, se limpia el
  // formulario o se abre otro análisis), el campo se pone al día sin pisar lo
  // que se está escribiendo.
  const [valorVisto, setValorVisto] = useState(valor);
  if (valor !== valorVisto) {
    setValorVisto(valor);
    if (duracionDesdeTexto(texto) !== (valor || '')) setTexto(textoDuracion(valor));
  }

  const escribir = (e) => {
    const t = mascaraDuracion(e.target.value);
    setTexto(t);
    onCambiar(duracionDesdeTexto(t));
  };

  return (
    <label className={`campo-duracion ${className}`.trim()}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={texto}
        onChange={escribir}
        onBlur={() => setTexto(textoDuracion(valor))}
        placeholder="00:00"
        aria-label="Tiempo exacto que tardó, en horas y minutos"
      />
      <span>h:min</span>
    </label>
  );
};

export default CampoDuracion;
