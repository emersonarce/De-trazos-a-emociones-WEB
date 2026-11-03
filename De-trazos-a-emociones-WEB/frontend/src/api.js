import { API_URL } from "./config";
import { limpiarResultadoIA } from "./utils/textoIA";

/* =========================
   MANEJO DE SESIÓN
========================= */

const limpiarSesion = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  descartarCacheAnalisis();
};

/* =========================
   CACHÉ DE LOS ANÁLISIS
   La página y la campana de avisos piden la lista al mismo tiempo, y cada
   pantalla la vuelve a pedir: así sale una sola petición a la vez y la pantalla
   siguiente puede mostrar al instante lo que ya había mientras llega lo nuevo.
   Cualquier cambio en los análisis la descarta y lo avisa con un evento.
========================= */

export const EVENTO_ANALISIS_CAMBIARON = "analisis:cambiaron";
let analisisCache = null; // { token, datos }
let analisisEnCurso = null; // { token, promesa }
let versionCache = 0; // una lectura que empezó antes de un cambio no se guarda

function descartarCacheAnalisis() {
  versionCache++;
  analisisCache = null;
  analisisEnCurso = null;
}

// La sesión dejó de ser válida: limpiamos y mandamos al login obligatorio.
const forzarLogin = () => {
  limpiarSesion();
  if (window.location.pathname !== "/login") {
    window.location.replace("/login?expirado=1");
  }
};

// Decodifica el payload del JWT y comprueba que exista y no haya expirado.
export const tokenVigente = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return true; // sin exp lo tratamos como vigente
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// fetch autenticado: agrega el Bearer y, ante un 401/403, cierra la sesión.
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  // Guardar, borrar, reanalizar…: la caché se descarta antes (una lectura en
  // curso ya no vale) y después (por si alguna empezó durante el cambio).
  const cambiaAnalisis =
    (options.method || "GET").toUpperCase() !== "GET" && /\/(analisis|analizar-imagen)/.test(url);
  if (cambiaAnalisis) descartarCacheAnalisis();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (cambiaAnalisis) {
    descartarCacheAnalisis();
    window.dispatchEvent(new Event(EVENTO_ANALISIS_CAMBIARON));
  }

  // Solo el 401 (token ausente, inválido o expirado) cierra la sesión. El 403
  // es "no tienes permiso para esto" y NO debe desloguear: el llamador muestra
  // el mensaje del backend.
  if (response.status === 401) {
    forzarLogin();
    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  }

  return response;
};

// Lee la respuesta como JSON; si el servidor devolvió algo que no es JSON
// (por ejemplo una página HTML de error 404 porque el backend está
// desactualizado o caído), da un mensaje claro en vez de un error de parseo.
const jsonSeguro = async (response) => {
  try {
    return await response.json();
  } catch {
    throw new Error(
      `El servidor respondió de forma inesperada (código ${response.status}). ` +
        'Verifica que el backend esté corriendo y actualizado.'
    );
  }
};

export const api = {
  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.error || data.message || "Error al registrarse");
    }

    return data;
  },

  login: async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.error || data.message || "Error al iniciar sesión");
    }

    return data;
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  getAnalisis: async () => {
    const token = localStorage.getItem("token");
    if (analisisEnCurso && analisisEnCurso.token === token) return analisisEnCurso.promesa;
    const version = versionCache;

    const promesa = (async () => {
      const response = await authFetch(`${API_URL}/analisis`);

      const data = await jsonSeguro(response);

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener análisis");
      }

      // Textos de la IA limpios para todas las pantallas (análisis guardados
      // antes de que el backend los limpiara: caracteres en chino, "Melancolia alta"…).
      return Array.isArray(data)
        ? data.map((a) =>
            a && a.resultado_ia && typeof a.resultado_ia === "object"
              ? { ...a, resultado_ia: limpiarResultadoIA(a.resultado_ia) }
              : a
          )
        : data;
    })();

    analisisEnCurso = { token, promesa };
    try {
      const datos = await promesa;
      if (version === versionCache) analisisCache = { token, datos };
      return datos;
    } finally {
      if (analisisEnCurso && analisisEnCurso.promesa === promesa) analisisEnCurso = null;
    }
  },

  // Los últimos análisis traídos en esta sesión, o null: para pintar una
  // pantalla al instante mientras getAnalisis trae los actuales.
  analisisGuardados: () => {
    const token = localStorage.getItem("token");
    return analisisCache && analisisCache.token === token ? analisisCache.datos : null;
  },

  analizarImagen: async (formData, signal) => {
    const response = await authFetch(`${API_URL}/analizar-imagen`, {
      method: "POST",
      body: formData,
      signal,
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.error || "Error al analizar la imagen");
    }

    return data;
  },

  eliminarAnalisis: async (id) => {
    const response = await authFetch(`${API_URL}/analisis/${id}`, {
      method: "DELETE",
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.error || "Error al eliminar el análisis");
    }

    return data;
  },

  guardarAnalisis: async (payload) => {
    const response = await authFetch(`${API_URL}/analisis/guardar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.error || "Error al guardar el análisis");
    }

    return data;
  },

  asignarAnalisis: async (id, contexto_nino) => {
    const response = await authFetch(`${API_URL}/analisis/${id}/asignar`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contexto_nino }),
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.error || "Error al asignar el análisis");
    }

    return data;
  },

  desasignarAnalisis: async (id) => {
    const response = await authFetch(`${API_URL}/analisis/${id}/desasignar`, {
      method: "PATCH",
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.error || "Error al desasignar el análisis");
    }

    return data;
  },

  // contexto (opcional): el contexto del niño revisado o editado antes de reanalizar.
  reanalizar: async (id, contexto) => {
    const response = await authFetch(`${API_URL}/analisis/${id}/reanalizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contexto ? { contexto_nino: contexto } : {}),
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.error || "Error al reanalizar");
    }

    return data;
  },

  descartarAnalisis: async (imagen) => {
    await authFetch(`${API_URL}/analisis/descartar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imagen }),
    });
  },

  eliminarNino: async (ids) => {
    const response = await authFetch(`${API_URL}/analisis/eliminar-varios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids }),
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.error || "Error al eliminar el niño");
    }

    return data;
  },

  // --- Administración (solo admin) ---

  getSolicitudes: async (estado = "pendiente") => {
    const response = await authFetch(`${API_URL}/admin/usuarios?estado=${estado}`);

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.message || "Error al obtener las solicitudes");
    }

    return data;
  },

  resolverSolicitud: async (id, accion) => {
    const response = await authFetch(`${API_URL}/admin/usuarios/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accion }),
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.message || "Error al actualizar la solicitud");
    }

    return data;
  },

  eliminarUsuario: async (id) => {
    const response = await authFetch(`${API_URL}/admin/usuarios/${id}`, {
      method: "DELETE",
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.message || "Error al eliminar la cuenta");
    }

    return data;
  },

  gestionarUsuario: async (id, cambios) => {
    const response = await authFetch(`${API_URL}/admin/usuarios/${id}/gestion`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cambios),
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.message || "Error al actualizar el usuario");
    }

    return data;
  },

  // --- Perfil / cuenta ---

  getPerfil: async () => {
    const response = await authFetch(`${API_URL}/perfil/me`);

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.message || "Error al obtener el perfil");
    }

    return data;
  },

  subirFotoPerfil: async (file) => {
    const formData = new FormData();
    formData.append("foto", file);

    const response = await authFetch(`${API_URL}/perfil/foto`, {
      method: "POST",
      body: formData,
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.message || "Error al subir la foto");
    }

    return data;
  },

  // Descarga la foto como blob (un <img> no puede mandar el token). Un 404
  // (sin foto) devuelve null; no fuerza el cierre de sesión como authFetch.
  fetchFotoPerfil: async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/perfil/foto`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return null;
      return await response.blob();
    } catch {
      return null;
    }
  },

  cambiarPassword: async (actual, nueva) => {
    const response = await authFetch(`${API_URL}/perfil/cambiar-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ actual, nueva }),
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.message || "Error al cambiar la contraseña");
    }

    return data;
  },

  eliminarCuenta: async () => {
    const response = await authFetch(`${API_URL}/perfil`, {
      method: "DELETE",
    });

    const data = await jsonSeguro(response);

    if (!response.ok) {
      throw new Error(data.message || "Error al eliminar la cuenta");
    }

    return data;
  },

  logout: () => {
    limpiarSesion();
  },
};
