import { cn } from "@/lib/utils";

/**
 * Tooltip CSS puro sobre un contenedor `group`. Sin JS ni portales: el contenido
 * es siempre texto corto y accesible vía `title` en el trigger.
 */
function Tooltip({ label, children, side = "top", className }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1",
          "text-[11px] font-medium text-background opacity-0 shadow-md transition-opacity duration-150",
          "group-hover:opacity-100 group-focus-within:opacity-100",
          side === "top" && "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
          side === "bottom" && "top-full left-1/2 mt-1.5 -translate-x-1/2",
          className,
        )}
      >
        {label}
      </span>
    </span>
  );
}

export { Tooltip };
