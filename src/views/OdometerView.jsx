import { Car, Plus, Route } from "lucide-react";
import { VCOLORS } from "@/theme";
import { kmFmt, latestKm, atNoon } from "@/lib/calc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VehicleAvatar, RowActions, EmptyState } from "@/components/shared";

export function OdometerView({
  vehicles, expenses, odometer, onNewOdometer, onEditOdometer, onDeleteOdometer, onAddVehicle,
}) {
  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="Primero agregá un vehículo"
        hint="Las lecturas de odómetro se cargan por unidad."
      >
        <Button onClick={onAddVehicle}><Plus />Agregar vehículo</Button>
      </EmptyState>
    );
  }

  return (
    <>
      {vehicles.map((v, i) => {
        const vOdom = odometer
          .filter((o) => o.vehicleId === v.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        const vColor = VCOLORS[v.colorIdx || 0];
        const latest = latestKm(odometer, expenses, v);

        return (
          <Card
            key={v.id}
            className="mb-3 animate-rise border-l-4"
            style={{ borderLeftColor: vColor, animationDelay: `${i * 60}ms` }}
          >
            <CardContent className="pt-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <VehicleAvatar v={v} size={38} />
                  <div>
                    <div className="text-sm font-semibold leading-tight">{v.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{v.plate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                      Último registro
                    </div>
                    <div className="font-display text-lg leading-none tabular" style={{ color: vColor }}>
                      {kmFmt(latest)}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onNewOdometer(v.id)}>
                    <Plus />Lectura
                  </Button>
                </div>
              </div>

              {vOdom.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-6 text-center">
                  <Route className="mx-auto mb-2 size-4 text-muted-foreground" aria-hidden />
                  <p className="text-[13px] text-muted-foreground">Sin lecturas manuales todavía.</p>
                  <button
                    onClick={() => onNewOdometer(v.id)}
                    className="mt-1 text-[12px] font-medium text-service underline-offset-2 hover:underline"
                  >
                    Registrar la primera →
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
                    Historial de lecturas
                  </div>
                  <ol className="flex flex-col gap-1.5">
                    {vOdom.map((o, idx, arr) => {
                      const prev = arr[idx + 1];
                      const recorrido = prev ? Math.max(0, o.km - prev.km) : null;
                      return (
                        <li
                          key={o.id}
                          className="flex items-center gap-2.5 rounded-lg bg-muted/60 px-2.5 py-2 transition-colors hover:bg-muted"
                        >
                          <span
                            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-service-soft text-service"
                            aria-hidden
                          >
                            <Route className="size-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold tabular">{kmFmt(o.km)}</div>
                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                              {atNoon(o.date).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                              {o.note && ` · ${o.note}`}
                              {recorrido !== null && (
                                <span className="font-medium text-service"> · +{kmFmt(recorrido)}</span>
                              )}
                            </div>
                          </div>
                          <RowActions
                            onEdit={() => onEditOdometer(o)}
                            onDelete={() => onDeleteOdometer(o.id)}
                            editLabel="Editar lectura"
                            deleteLabel="Eliminar lectura"
                          />
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
