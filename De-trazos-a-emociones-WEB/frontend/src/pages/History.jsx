import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, AlertTriangle } from 'lucide-react';
import './History.css';
import { api } from '../api';
import { notificacionesDe, abrirNotificacion } from '../utils/notificaciones';
import { useAnalisisSesion } from '../context/AnalisisSesionContext';

import Sidebar from '../components/layout/Sidebar';
import HistoryChildBar from '../components/history/HistoryChildBar';
import ChartCard from '../components/history/ChartCard';
import SummaryCard from '../components/history/SummaryCard';
import StatCards from '../components/history/StatCards';
import SessionsList from '../components/history/SessionsList';
import IndependientesGrid from '../components/history/IndependientesGrid';
import AnalysisDetailModal from '../components/common/AnalysisDetailModal';
import BrandHeader from '../components/common/BrandHeader';
import { contextoDelNino } from '../utils/contextoNino';

const INDEP = '__independientes__';

const nombreDe = (it) => (it.contexto_nino?.nombre || '').trim() || 'Sin nombre';

// Niño que se muestra: el pedido (por ejemplo, desde una notificación) si
// existe; si no, el actual si sigue existiendo; si no, el primero.
const elegirNino = (data, pedido, actual) => {
  const nombres = [];
  let indep = false;
  for (const it of data) {
    if (it.independiente) { indep = true; continue; }
    const n = nombreDe(it);
    if (!nombres.includes(n)) nombres.push(n);
  }
  if (pedido && nombres.includes(pedido)) return pedido;
  if (actual && (actual === INDEP ? indep : nombres.includes(actual))) return actual;
  return nombres[0] || (indep ? INDEP : '');
};

const History = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { precargarContexto, nuevaSesion } = useAnalisisSesion();
  // Si ya se trajeron en esta sesión, se muestran al instante mientras llegan los actuales.
  const [historyData, setHistoryData] = useState(() => api.analisisGuardados() || []);
  const [activeChild, setActiveChild] = useState(() => elegirNino(api.analisisGuardados() || [], location.state?.nino));
  const [loading, setLoading] = useState(() => !api.analisisGuardados());
  const [detalle, setDetalle] = useState(null);

  // Volver a entrar con otro niño pedido estando ya en el Historial.
  const [visita, setVisita] = useState(location.key);
  if (visita !== location.key) {
    setVisita(location.key);
    if (location.state?.nino) setActiveChild(location.state.nino);
  }

  // Refresco simple (tras asignar un independiente). No cambia el niño activo.
  const recargar = async () => {
    try {
      const data = await api.getAnalisis();
      setHistoryData(data);
    } catch (err) {
      console.error('Error recargando historial:', err);
    }
  };

  useEffect(() => {
    const cargarInicial = async () => {
      try {
        const data = await api.getAnalisis();
        setHistoryData(data);
        setActiveChild((actual) => elegirNino(data, null, actual));
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    cargarInicial();
  }, []);

  // Niños y existencia de independientes derivados de los datos (se actualizan solos).
  const { children, hayIndependientes } = useMemo(() => {
    const map = new Map();
    let indep = false;
    for (const item of historyData) {
      if (item.independiente) { indep = true; continue; }
      const name = (item.contexto_nino?.nombre || '').trim() || 'Sin nombre';
      if (!map.has(name)) map.set(name, { ...(item.contexto_nino || {}), nombre: name });
    }
    return { children: [...map.values()], hayIndependientes: indep };
  }, [historyData]);

  const esIndep = activeChild === INDEP;

  const activeSessions = historyData.filter(item => {
    if (esIndep) return item.independiente === true;
    if (item.independiente) return false;
    const name = (item.contexto_nino?.nombre || '').trim() || 'Sin nombre';
    return name === activeChild;
  });

  const activeChildName = esIndep ? 'Dibujos independientes' : activeChild;

  // «Señal para acompañar» del niño (utils/alerta.js), compacta: se despliega en
  // la campana de notificaciones. No aplica a dibujos independientes.
  const avisoSenal = esIndep ? null : notificacionesDe(activeSessions).find((n) => n.tipo === 'senal');

  const handleDeleted = (id) => {
    setHistoryData(prev => prev.filter(a => a._id !== id));
    setDetalle(prev => (prev && prev._id === id ? null : prev));
  };

  const handleActualizado = (id, nuevoResultado, contexto) => {
    const cambios = { resultado_ia: nuevoResultado, analizado_sin_contexto: false, ...(contexto ? { contexto_nino: contexto } : {}) };
    setHistoryData(prev => prev.map(a => (a._id === id ? { ...a, ...cambios } : a)));
    setDetalle(prev => (prev && prev._id === id ? { ...prev, ...cambios } : prev));
  };

  return (
    <div className="history-wrapper">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>

      <Sidebar active="history" />

      <main className="main">
        <BrandHeader />

        <div className="topbar" data-tour="hist">
          <div>
            <div className="page-title">Historial <span>emocional</span></div>
          </div>
          <div className="topbar-right">
            {avisoSenal && (
              <button
                type="button"
                className="senal-chip"
                onClick={() => abrirNotificacion(avisoSenal.id)}
                title={`Ver la señal para acompañar a ${activeChildName}`}
                aria-label={`Señal para acompañar a ${activeChildName}`}
              >
                <AlertTriangle size={16} />
                <span className="senal-chip-texto">Señal para acompañar</span>
              </button>
            )}
            <button
              className="btn-new"
              onClick={() => {
                // El contexto más completo del niño (no solo el del último análisis).
                const contexto = !esIndep && activeSessions.length ? contextoDelNino(activeSessions) : null;
                if (contexto) precargarContexto(contexto); else nuevaSesion();
                navigate('/app');
              }}
            >
              <Plus size={16} />
              Nuevo análisis
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{padding: '20px', color: 'var(--muted)'}}>Cargando historial...</div>
        ) : (
          <>
            <HistoryChildBar
              childrenList={children}
              activeChild={activeChild}
              setActiveChild={setActiveChild}
              hayIndependientes={hayIndependientes}
              independientesKey={INDEP}
            />

            {esIndep ? (
              <IndependientesGrid
                sessions={activeSessions}
                ninos={children}
                onSelect={setDetalle}
                onDeleted={handleDeleted}
                onAsignado={recargar}
              />
            ) : (
              <>
                <div className="grid-top">
                  <ChartCard key={activeChildName} sessions={activeSessions} activeChildName={activeChildName} onSelect={setDetalle} />
                  <SummaryCard sessions={activeSessions} />
                </div>

                <StatCards sessions={activeSessions} />

                <SessionsList sessions={activeSessions} activeChildName={activeChildName} onDeleted={handleDeleted} onSelect={setDetalle} />
              </>
            )}
          </>
        )}
      </main>

      {detalle && (
        <AnalysisDetailModal
          analisis={detalle}
          analisisDelNino={historyData}
          onClose={() => setDetalle(null)}
          onActualizado={handleActualizado}
          onDesasignado={() => { recargar(); setDetalle(null); }}
        />
      )}
    </div>
  );
};

export default History;
