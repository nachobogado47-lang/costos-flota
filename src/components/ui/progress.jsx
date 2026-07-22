import { cn } from "@/lib/utils";

/** Barra proporcional. `tone` es un color CSS ya resuelto, no una clase. */
function Progress({ value = 0, tone, className, trackClassName, label }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", trackClassName)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", className)}
        style={{ width: `${pct}%`, backgroundColor: tone }}
      />
    </div>
  );
}

export { Progress };
