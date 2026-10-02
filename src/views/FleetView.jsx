import {
  Calendar,
  Car,
  Gauge,
  Pencil,
  Plus,
  Receipt,
  Route,
  Trash2,
  BadgeCheck,
  RotateCcw,
} from "lucide-react";
import { VCOLORS } from "@/theme";
import { $fmt, kmFmt, totalOf, monthlyKm, latestKm } from "@/lib/calc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VehicleAvatar, EmptyState } from "@/components/shared";

export function FleetView({
  vehicles,
  expenses,
  odometer,
  getExp,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onSellVehicle,
  onReactivateVehicle,
  onNewExpense,
  onNewOdometer,
}) {
  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="No hay vehículos registrados"
        hint="Cargá una unidad con su patente y los km iniciales del odómetro."
      >
        <Button onClick={onAddVehicle}>
          <Plus />
          Agregar vehículo
        </Button>
      </EmptyState>
    );
  }

  const now = new Date();

  // Activos primero, vendidos después
  const sortedVehicles = [...vehicles].sort((a, b) => {
    if (Boolean(a.soldAt) !== Boolean(b.soldAt)) {
      return a.soldAt ? 1 : -1;
    }

    return (a.name || "").localeCompare(b.name || "");
  });

  return (
    <div className="flex flex-col gap-3">
      {sortedVehicles.map((v, i) => {
        const allExps = getExp(v.id);
        const vColor = VCOLORS[v.colorIdx || 0];
        const kmMonth = monthlyKm(
          odometer,
          expenses,
          v,
          now.getMonth(),
          now.getFullYear()
        );
        const latest = latestKm(odometer, expenses, v);
        const sold = Boolean(v.soldAt);

        return (
          <Card
            key={v.id}
            className={`animate-rise border-l-4 ${
              sold ? "opacity-75" : ""
            }`}
            style={{
              borderLeftColor: sold ? "var(--danger)" : vColor,
              animationDelay: `${i * 60}ms`,
            }}
          >
            <CardContent className="pt-5">
              <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <VehicleAvatar v={v} size={46} />

                  <div>
                    <div className="flex items-center gap-2 text-[15px] font-semibold leading-tight">
                      {v.name}

                      {sold && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-semibold text-danger">
                          <BadgeCheck className="size-3" />
                          Vendido
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {v.plate}
                      {v.brand
                        ? ` · ${v.brand} ${v.model}`.trimEnd()
                        : ""}
                      {v.year ? ` (${v.year})` : ""}
                    </div>

                    {sold && v.soldAt && (
                      <div className="mt-1 text-[10px] text-danger">
                        Vendido el {formatDate(v.soldAt)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-1.5">
                  {!sold && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNewExpense(v.id)}
                      >
                        <Plus />
                        Gasto
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNewOdometer(v.id)}
                      >
                        <Route />
                        Km
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEditVehicle(v)}
                    aria-label={`Editar ${v.name}`}
                  >
                    <Pencil />
                  </Button>

                  {!sold ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSellVehicle(v.id)}
                      className="text-danger hover:bg-danger-soft hover:text-danger"
                    >
                      <BadgeCheck />
                      Vender
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReactivateVehicle(v.id)}
                      className="text-service hover:bg-service-soft hover:text-service"
                    >
                      <RotateCcw />
                      Reactivar
                    </Button>
                  )}

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
                <Chip
                  icon={Gauge}
                  label={`${kmFmt(latest)} actuales`}
                />

                {kmMonth !== null && (
                  <Chip
                    icon={Calendar}
                    label={`${kmFmt(kmMonth)} este mes`}
                    tone="var(--service)"
                    surface="var(--service-soft)"
                  />
                )}

                <Chip
                  icon={Receipt}
                  label={`${allExps.length} ${
                    allExps.length === 1 ? "gasto" : "gastos"
                  } · ${$fmt(totalOf(allExps))}`}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function formatDate(date) {
  if (!date) return "";

  const parts = date.split("-");

  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return date;
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
