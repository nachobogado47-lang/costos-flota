/**
 * Cliente del backend. Si no hay API disponible (dev sin `vercel dev`, o la
 * función devuelve error) la app sigue andando 100% contra localStorage y
 * el estado se sincroniza cuando el backend vuelve.
 */

const ENDPOINT = "/api/state";
const TIMEOUT_MS = 8000;

async function withTimeout(promise, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/** Trae el estado completo desde Postgres. Devuelve null si el backend no responde. */
export async function fetchState() {
  try {
    const res = await withTimeout(
      (signal) => fetch(ENDPOINT, { signal, headers: { Accept: "application/json" } }),
      TIMEOUT_MS,
    );
    if (!res.ok) {
      console.warn(`[api] GET ${ENDPOINT} respondió ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn("[api] no se pudo leer el estado remoto:", err.message);
    return null;
  }
}

/** Persiste el estado completo. Devuelve true si el backend confirmó la escritura. */
export async function pushState(state) {
  try {
    const res = await withTimeout(
      (signal) =>
        fetch(ENDPOINT, {
          method: "PUT",
          signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
        }),
      TIMEOUT_MS,
    );
    if (!res.ok) {
      console.warn(`[api] PUT ${ENDPOINT} respondió ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[api] no se pudo guardar el estado remoto:", err.message);
    return false;
  }
}
