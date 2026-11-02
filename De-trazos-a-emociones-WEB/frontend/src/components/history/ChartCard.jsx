import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import './ChartCard.css';
import { emotionVisual, formatFechaCorta, formatFechaHora, formatHora } from '../../utils/emociones';
import { NIVELES, puntosClima, resumenClima, ventanaPeriodo, moverPeriodo, etiquetaPeriodo, marcasEje, promediosClima } from '../../utils/clima';

// Clima emocional: cada análisis es un punto con el color y el ícono de su
// emoción, ubicado en el tiempo. Arriba las emociones más agradables, abajo las
// más difíciles; la distancia a la línea del centro es la intensidad. Se ve todo
// el historial o un año, mes, semana o día: las flechas pasan de periodo y un
// clic en una fecha del eje se acerca a ella. Clic en un punto abre el análisis.
const X0 = 130, X1 = 588;
const CENTRO = 112, PASO = 30; // intensidad 3 -> 90 px del centro
const MUCHOS = 40; // con más puntos se dibujan chicos, con una línea de promedio
const ICONO_TENDENCIA = { mejora: TrendingUp, baja: TrendingDown, estable: Minus };
const NIVEL = { baja: 1, media: 2, alta: 3 };

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const inicioDia = (t) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const ChartCard = ({ sessions = [], activeChildName = '', onSelect }) => {
  const [nivel, setNivel] = useState('todo');
  // Una fecha dentro del periodo que se muestra; al empezar, la del último análisis.
  const [ref, setRef] = useState(() => new Date(sessions[0]?.fecha || Date.now()));
  const [activo, setActivo] = useState(null); // índice del punto con el tooltip abierto

  const ventana = ventanaPeriodo(nivel, ref, sessions);
  const etiqueta = etiquetaPeriodo(nivel, ventana);
  const puntos = puntosClima(sessions, ventana);
  const resumen = resumenClima(puntos);
  const n = puntos.length;
  const denso = n > MUCHOS;
  const R = denso ? 5 : 13;

  const desde = ventana.desde.getTime();
  const hasta = ventana.hasta.getTime();
  const xDe = (t) => X0 + ((t - desde) / (hasta - desde)) * (X1 - X0);
  const yDe = (valor) => CENTRO - valor * PASO;

  // Varios dibujos del mismo día que quedarían encimados a la misma altura se
  // juntan en un punto con el número de dibujos (clic: ese día). En la vista de
  // un día, en cambio, se corren a un lado para verlos todos.
  const grupos = [];
  for (const p of puntos) {
    let x = xDe(p.t);
    const y = yDe(p.valor);
    if (!denso && nivel === 'dia') {
      while (grupos.some((g) => g.y === y && Math.abs(g.x - x) < R * 2)) x += R * 2 + 2;
    } else if (!denso) {
      const previo = grupos.findLast((g) => g.y === y && Math.abs(g.x - x) < R * 1.6 && inicioDia(g.items[0].t) === inicioDia(p.t));
      if (previo) {
        previo.items.push(p);
        continue;
      }
    }
    grupos.push({ x, y, items: [p], visual: emotionVisual(p.emocion) });
  }
  const linea = denso
    ? promediosClima(puntos).map((p) => `${xDe(p.t)},${yDe(p.valor)}`)
    : grupos.map((g) => `${g.x},${g.y}`);
  const marcas = marcasEje(nivel, ventana);
  const hayAntes = sessions.some((s) => new Date(s.fecha).getTime() < desde);
  const hayDespues = sessions.some((s) => new Date(s.fecha).getTime() >= hasta);

  // Leyenda: emociones distintas del periodo.
  const leyenda = [];
  const vistos = new Set();
  for (const p of puntos) {
    const k = p.emocion.toLowerCase();
    if (k && !vistos.has(k)) { vistos.add(k); leyenda.push({ emocion: p.emocion, visual: emotionVisual(p.emocion) }); }
  }

  const irA = (nuevoNivel, nuevaRef) => {
    setNivel(nuevoNivel);
    if (nuevaRef) setRef(new Date(nuevaRef));
    setActivo(null);
  };
  const mover = (paso) => {
    setRef(moverPeriodo(nivel, ref, paso));
    setActivo(null);
  };
  const abrir = (g) => {
    if (g.items.length > 1) irA('dia', g.items[0].t);
    else if (onSelect) onSelect(g.items[0].analisis);
  };
  const conTeclado = (accion) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); accion(); }
  };
  const IconoTendencia = resumen ? ICONO_TENDENCIA[resumen.tipo] : null;
  const clave = `${nivel}-${desde}`; // reinicia las animaciones al cambiar de periodo

  return (
    <div className="dashboard-card chart-card">
      <div className="card-header">
        <div>
          <div className="card-label">Evolución temporal</div>
          <div className="card-title">Clima emocional — {activeChildName || 'este niño'}</div>
        </div>
        <div className="clima-periodo" role="group" aria-label="Periodo">
          {NIVELES.map(([valor, label]) => (
            <button key={valor} type="button" className={nivel === valor ? 'activo' : ''} aria-pressed={nivel === valor} onClick={() => irA(valor)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {sessions.length < 2 ? (
        <div className="chart-wrap clima-vacio">
          Se necesitan al menos 2 análisis de este niño para ver cómo cambia su clima emocional.
        </div>
      ) : (
        <>
          <div className="clima-nav">
            {nivel !== 'todo' && (
              <button type="button" className="clima-flecha" onClick={() => mover(-1)} disabled={!hayAntes} aria-label="Periodo anterior">
                <ChevronLeft size={16} />
              </button>
            )}
            <span className="clima-etiqueta">{etiqueta}</span>
            {nivel !== 'todo' && (
              <button type="button" className="clima-flecha" onClick={() => mover(1)} disabled={!hayDespues} aria-label="Periodo siguiente">
                <ChevronRight size={16} />
              </button>
            )}
            <span className="clima-cuenta">{n === 1 ? '1 dibujo' : `${n} dibujos`}</span>
          </div>

          {n === 0 ? (
            <div className="chart-wrap clima-vacio">
              No hay dibujos en este periodo. Usa las flechas para buscar otro o vuelve a «Todo».
            </div>
          ) : (
            <div className="chart-wrap">
              <div className="clima-lienzo" onPointerLeave={() => setActivo(null)}>
                <svg viewBox="0 0 620 236" className="chart-svg-wrap" role="img" aria-label={`Clima emocional, ${etiqueta}: ${n === 1 ? '1 dibujo' : `${n} dibujos`}`}>
                  {/* Zonas: agradable arriba, difícil abajo. Colores por style (variables
                      CSS) para que sigan el tema; los atributos SVG no aceptan var(). */}
                  <rect x="112" y="16" width="492" height={CENTRO - 16} rx="10" className="clima-zona agradable" />
                  <rect x="112" y={CENTRO} width="492" height={CENTRO - 16} rx="10" className="clima-zona dificil" />
                  <line x1="112" y1={CENTRO} x2="604" y2={CENTRO} className="clima-centro" />
                  {marcas.map((m, i) => (
                    <line key={`g-${i}`} x1={xDe(m.t)} y1="16" x2={xDe(m.t)} y2={CENTRO * 2 - 16} className="clima-guia" />
                  ))}

                  <text x="100" y="34" textAnchor="end" className="clima-eje">Más agradable</text>
                  <text x="100" y={CENTRO + 4} textAnchor="end" className="clima-eje">Neutral</text>
                  <text x="100" y="198" textAnchor="end" className="clima-eje">Más difícil</text>

                  {linea.length > 1 && (
                    <polyline key={`l-${clave}`} points={linea.join(' ')} className={`clima-linea${denso ? ' promedio' : ''}`} pathLength="1000" />
                  )}

                  {grupos.map((g, i) => {
                    const varios = g.items.length > 1;
                    const p = g.items[0];
                    return (
                      <g
                        key={`${p.analisis._id || i}-${clave}`}
                        className={`clima-punto${denso ? ' chico' : ''}`}
                        style={{ '--emo': g.visual.color, animationDelay: `${Math.min(0.25 + i * 0.05, 1.4)}s` }}
                        role={varios || onSelect ? 'button' : undefined}
                        tabIndex={varios || onSelect ? 0 : undefined}
                        aria-label={varios
                          ? `${g.items.length} dibujos el ${formatFechaCorta(p.fecha)}. Clic para ver ese día`
                          : `${formatFechaHora(p.fecha)}: ${p.emocion}, intensidad ${p.intensidad}`}
                        onClick={() => abrir(g)}
                        onKeyDown={conTeclado(() => abrir(g))}
                        onPointerEnter={() => setActivo(i)}
                        onFocus={() => setActivo(i)}
                        onBlur={() => setActivo(null)}
                      >
                        <circle cx={g.x} cy={g.y} r={R} />
                        {!denso && <g.visual.Icono x={g.x - 7.5} y={g.y - 7.5} width="15" height="15" strokeWidth="2.2" />}
                        {varios && (
                          <g className="clima-cuantos">
                            <circle cx={g.x + 11} cy={g.y - 11} r="7.5" />
                            <text x={g.x + 11} y={g.y - 8}>{g.items.length}</text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {marcas.map((m, i) => (
                    <text
                      key={`m-${i}`}
                      x={xDe(m.t)}
                      y="226"
                      textAnchor="middle"
                      className={`clima-fecha${m.zoom ? ' zoom' : ''}`}
                      role={m.zoom ? 'button' : undefined}
                      tabIndex={m.zoom ? 0 : undefined}
                      onClick={m.zoom ? () => irA(m.zoom.nivel, m.zoom.ref) : undefined}
                      onKeyDown={m.zoom ? conTeclado(() => irA(m.zoom.nivel, m.zoom.ref)) : undefined}
                    >
                      {m.texto}
                    </text>
                  ))}
                </svg>

                {/* Tooltip del punto (HTML sobre el SVG, en % del viewBox). */}
                {activo !== null && grupos[activo] && (() => {
                  const g = grupos[activo];
                  const p = g.items[0];
                  const x = (g.x / 620) * 100;
                  const abajo = g.y < 90;
                  const desplazar = x < 22 ? '-12%' : x > 78 ? '-88%' : '-50%';
                  return (
                    <div
                      className={`clima-tooltip ${abajo ? 'abajo' : ''}`}
                      style={{ left: `${x}%`, top: `${(g.y / 236) * 100}%`, '--emo': g.visual.color, '--emo-bg': g.visual.bg, '--desplazar': desplazar }}
                      role="tooltip"
                    >
                      {g.items.length > 1 ? (
                        <>
                          <div className="clima-tooltip-fecha">{g.items.length} dibujos · {formatFechaCorta(p.fecha)}</div>
                          <ul className="clima-tooltip-lista">
                            {g.items.slice(0, 5).map((it, k) => (
                              <li key={k}>{formatHora(it.fecha)} · {capital(it.emocion)} ({it.intensidad})</li>
                            ))}
                            {g.items.length > 5 && <li>y {g.items.length - 5} más</li>}
                          </ul>
                          <div className="clima-tooltip-ver">Clic para ver ese día <ArrowRight size={12} /></div>
                        </>
                      ) : (
                        <>
                          <div className="clima-tooltip-fecha">{formatFechaHora(p.fecha)}</div>
                          <div className="clima-tooltip-emocion">
                            <span className="clima-tooltip-icono"><g.visual.Icono size={15} /></span>
                            {capital(p.emocion)}
                          </div>
                          <div className="clima-tooltip-intensidad">
                            {[1, 2, 3].map((k) => <span key={k} className={k <= (NIVEL[p.intensidad] || 2) ? 'activo' : ''} />)}
                            <em>Intensidad {p.intensidad}</em>
                          </div>
                          {onSelect && <div className="clima-tooltip-ver">Clic para ver el análisis <ArrowRight size={12} /></div>}
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}

      {resumen && n >= 2 && (
        <div className={`clima-resumen ${resumen.tipo}`}>
          <IconoTendencia size={16} />
          <span>{resumen.texto}</span>
        </div>
      )}

      <div className="emotion-legend">
        {leyenda.length === 0 ? (
          <div className="legend-item" style={{ color: 'var(--muted)' }}>Sin emociones registradas</div>
        ) : (
          leyenda.map((l) => (
            <div className="legend-item" key={l.emocion}>
              <span className="legend-dot" style={{ background: l.visual.color, color: l.visual.bg }}></span>
              {l.emocion}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChartCard;
