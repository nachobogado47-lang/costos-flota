import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

const ICONS = {
  success: Check,
  error: AlertTriangle,
  info: Info,
};

const TONES = {
  success: "text-service",
  error: "text-danger",
  info: "text-fuel",
};

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((p) => p.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (message, variant = "success") => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((p) => [...p, { id, message, variant }]);
      timers.current.set(id, setTimeout(() => dismiss(id), variant === "error" ? 5000 : 2600));
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.variant] ?? Check;
          return (
            <button
              key={t.id}
              onClick={() => dismiss(t.id)}
              className={cn(
                "pointer-events-auto flex max-w-sm items-center gap-2 rounded-full border border-border",
                "bg-card px-4 py-2 text-sm shadow-lg animate-rise",
              )}
            >
              <Icon className={cn("size-4 shrink-0", TONES[t.variant])} aria-hidden />
              <span className="text-card-foreground">{t.message}</span>
            </button>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx.toast;
}

export { ToastProvider, useToast };
