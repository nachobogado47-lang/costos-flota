import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * Modal accesible sin dependencias de Radix: cierra con Escape, atrapa el foco
 * y lo devuelve al elemento que lo abrió.
 */
function Dialog({ open, onClose, title, description, children, footer, className }) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    restoreRef.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    // Al abrir, el foco va al panel para que los lectores anuncien el título.
    requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="absolute inset-0 cursor-default bg-foreground/35 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
        aria-label="Cerrar"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-2xl outline-none",
          "animate-rise",
          className,
        )}
      >
        {title && (
          <div className="mb-4 pr-6">
            <h2 id="dialog-title" className="text-base font-semibold tracking-tight">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="absolute right-3 top-3 text-muted-foreground"
          aria-label="Cerrar"
        >
          <X />
        </Button>

        {children}

        {footer && <div className="mt-5 flex gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export { Dialog };
