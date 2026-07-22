import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_FUEL_PRICES, DEFAULT_TAXES } from "../theme.js";
import { fetchState, pushState } from "./api.js";

const LS_KEY = "fleet2:state";
const SYNC_DEBOUNCE_MS = 900;

const EMPTY = {
  vehicles: [],
  expenses: [],
  odometer: [],
  fuelPrices: DEFAULT_FUEL_PRICES,
  fuelHistory: [],
  taxes: DEFAULT_TAXES,
};

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function writeLocal(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("[store] no se pudo escribir en localStorage:", err.message);
  }
}

/** Un estado remoto sólo pisa al local si realmente trae datos. */
function hasData(s) {
  return Boolean(s && (s.vehicles?.length || s.expenses?.length || s.odometer?.length));
}

/**
 * Fuente de verdad de la app.
 *
 * Lectura: intenta Postgres primero y cae a localStorage si el backend no está.
 * Escritura: localStorage inmediato (la UI nunca espera a la red) + push
 * debounced al backend. `syncState` refleja en qué situación está.
 */
export function useFleetStore() {
  const [state, setState] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [syncState, setSyncState] = useState("idle"); // idle | syncing | synced | local | error

  const timer = useRef(null);
  const pending = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const local = readLocal();
      if (local && !cancelled) setState(local);

      const remote = await fetchState();
      if (cancelled) return;

      if (hasData(remote)) {
        setState({ ...EMPTY, ...remote });
        writeLocal({ ...EMPTY, ...remote });
        setSyncState("synced");
      } else if (remote) {
        // El backend está vivo pero vacío: subimos lo que haya local.
        setSyncState(local ? "syncing" : "synced");
      } else {
        setSyncState("local");
      }
      setLoaded(true);
    })();

    return () => { cancelled = true; };
  }, []);

  const flush = useCallback(async () => {
    const snapshot = pending.current;
    if (!snapshot) return;
    pending.current = null;
    setSyncState("syncing");
    const ok = await pushState(snapshot);
    setSyncState(ok ? "synced" : "error");
  }, []);

  /** Aplica un cambio parcial o funcional al estado y programa el sync. */
  const update = useCallback((patch) => {
    setState((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      writeLocal(next);
      pending.current = next;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, SYNC_DEBOUNCE_MS);
      return next;
    });
  }, [flush]);

  /** Reemplaza todo el estado de golpe (import de un backup). */
  const replaceAll = useCallback((next) => {
    const merged = { ...EMPTY, ...next };
    setState(merged);
    writeLocal(merged);
    pending.current = merged;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 0);
  }, [flush]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { state, update, replaceAll, loaded, syncState };
}
