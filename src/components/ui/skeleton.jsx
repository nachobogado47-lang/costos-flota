import { cn } from "@/lib/utils";

/**
 * Placeholder de carga. Usa shimmer en vez de pulse: con varias filas a la vez,
 * el pulso sincronizado late como un estrobo y el barrido se lee mejor.
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-muted shimmer", className)}
      aria-hidden
      {...props}
    />
  );
}

export { Skeleton };
