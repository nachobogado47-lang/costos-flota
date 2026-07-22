import { Calendar, Car, Gauge, Pencil, Plus, Receipt, Route, Trash2 } from "lucide-react";
import { VCOLORS } from "@/theme";
import { $fmt, kmFmt, totalOf, monthlyKm, latestKm } from "@/lib/calc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VehicleAvatar, EmptyState } from "@/components/shared";

export function FleetView({
  vehicles, expenses, odometer, getExp,
  onAddVehicle, onEditVehicle, onDeleteVehicle, onNewExpense, onNewOdometer,
}) {
  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="No hay vehículos registrados"
        hint="Cargá una unidad con su patente y los km iniciales del odómetro."
      >
        <Button onClick={onAddVehicle}><Plus />Agregar vehículo</Button>
      </EmptyState>
    );
  }

  const now = new Date();

  return (
    <div className="flex flex-col gap-3">
      {vehicles.map((v, i) => {
        const allExps = getExp(v.id);
        const vColor = VCOLORS[v.colorIdx || 0];
        const kmMonth = monthlyKm(odometer, expenses, v, now.getMonth(), now.getFullYear());
        const latest = latestKm(odometer, expenses, v);

        return (
          <Card
            key={v.id}
            className="animate-rise border-l-4"
            style={{ borderLeftColor: vColor, animationDelay: `${i * 60}ms` }}
          >
            <CardContent className="pt-5">
              <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <VehicleAvatar v={v} size={46} />
                  <div>
                    <div className="text-[15px] font-semibold leading-tight">{v.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {v.plate}
                      {v.brand ? ` · ${v.brand} ${v.model}`.trimEnd() : ""}
                      {v.year ? ` (${v.year})` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => onNewExpense(v.id)}>
                    <Plus />Gasto
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onNewOdometer(v.id)}>
                    <Route />Km
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => onEditVehicle(v)} aria-label={`Editar ${v.name}`}>
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDeleteVehicle(v.id)}
                    aria-label={`Eliminar ${v.name}`}
                    className="text-muted-foreground hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Chip icon={Gauge} label={`${kmFmt(latest)} actuales`} />
                {kmMonth !== null && (
                  <Chip icon={Calendar} label={`${kmFmt(kmMonth)} este mes`} tone="var(--service)" surface="var(--service-soft)" />
                )}
                <Chip
                  icon={Receipt}
                  label={`${allExps.length} ${allExps.length === 1 ? "gasto" : "gastos"} · ${$fmt(totalOf(allExps))}`}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Chip({ icon: Icon, label, tone, surface }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] tabular"
      style={{
        backgroundColor: surface ?? "var(--muted)",
        color: tone ?? "var(--muted-foreground)",
      }}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
