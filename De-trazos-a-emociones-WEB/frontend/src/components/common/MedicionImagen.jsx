import './MedicionImagen.css';
import { coloresMedicion, filasMedicion, NOTA_MEDICION } from '../../utils/medicion';

const capital = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

// Medición de color y trazo calculada sobre la imagen (no la hace la IA).
const MedicionImagen = ({ medicion }) => {
  const filas = filasMedicion(medicion);
  if (!filas.length) return null;
  const colores = coloresMedicion(medicion);
  return (
    <div className="med">
      {colores.length > 0 && (
        <>
          <div className="med-barra" role="img" aria-label={`Colores predominantes: ${colores.map((c) => `${c.nombre} ${c.texto}`).join(', ')}`}>
            {colores.map((c) => (
              <span key={c.nombre} style={{ width: `${c.ancho}%`, background: c.color }} title={`${capital(c.nombre)}: ${c.texto} de lo dibujado`} />
            ))}
          </div>
          <ul className="med-leyenda">
            {colores.map((c) => (
              <li key={c.nombre}>
                <span className="med-punto" style={{ background: c.color }} />
                {capital(c.nombre)} <strong>{c.texto}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
      <dl className="med-datos">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt>{etiqueta}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>
      <p className="med-nota">{NOTA_MEDICION}</p>
    </div>
  );
};

export default MedicionImagen;
