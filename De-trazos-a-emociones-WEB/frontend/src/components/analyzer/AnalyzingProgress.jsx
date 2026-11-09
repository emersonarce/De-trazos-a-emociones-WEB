import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import './AnalyzingProgress.css';

const FASES = [
  'Preparando el dibujo',
  'Observando los trazos y la presión',
  'Identificando los colores',
  'Analizando figuras y composición',
  'Considerando el contexto',
  'Redactando la lectura orientativa',
];

// La barra y la fase se calculan a partir del tiempo transcurrido desde `inicio`,
// no de un contador interno. Así, si se cambia de página y se vuelve, la barra
// continúa donde iba en lugar de reiniciarse. Nunca llega a 100%: se acerca
// asintóticamente a ~92% y, cuando el análisis termina, el componente desaparece.
const AnalyzingProgress = ({ inicio, onCancelar }) => {
  // El inicio queda fijo al montar (inicializador perezoso, sin refs en render).
  const [base] = useState(() => inicio || Date.now());
  const [ahora, setAhora] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const transcurrido = Math.max(0, (ahora - base) / 1000);
  const pct = Math.min(92, 92 * (1 - Math.exp(-transcurrido / 60)));
  const i = Math.min(FASES.length - 1, Math.floor(transcurrido / 3));

  return (
    <div className="analyzing-box">
      <div className="analyzing-head">
        <div className="analyzing-badge">
          <Sparkles size={18} />
        </div>
        <div className="analyzing-titles">
          <div className="analyzing-title">Analizando el dibujo</div>
          <div className="analyzing-phase" key={i}>{FASES[i]}…</div>
        </div>
        {onCancelar && (
          <button type="button" className="analyzing-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>

      <div className="analyzing-bar">
        <div className="analyzing-bar-fill" style={{ width: `${pct}%` }}></div>
      </div>

      <div className="analyzing-note">Esto puede tardar unos minutos. No cierres esta ventana.</div>
    </div>
  );
};

export default AnalyzingProgress;
