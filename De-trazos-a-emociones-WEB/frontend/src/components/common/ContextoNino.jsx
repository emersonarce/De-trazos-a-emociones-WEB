import { useState } from 'react';
import { Pencil, UserRound } from 'lucide-react';
import { filasContexto, OPCIONES, normalizarGenero, opcionDiagnostico } from '../../utils/contextoNino';
import { edadDesde } from '../../utils/emociones';
import CampoDuracion from './CampoDuracion';
import './ContextoNino.css';

const LARGOS = ['Situación actual', 'Diagnóstico previo', 'Descripción del dibujo', 'Comentó mientras dibujaba'];
const capital = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Resumen del contexto del niño (lo que se usa o se usará en el análisis).
export const ContextoResumen = ({ ctx = {}, titulo, subtitulo, onEditar, textoEditar = 'Editar', acciones = null }) => {
  const filas = filasContexto(ctx);
  return (
    <section className="ctx-resumen">
      <header className="ctx-resumen-head">
        <span className="ctx-resumen-icono"><UserRound size={18} /></span>
        <div className="ctx-resumen-titulos">
          <h4>{titulo || `Contexto de ${ctx.nombre || 'el niño'}`}</h4>
          {subtitulo && <p>{subtitulo}</p>}
        </div>
        {onEditar && (
          <button type="button" className="ctx-editar" onClick={onEditar}>
            <Pencil size={14} /> {textoEditar}
          </button>
        )}
      </header>
      {filas.length ? (
        <dl className="ctx-filas">
          {filas.map(([etiqueta, valor]) => (
            <div key={etiqueta} className={`ctx-fila ${LARGOS.includes(etiqueta) ? 'larga' : ''}`}>
              <dt>{etiqueta}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="ctx-vacio">Todavía no hay datos de contexto. {onEditar ? 'Agrégalos con «Editar».' : ''}</p>
      )}
      {acciones && <div className="ctx-acciones">{acciones}</div>}
    </section>
  );
};

const Pildoras = ({ nombre, opciones, valor, onElegir }) => (
  <div className="ctx-pildoras" role="radiogroup">
    {opciones.map((op) => (
      <button
        key={op}
        type="button"
        role="radio"
        aria-checked={valor === op}
        className={valor === op ? 'activa' : ''}
        onClick={() => onElegir(nombre, valor === op ? '' : op)}
      >
        {capital(op)}
      </button>
    ))}
  </div>
);

// Editor compacto del contexto (fecha, edad, género, situación, comportamiento,
// diagnóstico y, si conDibujo, los datos del dibujo). El nombre no se edita:
// identifica al niño en el historial.
export const ContextoEditor = ({ valor = {}, onChange, conDibujo = true }) => {
  const poner = (campo, v) => onChange({ ...valor, [campo]: v });
  const alEscribir = (e) => poner(e.target.name, e.target.value);
  // «Otro» en diagnóstico previo: muestra un campo corto aunque aún esté vacío.
  const [otroDiag, setOtroDiag] = useState(false);
  const diag = opcionDiagnostico(valor.diagnostico_previo);
  const opcionDiag = otroDiag || diag.opcion === 'otro' ? 'otro' : diag.opcion;
  // Edad: si hay fecha de nacimiento se calcula sola; si no, se escribe.
  const conFecha = Boolean(valor.fecha_nacimiento);
  const cambiarFecha = (e) => {
    const calc = edadDesde(e.target.value);
    onChange({ ...valor, fecha_nacimiento: e.target.value, ...(calc != null && { edad: String(calc) }) });
  };
  return (
    <div className="ctx-editor">
      <div className="ctx-grid">
        <label className="ctx-campo">
          <span>Fecha de nacimiento</span>
          <input type="date" name="fecha_nacimiento" value={valor.fecha_nacimiento || ''} onChange={cambiarFecha} max={new Date().toISOString().split('T')[0]} />
        </label>
        <label className="ctx-campo">
          <span>Edad{conFecha && <em className="ctx-calculada"> · calculada</em>}</span>
          <input type="number" name="edad" min="2" max="17" inputMode="numeric" placeholder="Años"
            value={conFecha ? (edadDesde(valor.fecha_nacimiento) ?? '') : (valor.edad || '')}
            onChange={(e) => poner('edad', e.target.value.replace(/\D/g, '').slice(0, 2))}
            readOnly={conFecha} title={conFecha ? 'Se calcula con la fecha de nacimiento' : undefined} />
        </label>
        <label className="ctx-campo">
          <span>Género</span>
          <select name="genero" value={normalizarGenero(valor.genero)} onChange={alEscribir}>
            <option value="">Seleccionar</option>
            {OPCIONES.genero.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </label>
      </div>
      <label className="ctx-campo">
        <span>Situación actual en casa o el colegio</span>
        <textarea name="situacion_actual" rows={3} value={valor.situacion_actual || ''} onChange={alEscribir} placeholder="Ej: cambió de colegio hace un mes" />
      </label>
      <div className="ctx-campo">
        <span>Comportamiento reciente</span>
        <Pildoras nombre="comportamiento" opciones={OPCIONES.comportamiento} valor={valor.comportamiento || ''} onElegir={poner} />
      </div>
      <div className="ctx-campo">
        <span>Diagnóstico previo</span>
        <select aria-label="Diagnóstico previo" value={opcionDiag} onChange={(e) => { setOtroDiag(e.target.value === 'otro'); poner('diagnostico_previo', e.target.value === 'otro' ? '' : e.target.value); }}>
          <option value="">Opcional: seleccionar</option>
          {OPCIONES.diagnostico_previo.map((op) => <option key={op} value={op}>{op}</option>)}
          <option value="otro">Otro</option>
        </select>
        {opcionDiag === 'otro' && (
          <input type="text" name="diagnostico_previo" value={valor.diagnostico_previo || ''} onChange={alEscribir} placeholder="¿Cuál?" maxLength={120} aria-label="Otro diagnóstico previo" />
        )}
      </div>
      {conDibujo && (
        <>
          <label className="ctx-campo">
            <span>Descripción del dibujo</span>
            <textarea name="descripcion_dibujo" rows={2} value={valor.descripcion_dibujo || ''} onChange={alEscribir} placeholder="Opcional: qué representa, quiénes aparecen…" />
          </label>
          <div className="ctx-campo">
            <span>¿El dibujo fue espontáneo o se le pidió?</span>
            <Pildoras nombre="dibujo_espontaneo" opciones={OPCIONES.dibujo_espontaneo} valor={valor.dibujo_espontaneo || ''} onElegir={poner} />
          </div>
          <label className="ctx-campo">
            <span>¿Comentó algo mientras dibujaba?</span>
            <textarea name="comento_mientras" rows={2} value={valor.comento_mientras || ''} onChange={alEscribir} placeholder="Opcional" />
          </label>
          <div className="ctx-campo">
            <span>Tiempo que tardó</span>
            <Pildoras nombre="tiempo_dibujo" opciones={OPCIONES.tiempo_dibujo} valor={valor.tiempo_dibujo || ''} onElegir={poner} />
            <CampoDuracion
              className="ctx-minutos"
              valor={valor.tiempo_dibujo || ''}
              onCambiar={(v) => poner('tiempo_dibujo', v)}
            />
          </div>
        </>
      )}
    </div>
  );
};
