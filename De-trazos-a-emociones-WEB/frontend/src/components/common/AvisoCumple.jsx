import { Cake } from 'lucide-react';
import Confeti from './Confeti';
import { IDEAS_CUMPLE } from '../../data/cumpleanos';
import './AvisoCumple.css';

// Aviso de cumpleaños al registrar o retomar a un niño (cumple = infoCumple()).
// Si es hoy, sale con confeti y globos; si faltan pocos días, con ideas para prepararlo.
const AvisoCumple = ({ nombre, cumple, clave }) => {
  if (!cumple) return null;
  const esHoy = cumple.dias === 0;
  const alias = String(nombre || '').trim();
  const de = alias ? `el cumpleaños de ${alias}` : 'su cumpleaños';
  const titulo = esHoy ? `¡Hoy es ${de}!` : cumple.dias === 1 ? `Mañana es ${de}` : `Faltan ${cumple.dias} días para ${de}`;
  const ideas = IDEAS_CUMPLE[esHoy ? 'hoy' : 'antes'];
  return (
    <section className={`aviso-cumple${esHoy ? ' es-hoy' : ''}`} role="status">
      {esHoy && <Confeti clave={clave} />}
      {esHoy && (
        <div className="aviso-cumple-globos" aria-hidden="true">
          <span /><span /><span />
        </div>
      )}
      <div className="aviso-cumple-head">
        <div className="aviso-cumple-icono"><Cake size={22} /></div>
        <div>
          <h4>{titulo}</h4>
          <p>
            {esHoy ? `Cumple ${cumple.edad} años.` : `Cumplirá ${cumple.edad} años.`}
            {' '}Algunas ideas para {esHoy ? 'acompañar su día' : 'prepararlo'}:
          </p>
        </div>
      </div>
      <ul className="aviso-cumple-ideas">
        {ideas.map(({ icon: Icono, titulo: idea, texto }) => (
          <li key={idea}>
            <Icono size={16} aria-hidden="true" />
            <div><b>{idea}</b><span>{texto}</span></div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AvisoCumple;
