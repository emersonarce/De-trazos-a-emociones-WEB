import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import './Dashboard.css';
import { api } from '../api';
import { emotionVisual, emocionPredominante, infoCumple } from '../utils/emociones';

import Sidebar from '../components/layout/Sidebar';
import ChildSwitcher from '../components/dashboard/ChildSwitcher';
import WeeklySummary from '../components/dashboard/WeeklySummary';
import TimelineSection from '../components/dashboard/TimelineSection';
import ActivitiesSection from '../components/dashboard/ActivitiesSection';
import ComparisonSection from '../components/dashboard/ComparisonSection';
import AnalysisDetailModal from '../components/common/AnalysisDetailModal';
import BrandHeader from '../components/common/BrandHeader';
import IconoAnimo from '../components/dashboard/IconoAnimo';
import BirthdayBanner from '../components/dashboard/BirthdayBanner';

const Dashboard = () => {
  const location = useLocation();
  // Permite llegar desde "Mis niños" con un niño ya seleccionado.
  const [activeChild, setActiveChild] = useState(location.state?.nino || null);
  const [historyData, setHistoryData] = useState([]);
  const [detalle, setDetalle] = useState(null);

  const recargar = async () => {
    try {
      const data = await api.getAnalisis();
      setHistoryData(data);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => recargar(), 0);
    return () => clearTimeout(t);
  }, []);

  // Agrupar los análisis reales por niño (hoy identificado por el nombre del
  // contexto; en el Paso 4 se reemplazará por un modelo de Niño con ninoId).
  const children = useMemo(() => {
    const map = new Map();
    for (const a of historyData) {
      if (a.independiente) continue; // los dibujos independientes no son niños
      const nombre = (a.contexto_nino?.nombre || '').trim() || 'Sin nombre';
      if (!map.has(nombre)) {
        map.set(nombre, {
          nombre,
          edad: a.contexto_nino?.edad || '',
          fecha_nacimiento: a.contexto_nino?.fecha_nacimiento || '',
          analisis: []
        });
      }
      map.get(nombre).analisis.push(a);
    }
    return [...map.values()];
  }, [historyData]);

  const handleNinoEliminado = (ids) => {
    const borrados = new Set(ids);
    setHistoryData((prev) => prev.filter((a) => !borrados.has(a._id)));
  };

  // El niño seleccionado por defecto es el primero; al hacer clic se actualiza activeChild.
  const selected = children.find((c) => c.nombre === activeChild) || children[0] || null;
  const nombreUsuario = JSON.parse(localStorage.getItem('user') || '{}').nombre || 'Usuario';
  const emocionSel = selected ? emocionPredominante(selected.analisis) : null;
  const visualSel = emotionVisual(children.length > 0 ? emocionSel || '' : '');

  // Cumpleaños de hoy o de los próximos días (DIAS_AVISO_CUMPLE) entre los niños registrados.
  const cumples = children
    .map((c) => ({ nino: c, cumple: infoCumple(c.fecha_nacimiento) }))
    .filter((x) => x.cumple);

  return (
    <div className="dashboard-container">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <Sidebar active="dashboard" />

      <main className="main">
        <BrandHeader />

        <BirthdayBanner cumples={cumples} />

        {/* WELCOME */}
        <div className="welcome" data-tour="dash">
          <div className="welcome-left">
            <div className="welcome-greeting">
              Hola, {nombreUsuario}
            </div>
            <div className="welcome-title">
              ¿Cómo está <span>{selected?.nombre && selected.nombre !== 'Sin nombre' ? selected.nombre : 'tu niño/a'}</span> hoy?
            </div>
            <div className="welcome-sub">
              {children.length > 0
                ? `Tienes ${children.length} niño(s) registrados.`
                : 'Aún no tienes niños registrados. Realiza un análisis con contexto para comenzar el seguimiento.'}
            </div>
          </div>
          <IconoAnimo visual={visualSel} emocion={children.length > 0 ? emocionSel : null} />
        </div>

        {children.length === 0 ? (
          <div className="dashboard-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
            Todavía no hay niños registrados. Usa <strong>Agregar niño</strong> o <strong>Nuevo análisis</strong> para comenzar. Los dibujos analizados de forma independiente se ven en el Historial.
          </div>
        ) : (
          <>
            <ChildSwitcher ninos={children} activeChild={selected?.nombre} setActiveChild={setActiveChild} onDeleted={handleNinoEliminado} />

            <WeeklySummary child={selected} />

            <TimelineSection child={selected} onSelect={setDetalle} />

            <div className="grid-bottom">
              <ActivitiesSection key={`act-${selected?.nombre}`} child={selected} />
              <ComparisonSection key={`cmp-${selected?.nombre}`} child={selected} onSelect={setDetalle} />
            </div>
          </>
        )}
      </main>

      {detalle && (
        <AnalysisDetailModal
          analisis={detalle}
          analisisDelNino={historyData}
          onClose={() => setDetalle(null)}
          onActualizado={(id, resultado, contexto) => {
            const cambios = { resultado_ia: resultado, analizado_sin_contexto: false, ...(contexto ? { contexto_nino: contexto } : {}) };
            setHistoryData((prev) => prev.map((a) => (a._id === id ? { ...a, ...cambios } : a)));
            setDetalle((prev) => (prev && prev._id === id ? { ...prev, ...cambios } : prev));
          }}
          onDesasignado={() => { recargar(); setDetalle(null); }}
        />
      )}
    </div>
  );
};

export default Dashboard;
