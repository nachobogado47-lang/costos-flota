import { Cloud, CloudOff, HardDrive, Loader2, Pencil, Star, TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import { VCOLORS, CATEGORIES } from "@/theme";
import { $fmt, cat, initials } from "@/lib/calc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";

/** Cifra destacada. La tipografía serif la separa del resto de la interfaz. */
export function Metric({ label, value, sub, tone, surface, large, className, style }) {
  return (
    <div
      className={cn("rounded-xl p-4", className)}
      style={{ backgroundColor: surface ?? "var(--muted)", ...style }}
    >
      <div
        className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.07em]"
        style={{ color: tone ?? "var(--muted-foreground)" }}
      >
        {label}
      </div>
      <div
        className={cn("font-display leading-none tabular", large ? "text-[32px]" : "text-2xl")}
        style={{ color: tone ?? "var(--foreground)" }}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function VehicleAvatar({ v, size = 38 }) {
  const c = VCOLORS[v.colorIdx || 0];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[30%] font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        color: c,
        backgroundColor: `color-mix(in oklab, ${c} 14%, transparent)`,
        border: `1.5px solid color-mix(in oklab, ${c} 26%, transparent)`,
      }}
      aria-hidden
    >
      {initials(v.name)}
    </div>
  );
}

/** Icono de categoría sobre su superficie. */
export function CategoryIcon({ type, size = "md" }) {
  const c = cat(type);
  const px = size === "sm" ? 26 : 32;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg"
      style={{ width: px, height: px, backgroundColor: c.surface, color: c.tone }}
      aria-hidden
    >
      <c.Icon className={size === "sm" ? "size-3.5" : "size-4"} />
    </span>
  );
}

/** Ranking horizontal de categorías por monto. */
export function CategoryBars({ items, total }) {
  const sorted = items.filter((i) => i.amount > 0).sort((a, b) => b.amount - a.amount);
  if (!sorted.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((i, idx) => {
        const c = cat(i.id);
        const pct = total > 0 ? (i.amount / total) * 100 : 0;
        return (
          <div key={i.id} className="animate-rise" style={{ animationDelay: `${idx * 40}ms` }}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[13px]">
                <CategoryIcon type={i.id} size="sm" />
                {c.label}
              </span>
              <span className="text-[13px] font-semibold tabular">
                {$fmt(i.amount)}
                <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                  {pct.toFixed(0)}%
                </span>
              </span>
            </div>
            <Progress value={pct} tone={c.tone} label={`${c.label}: ${pct.toFixed(0)}%`} />
          </div>
        );
      })}
    </div>
  );
}

export function RowActions({ onEdit, onDelete, editLabel = "Editar", deleteLabel = "Eliminar" }) {
  return (
    <div className="flex shrink-0 gap-1">
      <Tooltip label={editLabel}>
        <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={editLabel}>
          <Pencil />
        </Button>
      </Tooltip>
      <Tooltip label={deleteLabel}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label={deleteLabel}
          className="text-muted-foreground hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 />
        </Button>
      </Tooltip>
    </div>
  );
}

/** Variación porcentual contra el período anterior. */
export function Delta({ pct }) {
  if (pct === null || !Number.isFinite(pct)) return null;
  const up = pct > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <div
      className={cn("flex items-center justify-end gap-1 text-[11px] font-medium", up ? "text-danger" : "text-service")}
    >
      <Icon className="size-3" aria-hidden />
      {Math.abs(pct).toFixed(0)}% vs mes anterior
    </div>
  );
}

export function TopBadge({ label = "Mayor" }) {
  return (
    <span className="flex items-center justify-end gap-0.5 text-[10px] font-semibold text-muted-foreground">
      <Star className="size-2.5 fill-current" aria-hidden />
      {label}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, hint, children }) {
  return (
    <Card className="animate-rise border-dashed shadow-none">
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden />
        </div>
        <p className="text-[15px] font-medium">{title}</p>
        {hint && <p className="mt-1.5 max-w-xs text-[13px] text-muted-foreground">{hint}</p>}
        {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
      </div>
    </Card>
  );
}

const SYNC = {
  syncing: { Icon: Loader2,   text: "Guardando",        cls: "text-muted-foreground", spin: true,
             tip: "Enviando los cambios a la base de datos." },
  synced:  { Icon: Cloud,     text: "Guardado",          cls: "text-service",
             tip: "Sincronizado con la base de datos." },
  local:   { Icon: HardDrive, text: "Solo este equipo",  cls: "text-repair",
             tip: "No hay base conectada: los datos viven en este navegador." },
  error:   { Icon: CloudOff,  text: "Sin sincronizar",   cls: "text-danger",
             tip: "No se pudo guardar en la base. Los datos están a salvo en este navegador." },
};

export function SyncBadge({ state }) {
  const s = SYNC[state];
  if (!s) return null;
  return (
    <Tooltip label={s.tip} side="bottom">
      <span className={cn("flex items-center gap-1 text-[10px] font-medium", s.cls)} aria-live="polite">
        <s.Icon className={cn("size-3", s.spin && "animate-spin")} aria-hidden />
        {s.text}
      </span>
    </Tooltip>
  );
}

/* ── Skeletons ─────────────────────────────────────────────────────────────
   Reproducen la silueta real de cada vista para que al llegar los datos no
   haya salto de layout. */

export function MetricsSkeleton({ count = 4 }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-2.5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl bg-muted/60 p-4">
          <Skeleton className="mb-2.5 h-2.5 w-20 bg-muted-foreground/10" />
          <Skeleton className="h-7 w-28 bg-muted-foreground/10" />
        </div>
      ))}
    </div>
  );
}

export function VehicleCardSkeleton() {
  return (
    <Card className="mb-3 border-l-4 border-l-muted p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-10 rounded-[30%]" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-11 rounded-lg" />)}
      </div>
    </Card>
  );
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

export function ReportSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando informe">
      <div className="mb-5 flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
      </div>
      <MetricsSkeleton />
      <Card className="mb-5 p-5">
        <Skeleton className="mb-4 h-2.5 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i}>
              <Skeleton className="mb-1.5 h-3 w-full" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </Card>
      <VehicleCardSkeleton />
      <VehicleCardSkeleton />
    </div>
  );
}

export { CATEGORIES };
