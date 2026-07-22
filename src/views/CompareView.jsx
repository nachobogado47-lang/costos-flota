import {
  Car, Fuel, Gauge, Hammer, Inbox, MapPin, Plus, Scale, ShieldCheck, ClipboardList, Wallet, Wrench,
} from "lucide-react";
import { MONTHS, YEARS, VCOLORS } from "@/theme";
import { $fmt, kmFmt, initials, totalOf, monthlyKm, totalKm } from "@/lib/calc";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Metric, EmptyState, TopBadge } from "@/components/shared";

export function CompareView({
  vehicles, expenses, odometer,
  cMode, setCMode, cMonth, setCMonth, cYear, setCYear,
  getExp, onAddVehicle,
}) {
  const filters = (
    <Filters {...{ cMode, setCMode, cMonth, setCMonth, cYear, setCYear }} />
  );

  if (vehicles.length < 2) {
    return (
      <div>
        {filters}
        <EmptyState
          icon={Scale}
          title="Necesitás al menos 2 vehículos"
          hint="La comparación pone lado a lado el gasto, el consumo y la eficiencia de cada unidad."
        >
          <Button onClick={onAddVehicle}><Plus />Agregar vehículo</Button>
        </EmptyState>
      </div>
    );
  }

  const stats = vehicles.map((v) => {
    const vExps = cMode === "month" ? getExp(v.id, cMonth, cYear) : getExp(v.id);
    const totalGasto = totalOf(vExps);
    const vKm = cMode === "month"
      ? (monthlyKm(odometer, expenses, v, cMonth, cYear) || 0)
      : totalKm(odometer, expenses, v);
    const fuelExps = vExps.filter((e) => e.type === "combustible");
    const totalLitros = fuelExps.reduce((s, e) => s + (e.liters || 0), 0);
    const servicios = vExps.filter((e) => e.type === "service");
    const reparaciones = vExps.filter((e) => e.type === "reparacion");
    return {
      v,
      totalGasto,
      vKm,
      costPerKm: vKm > 0 ? Math.round(totalGasto / vKm) : null,
      totalLitros,
      totalCombust: totalOf(fuelExps),
      servicios,
      reparaciones,
      totalMant: totalOf([...servicios, ...reparaciones]),
      totalSeguros: totalOf(vExps.filter((e) => e.type === "seguro")),
      totalPatentes: totalOf(vExps.filter((e) => e.type === "patente")),
    };
  });

  const period = cMode === "month" ? `${MONTHS[cMonth]} ${cYear}` : "Todo el período";
  const sum = (fn) => stats.reduce((s, x) => s + fn(x), 0);

  // Sin movimientos ni km todas las filas se ocultarían y quedaría una tabla
  // de ceros sin explicación.
  if (sum((x) => x.totalGasto) === 0 && sum((x) => x.vKm) === 0) {
    return (
      <div>
        {filters}
        <EmptyState
          icon={Inbox}
          title={`Sin datos para ${period.toLowerCase()}`}
          hint={
            cMode === "month"
              ? "Ninguna unidad registró gastos ni kilometraje en este mes. Probá con otro período o mirá el acumulado."
              : "Todavía no hay gastos ni lecturas cargadas en la flota."
          }
        >
          {cMode === "month" && (
            <Button variant="outline" onClick={() => setCMode("all")}>
              <Scale />Ver acumulado
            </Button>
          )}
        </EmptyState>
      </div>
    );
  }

  const rows = [
    { label: "Gasto total",           icon: Wallet,        values: stats.map((s) => s.totalGasto),        fmt: $fmt },
    { label: "Km recorridos",         icon: Gauge,         values: stats.map((s) => s.vKm),               fmt: (v) => (v > 0 ? kmFmt(v) : "—") },
    { label: "Costo por km",          icon: MapPin,        values: stats.map((s) => s.costPerKm || 0),    fmt: (v) => (v > 0 ? $fmt(v) : "—"), sub: "menor = más eficiente", invert: true },
    { label: "Litros de combustible", icon: Fuel,          values: stats.map((s) => s.totalLitros),       fmt: (v) => (v > 0 ? `${v.toFixed(1)} L` : "—") },
    { label: "Gasto en combustible",  icon: Fuel,          values: stats.map((s) => s.totalCombust),      fmt: $fmt },
    { label: "Services realizados",   icon: Wrench,        values: stats.map((s) => s.servicios.length),  fmt: (v) => `${v} service${v !== 1 ? "s" : ""}` },
    { label: "Reparaciones",          icon: Hammer,        values: stats.map((s) => s.reparaciones.length), fmt: (v) => `${v} ${v === 1 ? "reparación" : "reparaciones"}` },
    { label: "Mantenimiento",         icon: Wrench,        values: stats.map((s) => s.totalMant),         fmt: $fmt, sub: "service + reparaciones" },
    { label: "Seguros",               icon: ShieldCheck,   values: stats.map((s) => s.totalSeguros),      fmt: $fmt },
    { label: "Patentes",              icon: ClipboardList, values: stats.map((s) => s.totalPatentes),     fmt: $fmt },
  ];

  return (
    <div>
      {filters}

      <div className="mb-5">
        <p className="mb-2.5 text-[13px] text-muted-foreground">
          Período: <span className="font-medium text-foreground">{period}</span>
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Metric label="Total flota"    value={$fmt(sum((x) => x.totalGasto))} tone="var(--fuel)"      surface="var(--fuel-soft)"      className="animate-rise" />
          <Metric label="Km totales"     value={sum((x) => x.vKm) > 0 ? kmFmt(sum((x) => x.vKm)) : "—"} tone="var(--service)" surface="var(--service-soft)" className="animate-rise" style={{ animationDelay: "50ms" }} />
          <Metric label="Litros totales" value={sum((x) => x.totalLitros) > 0 ? `${sum((x) => x.totalLitros).toFixed(1)} L` : "—"} tone="var(--repair)" surface="var(--repair-soft)" className="animate-rise" style={{ animationDelay: "100ms" }} />
          <Metric label="Mantenimiento"  value={$fmt(sum((x) => x.totalMant))} tone="var(--insurance)" surface="var(--insurance-soft)" className="animate-rise" style={{ animationDelay: "150ms" }} />
        </div>
      </div>

      {rows.map((r, i) => (
        <CompareRow key={r.label} {...r} stats={stats} delay={200 + i * 40} />
      ))}

      <SummaryTable stats={stats} />
    </div>
  );
}

function Filters({ cMode, setCMode, cMonth, setCMonth, cYear, setCYear }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <div className="flex gap-0.5 rounded-lg bg-muted p-0.5" role="tablist">
        {[{ id: "month", label: "Por mes" }, { id: "all", label: "Acumulado" }].map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={cMode === m.id}
            onClick={() => setCMode(m.id)}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
              cMode === m.id ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {cMode === "month" && (
        <>
          <Select value={cMonth} onChange={(e) => setCMonth(Number(e.target.value))} className="min-w-[130px] flex-1 font-medium" aria-label="Mes">
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </Select>
          <Select value={cYear} onChange={(e) => setCYear(Number(e.target.value))} className="w-[92px] shrink-0 font-medium tabular" aria-label="Año">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </>
      )}
    </div>
  );
}

function CompareRow({ label, icon: Icon, sub, values, fmt, stats, delay, invert }) {
  const max = Math.max(...values.map((x) => x || 0));
  if (max === 0) return null;

  // En "costo por km" el mejor es el menor, así que la estrella va al mínimo.
  const positives = values.filter((v) => v > 0);
  const best = invert && positives.length ? Math.min(...positives) : max;

  return (
    <Card className="mb-2.5 animate-rise" style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="pt-5">
        <div className="mb-4 flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-[13px] font-semibold">{label}</span>
          {sub && <span className="text-[11px] text-muted-foreground">· {sub}</span>}
        </div>
        <div className="flex flex-col gap-3">
          {stats.map((s, i) => {
            const val = values[i] || 0;
            const pct = max > 0 ? (val / max) * 100 : 0;
            const vc = VCOLORS[s.v.colorIdx || 0];
            const isBest = val === best && val > 0;
            return (
              <div key={s.v.id}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold"
                      style={{
                        color: vc,
                        backgroundColor: `color-mix(in oklab, ${vc} 14%, transparent)`,
                        border: `1px solid color-mix(in oklab, ${vc} 24%, transparent)`,
                      }}
                      aria-hidden
                    >
                      {initials(s.v.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium leading-tight">{s.v.name}</div>
                      <div className="text-[11px] text-muted-foreground">{s.v.plate}</div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div
                      className="text-sm font-semibold tabular"
                      style={isBest ? { color: vc } : undefined}
                    >
                      {fmt(val)}
                    </div>
                    {isBest && <TopBadge label={invert ? "Más eficiente" : "Mayor"} />}
                  </div>
                </div>
                <Progress
                  value={pct}
                  tone={vc}
                  className={isBest ? "" : "opacity-55"}
                  label={`${s.v.name}: ${fmt(val)}`}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryTable({ stats }) {
  const cols = ["Km", "$/km", "Litros", "Mant.", "Total"];
  return (
    <Card className="mt-4 animate-rise">
      <CardContent className="pt-5">
        <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          <Car className="size-3" aria-hidden />Resumen comparativo
        </div>
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-2 text-left font-semibold text-muted-foreground">Vehículo</th>
                {cols.map((h) => (
                  <th key={h} className="px-2 py-2 text-right font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => {
                const vc = VCOLORS[s.v.colorIdx || 0];
                return (
                  <tr key={s.v.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: vc }} aria-hidden />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{s.v.name}</div>
                          <div className="text-[10px] text-muted-foreground">{s.v.plate}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular text-muted-foreground">{s.vKm > 0 ? kmFmt(s.vKm) : "—"}</td>
                    <td className="px-2 py-2.5 text-right tabular text-muted-foreground">{s.costPerKm ? $fmt(s.costPerKm) : "—"}</td>
                    <td className="px-2 py-2.5 text-right tabular text-muted-foreground">{s.totalLitros > 0 ? `${s.totalLitros.toFixed(1)} L` : "—"}</td>
                    <td className="px-2 py-2.5 text-right tabular text-muted-foreground">{$fmt(s.totalMant)}</td>
                    <td className="px-2 py-2.5 text-right font-semibold tabular" style={{ color: vc }}>{$fmt(s.totalGasto)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
