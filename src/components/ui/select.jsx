import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Select nativo con la piel de shadcn. Se prefiere al menú de Radix porque en
 * móvil el picker del sistema es más rápido y accesible, y esta app se usa
 * mayormente desde el teléfono.
 */
function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-9 w-full appearance-none rounded-lg border border-input bg-card pl-3 pr-8 text-sm shadow-xs transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring focus-visible:border-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

export { Select };
