import { Car, Fuel, Gauge, Inbox, MapPin, Plus, Receipt, Route, Wallet } from "lucide-react";
import { CATEGORIES, MONTHS, YEARS, VCOLORS, FUEL_TYPES } from "@/theme";
import { $fmt, kmFmt, cat, totalOf, monthlyKm, atNoon } from "@/lib/calc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Metric, VehicleAvatar, CategoryIcon, CategoryBars, RowActions, Delta, EmptyState,
} from "@/components/shared";

export function ReportView({
  vehicles, expenses, odometer,
  rMonth, setRMonth, rYear, setRYear, rVid, setRVid,
  getExp, onNewExpense, onNewOdometer, onEditExpense, onEditOdometer,
  onDeleteExpense, onDeleteOdometer, onAddVehicle,
}) {
  const rVehicles = rVid ? vehicles.filter((v) => v.id === rVid) : vehicles;
  const rExps = getExp(rVid, rMonth, rYear);
  const rTotal = totalOf(rExps);
  const rTotalKm = rVehicles.reduce((s, v) => s + (monthlyKm(odometer, expenses, v, rMonth, rYear) || 0), 0);
  const rCostPerKm = rTotalKm > 0 ? Math.round(rTotal / rTotalKm) : null;
  const byCategory = CATEGORIES.map((c) => ({ id: c.id, amount: totalOf(rExps.filter((e) => e.type === c.id)) }));

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        <Select
          value={rMonth}
          onChange={(e) => setRMonth(Number(e.target.value))}
          className="min-w-[130px] flex-1 font-medium"
          aria-label="Mes"
        >
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </Select>
        <Select
          value={rYear}
          onChange={(e) => setRYear(Number(e.target.value))}
          className="w-[92px] shrink-0 font-medium tabular"
          aria-label="Año"
        >
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Select
          value={rVid || ""}
          onChange={(e) => setRVid(e.target.value || null)}
          className="min-w-[150px] flex-1"
          aria-label="Vehículo"
        >
          <option value="">Toda la flota</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.plate}</option>)}
        </Select>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Todavía no tenés vehículos"
          hint="Agregá el primero para empezar a registrar gastos y kilometraje."
        >
          <Button onClick={onAddVehicle}><Plus />Agregar vehículo</Button>
        </EmptyState>
      ) : rExps.length === 0 && rTotalKm === 0 ? (
        <EmptyState
          icon={Inbox}
          title={`Sin datos para ${MONTHS[rMonth]} ${rYear}`}
          hint="Cargá gastos o registrá los km del odómetro para ver el informe."
        >
          <Button onClick={() => onNewExpense()}><Plus />Cargar gasto</Button>
          <Button variant="outline" onClick={() => onNewOdometer()}><Route />Registrar km</Button>
        </EmptyState>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-2.5">
            <Metric
              large label="Total gastado" value={$fmt(rTotal)}
              tone="var(--fuel)" surface="var(--fuel-soft)"
              className="animate-rise"
            />
            <Metric
              large label="Km recorridos" value={rTotalKm > 0 ? kmFmt(rTotalKm) : "—"}
              sub={rTotalKm === 0 ? "Sin lectura de km" : undefined}
              tone="var(--service)" surface="var(--service-soft)"
              className="animate-rise" style={{ animationDelay: "50ms" }}
            />
            {rCostPerKm !== null && (
              <Metric
                label="Costo por km" value={$fmt(rCostPerKm)} sub="promedio del período"
                tone="var(--repair)" surface="var(--repair-soft)"
                className="animate-rise" style={{ animationDelay: "100ms" }}
              />
            )}
            <Metric
              label="Gastos registrados" value={rExps.length} sub={`en ${MONTHS[rMonth]}`}
              tone="var(--insurance)" surface="var(--insurance-soft)"
              className="animate-rise" style={{ animationDelay: "150ms" }}
            />
          </div>

          {rExps.length > 0 && (
            <Card className="mb-5 animate-rise" style={{ animationDelay: "200ms" }}>
              <CardContent className="pt-5">
                <SectionLabel icon={Wallet}>Distribución de gastos</SectionLabel>
                <CategoryBars items={byCategory} total={rTotal} />
              </CardContent>
            </Card>
          )}

          <SectionLabel icon={Car} className="mb-2.5">Detalle por vehículo</SectionLabel>
          {rVehicles.map((v, i) => (
            <VehicleReportCard
              key={v.id}
              v={v} index={i} rMonth={rMonth} rYear={rYear}
              expenses={expenses} odometer={odometer} getExp={getExp}
              onEditExpense={onEditExpense} onEditOdometer={onEditOdometer}
              onDeleteExpense={onDeleteExpense} onDeleteOdometer={onDeleteOdometer}
              onNewOdometerFor={() => onNewOdometer(v.id)}
            />
          ))}
        </>
      )}
    </>
  );
}

function SectionLabel({ icon: Icon, children, className = "" }) {
  return (
    <div className={`mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground ${className}`}>
      {Icon && <Icon className="size-3" aria-hidden />}
      {children}
    </div>
  );
}

function VehicleReportCard({
  v, index, rMonth, rYear, expenses, odometer, getExp,
  onEditExpense, onEditOdometer, onDeleteExpense, onDeleteOdometer, onNewOdometerFor,
}) {
  const vExps = getExp(v.id, rMonth, rYear);
  const vTotal = totalOf(vExps);
  const vKm = monthlyKm(odometer, expenses, v, rMonth, rYear);
  const costPKm = vKm && vKm > 0 && vTotal > 0 ? Math.round(vTotal / vKm) : null;
  const fuelExps = vExps.filter((e) => e.type === "combustible");
  const totalL = fuelExps.reduce((s, e) => s + (e.liters || 0), 0);

  const prevTotal = totalOf(getExp(v.id, rMonth === 0 ? 11 : rMonth - 1, rMonth === 0 ? rYear - 1 : rYear));
  const diff = prevTotal > 0 ? ((vTotal - prevTotal) / prevTotal) * 100 : null;

  const vColor = VCOLORS[v.colorIdx || 0];
  const odomThisMonth = odometer
    .filter((o) => {
      const d = atNoon(o.date);
      return o.vehicleId === v.id && d.getMonth() === rMonth && d.getFullYear() === rYear;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <Card
      className="mb-3 animate-rise border-l-4 overflow-hidden"
      style={{ borderLeftColor: vColor, animationDelay: `${250 + index * 60}ms` }}
    >
      <CardContent className="pt-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <VehicleAvatar v={v} size={42} />
            <div>
              <div className="text-[15px] font-semibold leading-tight">{v.name}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {v.plate}{v.brand ? ` · ${v.brand} ${v.model}`.trimEnd() : ""}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl leading-none tabular" style={{ color: vColor }}>
              {$fmt(vTotal)}
            </div>
            <Delta pct={diff} />
          </div>
        </div>

        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {vKm !== null ? (
            <MiniStat icon={Gauge} label="Km recorridos" value={kmFmt(vKm)} tone="var(--service)" surface="var(--service-soft)" />
          ) : (
            <div className="rounded-lg bg-muted p-3">
              <div className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                <Gauge className="size-2.5" aria-hidden />Km recorridos
              </div>
              <div className="text-[13px] text-muted-foreground">Sin lectura</div>
              <button
                onClick={onNewOdometerFor}
                className="mt-1 text-[11px] font-medium text-service underline-offset-2 hover:underline"
              >
                Registrar →
              </button>
            </div>
          )}
          {costPKm !== null && (
            <MiniStat icon={MapPin} label="Costo / km" value={$fmt(costPKm)} tone="var(--repair)" surface="var(--repair-soft)" />
          )}
          {totalL > 0 && (
            <MiniStat
              icon={Fuel} label="Combustible" value={`${totalL.toFixed(1)} L`}
              sub={`${$fmt(Math.round(totalOf(fuelExps) / totalL))}/litro`}
              tone="var(--fuel)" surface="var(--fuel-soft)"
            />
          )}
        </div>

        {odomThisMonth.length > 0 && (
          <div className="mb-4 rounded-lg bg-service-soft p-3">
            <div className="mb-2 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.07em] text-service">
              <Route className="size-2.5" aria-hidden />Lecturas del mes
            </div>
            <div className="flex flex-col gap-1">
              {odomThisMonth.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="truncate text-service">
                    {atNoon(o.date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}
                    {o.note && ` · ${o.note}`}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="font-semibold tabular text-service">{kmFmt(o.km)}</span>
                    <RowActions
                      onEdit={() => onEditOdometer(o)}
                      onDelete={() => onDeleteOdometer(o.id)}
                      editLabel="Editar lectura"
                      deleteLabel="Eliminar lectura"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {vExps.length > 0 ? (
          <>
            <SectionLabel>Gastos del mes</SectionLabel>
            <div className="mb-5">
              <CategoryBars
                items={CATEGORIES.map((c) => ({ id: c.id, amount: totalOf(vExps.filter((e) => e.type === c.id)) }))}
                total={vTotal}
              />
            </div>

            <SectionLabel icon={Receipt}>Movimientos</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {[...vExps].sort((a, b) => new Date(b.date) - new Date(a.date)).map((e) => (
                <ExpenseRow
                  key={e.id} e={e} compact
                  onEdit={() => onEditExpense(e)}
                  onDelete={() => onDeleteExpense(e.id)}
                />
              ))}
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-[13px] font-medium text-muted-foreground">Total {MONTHS[rMonth]}</span>
              <span className="font-display text-lg tabular" style={{ color: vColor }}>{$fmt(vTotal)}</span>
            </div>
          </>
        ) : (
          <p className="py-2 text-center text-[13px] text-muted-foreground">
            Sin gastos en {MONTHS[rMonth]} {rYear}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value, sub, tone, surface }) {
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: surface }}>
      <div
        className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.07em]"
        style={{ color: tone }}
      >
        <Icon className="size-2.5" aria-hidden />{label}
      </div>
      <div className="text-lg font-semibold leading-none tabular" style={{ color: tone }}>{value}</div>
      {sub && <div className="mt-1 text-[10px] tabular" style={{ color: tone, opacity: 0.75 }}>{sub}</div>}
    </div>
  );
}

export function ExpenseRow({ e, vehicle, vehicleColor, compact, onEdit, onDelete }) {
  const c = cat(e.type);
  const ft = e.type === "combustible" && e.fuelType ? FUEL_TYPES.find((x) => x.id === e.fuelType) : null;

  return (
    <div
      className={`group flex items-center gap-2.5 rounded-lg transition-colors ${
        compact ? "bg-muted/60 px-2.5 py-2 hover:bg-muted" : "border border-border bg-card px-3 py-2.5 hover:border-foreground/15"
      }`}
    >
      <CategoryIcon type={e.type} size={compact ? "sm" : "md"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-medium">
          <span className="truncate">{c.label}</span>
          {ft && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-normal text-muted-foreground">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: ft.dot }} aria-hidden />
              {ft.label}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
          {vehicle && <span className="font-medium" style={{ color: vehicleColor }}>{vehicle.name}</span>}
          <span className="tabular">
            {atNoon(e.date).toLocaleDateString("es-AR", compact ? { day: "2-digit", month: "2-digit" } : undefined)}
          </span>
          {e.km > 0 && <span className="tabular">· {kmFmt(e.km)}</span>}
          {e.liters > 0 && <span className="tabular">· {e.liters} L</span>}
          {e.note && <span className="truncate">· {e.note}</span>}
        </div>
      </div>
      <div className="shrink-0 text-sm font-semibold tabular">{$fmt(e.amount)}</div>
      <RowActions onEdit={onEdit} onDelete={onDelete} editLabel="Editar gasto" deleteLabel="Eliminar gasto" />
    </div>
  );
}
