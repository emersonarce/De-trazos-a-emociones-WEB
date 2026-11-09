/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useRef } from 'react';
import { api } from '../api';
import { useAvisos } from './AvisosContext';
import { formatDuracion } from '../utils/tiempo';
import { limpiarTextoIA } from '../utils/textoIA';
import { nombreEmocion } from '../utils/emociones';
import { normalizarGenero } from '../utils/contextoNino';

const AnalisisSesionContext = createContext(null);
export const useAnalisisSesion = () => useContext(AnalisisSesionContext);

const FORM_VACIO = {
  nombre: '', edad: '', fecha_nacimiento: '', genero: '',
  situacion_actual: '', diagnostico_previo: '', comportamiento: '',
  dibujo_espontaneo: '', comento_mientras: '', tiempo_dibujo: '',
  descripcion_dibujo: ''
};

const KEYWORDS = ['alegría', 'tristeza', 'miedo', 'enojo', 'calma', 'ansiedad', 'inseguridad', 'energía', 'amor', 'felicidad', 'ira', 'frustración', 'estrés', 'tranquilidad', 'entusiasmo', 'soledad', 'angustia', 'nerviosismo', 'euforia', 'melancolía'];

const intensityFromText = (text) => {
  const lower = String(text || '').toLowerCase();
  if (lower.includes('alta') || lower.includes('alto')) return 'high';
  if (lower.includes('baja') || lower.includes('bajo') || lower.includes('leve')) return 'low';
  return 'medio';
};
const intensityLabel = (intensity) => ({ low: 'Baja', medio: 'Media', high: 'Alta' }[intensity]);

// Convierte el resultado crudo de la IA en el objeto que consume AnalyzerResult.
function construirResultado(raw, aviso) {
  if (typeof raw === 'string') {
    const lower = raw.toLowerCase();
    const found = [...new Set(KEYWORDS.filter((k) => lower.includes(k)))].slice(0, 6);
    const chips = found.length ? found : ['emoción detectada'];
    let intensity = 'medio';
    if (/intensidad[:\s]*(emocional[:\s]*)?(alta|alto)/i.test(lower) || / alto/.test(lower)) intensity = 'high';
    else if (/intensidad[:\s]*(emocional[:\s]*)?(baja|bajo)/i.test(lower) || / bajo/.test(lower) || / leve/.test(lower)) intensity = 'low';
    const clean = raw.replace(/\*\*/g, '').replace(/#{1,4}\s*/g, '').trim();
    return { chips, intensity, intensityLabel: intensityLabel(intensity), rasgos: [], interpretacion: '', lectura: clean, aviso: aviso || '', simulado: false, duracion: null, rawText: raw };
  }
  const chips = [nombreEmocion(limpiarTextoIA(raw.emocion_predominante)) || 'emoción detectada'];
  const intensity = intensityFromText(raw.intensidad);
  const rasgos = Array.isArray(raw.rasgos_observados) ? raw.rasgos_observados.filter(Boolean).map(limpiarTextoIA) : [];
  return {
    chips,
    intensity,
    intensityLabel: intensityLabel(intensity),
    rasgos,
    interpretacion: raw.interpretacion || '',
    lectura: raw.lectura_orientativa || raw.analisis_completo || 'El modelo no proporcionó un análisis detallado.',
    aviso: aviso || (raw.parseo_incompleto ? 'El modelo no devolvió un JSON completo. Se muestra el texto recuperado; puedes intentar analizar de nuevo.' : ''),
    simulado: raw.simulado === true,
    duracion: formatDuracion(raw.duracion_ms),
    medicion: raw.medicion_imagen || null,
    rawText: JSON.stringify(raw, null, 2),
    jsonObj: raw
  };
}

export function AnalisisSesionProvider({ children }) {
  const { avisarError } = useAvisos();
  const [modo, setModo] = useState('contexto');
  const [ninoConocido, setNinoConocido] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [pendienteGuardar, setPendienteGuardar] = useState(null);
  const [guardadoEstado, setGuardadoEstado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [ninosExistentes, setNinosExistentes] = useState([]);
  const [notificacion, setNotificacion] = useState(null);
  // Momento en que arrancó el análisis; permite que la barra de progreso
  // continúe donde iba aunque se cambie de página y se vuelva.
  const [analisisInicio, setAnalisisInicio] = useState(null);
  // Para poder cancelar el análisis en curso.
  const abortRef = useRef(null);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  const handleRadioChange = (group, value) => setFormData((prev) => ({ ...prev, [group]: value }));

  const ponerArchivo = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
      setError(null);
    }
  };
  const handleFileChange = (e) => ponerArchivo(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); ponerArchivo(e.dataTransfer.files[0]); };
  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
  };

  const cargarNinos = async () => {
    try {
      const data = await api.getAnalisis();
      const map = new Map();
      data.filter((a) => !a.independiente).forEach((a) => {
        const nombre = (a.contexto_nino?.nombre || '').trim();
        if (nombre && !map.has(nombre)) map.set(nombre, a.contexto_nino);
      });
      setNinosExistentes([...map.entries()].map(([nombre, ctx]) => ({ nombre, contexto: ctx })));
    } catch { /* ignora */ }
  };

  // Inicia una sesión nueva (formulario vacío, modo con contexto).
  const nuevaSesion = () => {
    setFormData(FORM_VACIO);
    setNinoConocido(false);
    setModo('contexto');
    setStep(1);
    clearFile();
    setAnalysisResult(null);
    setPendienteGuardar(null);
    setGuardadoEstado(null);
    setError(null);
  };

  // Inicia una sesión con el contexto de un niño existente.
  const precargarContexto = (ctx = {}) => {
    setFormData({
      ...FORM_VACIO,
      nombre: ctx.nombre || '',
      edad: ctx.edad || '',
      fecha_nacimiento: ctx.fecha_nacimiento || '',
      genero: normalizarGenero(ctx.genero),
      situacion_actual: ctx.situacion_actual || '',
      diagnostico_previo: ctx.diagnostico_previo || '',
      comportamiento: ctx.comportamiento || ''
    });
    setNinoConocido(!!ctx.nombre);
    setModo('contexto');
    setStep(1);
    clearFile();
    setAnalysisResult(null);
    setPendienteGuardar(null);
    setGuardadoEstado(null);
    setError(null);
  };

  const cambiarModo = (nuevo) => {
    if (nuevo === modo) return;
    setModo(nuevo);
    clearFile();
    setAnalysisResult(null);
    setPendienteGuardar(null);
    setGuardadoEstado(null);
    setError(null);
    setStep(nuevo === 'solo' ? 2 : 1);
  };

  const analizar = async () => {
    if (!selectedFile) return;
    setError(null);
    setIsAnalyzing(true);
    setAnalisisInicio(Date.now());
    setNotificacion(null);

    const fd = new FormData();
    fd.append('imagen', selectedFile);
    if (modo === 'solo') {
      fd.append('persistir', 'false');
      // La descripción opcional del dibujo también aplica en "solo dibujo".
      if (formData.descripcion_dibujo) fd.append('descripcion_dibujo', formData.descripcion_dibujo);
    } else {
      Object.entries(formData).forEach(([k, v]) => { if (v) fd.append(k, v); });
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await api.analizarImagen(fd, controller.signal);
      if (!data.analisis) throw new Error('La API no devolvió un campo "analisis"');
      setAnalysisResult(construirResultado(data.analisis, data.aviso));
      if (modo === 'solo') {
        // La descripción del dibujo viaja con el análisis para guardarse con él.
        setPendienteGuardar({ imagen: data.imagen, analisis: data.analisis, descripcion: formData.descripcion_dibujo?.trim() || '' });
        setGuardadoEstado(null);
      }
      setStep(3);
      setNotificacion({ nombre: formData.nombre?.trim() || 'el dibujo', ts: Date.now() });
    } catch (err) {
      // Si se canceló, no es un error que mostrar.
      if (err.name !== 'AbortError') {
        setError(err.message + '. Verifica que el backend esté corriendo.');
      }
    } finally {
      abortRef.current = null;
      setIsAnalyzing(false);
    }
  };

  // Cancela el análisis en curso (aborta la petición al backend).
  const cancelarAnalisis = () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = null;
    setIsAnalyzing(false);
    setAnalisisInicio(null);
    setError(null);
  };

  const guardarIndependiente = async () => {
    setGuardando(true);
    try {
      const descripcion = pendienteGuardar.descripcion;
      await api.guardarAnalisis({
        analisis: pendienteGuardar.analisis,
        imagen: pendienteGuardar.imagen,
        independiente: true,
        ...(descripcion ? { contexto_nino: { descripcion_dibujo: descripcion } } : {}),
      });
      setGuardadoEstado('independiente');
      setPendienteGuardar(null);
    } catch (err) { avisarError('No se pudo guardar el análisis', err); } finally { setGuardando(false); }
  };

  const asignarANino = async (nombre) => {
    const nino = ninosExistentes.find((n) => n.nombre === nombre);
    const ctx = nino?.contexto || {};
    setGuardando(true);
    try {
      await api.guardarAnalisis({
        analisis: pendienteGuardar.analisis,
        imagen: pendienteGuardar.imagen,
        independiente: false,
        contexto_nino: {
          nombre, edad: ctx.edad, fecha_nacimiento: ctx.fecha_nacimiento, genero: ctx.genero,
          ...(pendienteGuardar.descripcion ? { descripcion_dibujo: pendienteGuardar.descripcion } : {}),
        }
      });
      setGuardadoEstado('asignado');
      setPendienteGuardar(null);
    } catch (err) { avisarError('No se pudo guardar el análisis en el niño', err); } finally { setGuardando(false); }
  };

  const noGuardar = async () => {
    setGuardando(true);
    try {
      await api.descartarAnalisis(pendienteGuardar.imagen);
      setGuardadoEstado('descartado');
      setPendienteGuardar(null);
    } catch (err) { avisarError('No se pudo descartar el análisis', err); } finally { setGuardando(false); }
  };

  // Al analizar otro dibujo se conserva el contexto del niño (nombre, situación
  // actual, etc.) y solo se limpian los datos propios del dibujo anterior.
  const resetAll = () => {
    clearFile();
    const tieneNino = Boolean(formData.nombre?.trim());
    setFormData(tieneNino
      ? {
          ...FORM_VACIO,
          nombre: formData.nombre,
          edad: formData.edad,
          fecha_nacimiento: formData.fecha_nacimiento,
          genero: formData.genero,
          situacion_actual: formData.situacion_actual,
          diagnostico_previo: formData.diagnostico_previo,
          comportamiento: formData.comportamiento,
        }
      : FORM_VACIO);
    setAnalysisResult(null);
    setPendienteGuardar(null);
    setGuardadoEstado(null);
    setStep(modo === 'solo' ? 2 : 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const value = {
    modo, ninoConocido, step, setStep, formData,
    selectedFile, previewUrl, isAnalyzing, error, analysisResult,
    pendienteGuardar, guardadoEstado, guardando, ninosExistentes, notificacion, analisisInicio,
    handleInputChange, handleRadioChange, handleFileChange, handleDrop, clearFile,
    cargarNinos, nuevaSesion, precargarContexto, cambiarModo, analizar, cancelarAnalisis,
    guardarIndependiente, asignarANino, noGuardar, resetAll, setNotificacion
  };

  return <AnalisisSesionContext.Provider value={value}>{children}</AnalisisSesionContext.Provider>;
}
