import { useState, useEffect, useRef } from 'react';
import { FileDown, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { api } from '../api';
import { exportarReporte } from '../utils/exportarPdf';
import { emocionPredominante, emotionVisual } from '../utils/emociones';
import { NIVELES_REPORTE, TITULO_REPORTE, ventanaReporte, analisisDelPeriodo, fechaVecina, textoPeriodo, archivoReporte, ymd, deYmd } from '../utils/periodos';
import BrandHeader from '../components/common/BrandHeader';
import Sidebar from '../components/layout/Sidebar';
import { puedePdf } from '../utils/permisos';
import './Reportes.css';
import { useAvisos } from '../context/AvisosContext';

// Los reportes son de los niños: sin los dibujos independientes.
const deNinos = (data) => (data || []).filter((a) => !a.independiente);

// Niños con sus análisis; el contexto es el del primero de la lista (la API
// los manda del más reciente al más antiguo).
const porNino = (analisis) => {
  const map = new Map();
  for (const a of analisis) {
    const nombre = (a.contexto_nino?.nombre || '').trim() || 'Sin nombre';
    if (!map.has(nombre)) map.set(nombre, { nombre, contexto: a.contexto_nino || {}, analisis: [] });
    map.get(nombre).analisis.push(a);
  }
  return [...map.values()];
};

const Reportes = () => {
  const { avisarError } = useAvisos();
  // Si ya se trajeron en esta sesión, se muestran al instante mientras llegan los actuales.
  const [analisis, setAnalisis] = useState(() => deNinos(api.analisisGuardados()));
  const [cargando, setCargando] = useState(() => !api.analisisGuardados());
  const [generando, setGenerando] = useState(false);
  const [nivel, setNivel] = useState('todo');
  const [ref, setRef] = useState(null); // una fecha del periodo; al empezar, la del último análisis
  const calendario = useRef(null);

  useEffect(() => {
    let activo = true;
    const t = setTimeout(async () => {
      try {
        const data = await api.getAnalisis();
        if (activo) setAnalisis(deNinos(data));
      } catch {
        /* ignore */
      } finally {
        if (activo) setCargando(false);
      }
    }, 0);
    return () => {
      activo = false;
      clearTimeout(t);
    };
  }, []);

  const tiempos = analisis.map((a) => new Date(a.fecha).getTime()).filter(Number.isFinite);
  const primero = tiempos.length ? new Date(Math.min(...tiempos)) : new Date();
  const ultimo = tiempos.length ? new Date(Math.max(...tiempos)) : new Date();
  const fechaRef = ref || ultimo;
  const ventana = ventanaReporte(nivel, fechaRef);
  const ninos = porNino(analisisDelPeriodo(analisis, ventana));
  const total = ninos.reduce((s, n) => s + n.analisis.length, 0);
  const periodo = textoPeriodo(nivel, ventana, analisis);
  const anterior = fechaVecina(analisis, ventana, -1);
  const siguiente = fechaVecina(analisis, ventana, 1);
  const titulo = TITULO_REPORTE[nivel];

  // El nombre del periodo abre el calendario para ir a cualquier fecha.
  const abrirCalendario = () => {
    try {
      calendario.current?.showPicker();
    } catch {
      calendario.current?.focus();
    }
  };

  const descargar = async () => {
    if (!ninos.length || generando) return;
    setGenerando(true);
    try {
      await exportarReporte(ninos, { nivel, periodo, nombreArchivo: archivoReporte(nivel, ventana) });
    } catch (e) {
      avisarError('No se pudo generar el reporte', e);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="rep-page">
      <Sidebar active="reportes" />
      <div className="rep-container">
        <BrandHeader />

        <h1 className="rep-title">Reportes</h1>
        <p className="rep-sub">
          {puedePdf()
            ? 'Elige el periodo y descarga el reporte en PDF, con las fechas de cada análisis.'
            : 'Elige el periodo para ver el resumen de cada niño.'}
        </p>

        {cargando ? (
          <div className="rep-empty">Cargando…</div>
        ) : analisis.length === 0 ? (
          <div className="rep-empty">
            Aún no tienes niños con análisis. Realiza un análisis con contexto para poder generar un reporte.
          </div>
        ) : (
          <>
            <section className="rep-periodo" aria-label="Periodo del reporte">
              <div className="rep-periodo-label">Periodo del reporte</div>
              <div className="rep-periodo-fila">
                <div className="rep-niveles" role="group" aria-label="Periodo">
                  {NIVELES_REPORTE.map(([valor, label]) => (
                    <button key={valor} type="button" className={nivel === valor ? 'activo' : ''} aria-pressed={nivel === valor} onClick={() => setNivel(valor)}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="rep-nav">
                  {nivel === 'todo' ? (
                    <span className="rep-fecha fija">
                      <CalendarDays size={16} /> {periodo}
                    </span>
                  ) : (
                    <>
                      <button type="button" className="rep-flecha" onClick={() => setRef(anterior)} disabled={!anterior} title="Periodo anterior con análisis">
                        <ChevronLeft size={16} />
                      </button>
                      <button type="button" className="rep-fecha" onClick={abrirCalendario} title="Elegir otra fecha">
                        <CalendarDays size={16} /> {periodo}
                      </button>
                      <button type="button" className="rep-flecha" onClick={() => setRef(siguiente)} disabled={!siguiente} title="Periodo siguiente con análisis">
                        <ChevronRight size={16} />
                      </button>
                      <input
                        ref={calendario}
                        type="date"
                        className="rep-calendario"
                        tabIndex={-1}
                        aria-hidden="true"
                        value={ymd(fechaRef)}
                        min={ymd(primero)}
                        max={ymd(ultimo)}
                        onChange={(e) => {
                          const d = deYmd(e.target.value);
                          if (d) setRef(d);
                        }}
                      />
                    </>
                  )}
                </div>

                <span className="rep-cuenta">
                  {total} análisis · {ninos.length === 1 ? '1 niño' : `${ninos.length} niños`}
                </span>
              </div>
            </section>

            {ninos.length === 0 ? (
              <div className="rep-empty">
                No hay análisis en este periodo. Usa las flechas para ir al anterior o al siguiente con análisis.
              </div>
            ) : (
              <div className="rep-list">
                {ninos.map((n) => {
                  const emo = emocionPredominante(n.analisis);
                  const v = emotionVisual(emo || '');
                  return (
                    <div className="rep-card" key={n.nombre}>
                      <div className="rep-card-emoji" style={{ background: v.bg }}>
                        <v.Icono size={22} style={{ color: v.color }} />
                      </div>
                      <div className="rep-card-info">
                        <div className="rep-card-name">{n.nombre}</div>
                        <div className="rep-card-meta">
                          {n.analisis.length} análisis · {emo || 'sin datos'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {puedePdf() && (
              <button className="rep-download" onClick={descargar} disabled={generando || !ninos.length}>
                <FileDown size={18} /> {generando ? 'Generando PDF…' : `Descargar ${titulo.toLowerCase()} (PDF)`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reportes;
