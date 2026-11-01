import { Cake } from 'lucide-react';
import './BirthdayBanner.css';
import Confeti from '../common/Confeti';
import { emocionPredominante } from '../../utils/emociones';
import { actividadesPara } from '../../data/actividades';
import { IDEAS_CUMPLE } from '../../data/cumpleanos';

const BirthdayBanner = ({ cumples = [] }) => {
  if (cumples.length === 0) return null;

  return (
    <div className="bday-list">
      {cumples.map(({ nino, cumple }) => {
        const emocion = emocionPredominante(nino.analisis);
        const sugerencia = emocion ? actividadesPara(emocion).actividades[0] : null;
        const esHoy = cumple.dias === 0;
        const idea = IDEAS_CUMPLE[esHoy ? 'hoy' : 'antes'][0];
        return (
          <div className={`bday-card${esHoy ? ' bday-hoy' : ''}`} key={nino.nombre}>
            {esHoy && <Confeti clave={`${nino.nombre}|${nino.fecha_nacimiento}`} />}
            <div className="bday-emoji"><Cake size={24} /></div>
            <div className="bday-text">
              <div className="bday-title">
                {nino.nombre} cumple {cumple.edad} años {cumple.cuando}
              </div>
              {sugerencia ? (
                <div className="bday-sub">
                  En sus últimos dibujos mostró sobre todo <strong>{emocion}</strong>. Una idea para acompañar su día:
                  {' '}<strong>{sugerencia.nombre}</strong> — {sugerencia.desc}
                </div>
              ) : (
                <div className="bday-sub">
                  Una idea para {esHoy ? 'acompañar su día' : 'prepararlo'}: <strong>{idea.titulo}</strong> — {idea.texto}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BirthdayBanner;
