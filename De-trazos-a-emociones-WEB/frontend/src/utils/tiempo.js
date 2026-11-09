// Duración legible: "45 s", "58 min 12 s", "1 h 3 min".
// Devuelve null si no hay dato (p. ej. análisis guardados antes de medirse).
export const formatDuracion = (ms) => {
  if (!Number.isFinite(ms) || ms < 0) return null;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const min = Math.floor(s / 60);
  const seg = s % 60;
  if (min < 60) return seg ? `${min} min ${seg} s` : `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};
