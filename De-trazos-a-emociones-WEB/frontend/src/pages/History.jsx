import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle } from 'lucide-react';
import './History.css';
import { api } from '../api';
import { senalParaAcompanar, textoSenal } from '../utils/alerta';
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

const History = () => {
  const navigate = useNavigate();
  const { precargarContexto, nuevaSesion } = useAnalisisSesion();
  const [historyData, setHistoryData] = useState([]);
  const [activeChild, setActiveChild] = useState('');
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState(null);

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
        const nombres = [];
        let indep = false;
        for (const it of data) {
          if (it.independiente) { indep = true; continue; }
          const n = (it.contexto_nino?.nombre || '').trim() || 'Sin nombre';
          if (!nombres.includes(n)) nombres.push(n);
        }
        if (nombres.length) setActiveChild(nombres[0]);
        else if (indep) setActiveChild(INDEP);
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

  // Regla de alerta orientativa (utils/alerta.js); no aplica a dibujos independientes.
  const senal = esIndep ? null : senalParaAcompanar(activeSessions);

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

        {senal && (
          <div className="alert-banner">
            <div className="alert-icon">
              <AlertTriangle color="#f87171" size={20} />
            </div>
            <div className="alert-text">
              <div className="alert-title">Señal para acompañar — {activeChildName}</div>
              <div className="alert-sub">{textoSenal(senal, activeChildName)} Podría ser útil conversar con calma o, si lo consideras, con un profesional. Esto es orientativo, no un diagnóstico.</div>
            </div>
          </div>
        )}

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
                  <ChartCard sessions={activeSessions} activeChildName={activeChildName} onSelect={setDetalle} />
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
