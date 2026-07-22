import { useState } from "react";
import { Check, Route, TriangleAlert } from "lucide-react";
import { kmFmt, latestKm } from "@/lib/calc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function OdometerForm({ initial, vehicles, odometer, expenses, onSave, onCancel, isEdit }) {
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);

  const ok = f.vehicleId && Number(f.km) > 0;

  // Un odómetro no retrocede: si la lectura es menor que la última conocida,
  // casi siempre es un dígito mal tipeado. Se avisa pero no se bloquea, porque
  // puede tratarse de una corrección legítima o un cambio de tablero.
  const vehicle = vehicles.find((v) => v.id === f.vehicleId);
  const known = vehicle && !isEdit ? latestKm(odometer, expenses, vehicle) : null;
  const goesBackwards = known !== null && Number(f.km) > 0 && Number(f.km) < known;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ok || saving) return;
    setSaving(true);
    try {
      await onSave(f);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="animate-rise border-service/30">
      <CardContent className="pt-5">
        <div className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-service">
          <Route className="size-4" aria-hidden />
          {isEdit ? "Editar lectura" : "Nueva lectura de odómetro"}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <Label htmlFor="odo-vehicle" required>Vehículo</Label>
            <Select
              id="odo-vehicle"
              value={f.vehicleId}
              onChange={(e) => setF((p) => ({ ...p, vehicleId: e.target.value }))}
            >
              <option value="">— Seleccioná —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="odo-km" required>Km del odómetro</Label>
              <Input
                id="odo-km"
                type="number"
                inputMode="numeric"
                min="0"
                value={f.km}
                onChange={(e) => setF((p) => ({ ...p, km: e.target.value }))}
                placeholder="125430"
                aria-describedby={goesBackwards ? "odo-warn" : undefined}
              />
            </div>
            <div>
              <Label htmlFor="odo-date">Fecha</Label>
              <Input
                id="odo-date"
                type="date"
                value={f.date}
                onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
          </div>

          {known !== null && !goesBackwards && (
            <p className="-mt-1 text-[11px] text-muted-foreground">
              Última lectura conocida: <span className="tabular font-medium">{kmFmt(known)}</span>
            </p>
          )}

          {goesBackwards && (
            <div
              id="odo-warn"
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-repair-soft px-3 py-2.5 text-[12px] text-repair"
            >
              <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
              <span>
                Es menor que la última lectura registrada ({kmFmt(known)}). Revisá que no falte un dígito —
                podés guardarla igual si es una corrección.
              </span>
            </div>
          )}

          <div>
            <Label htmlFor="odo-note">
              Nota <span className="font-normal normal-case tracking-normal opacity-70">(opcional)</span>
            </Label>
            <Input
              id="odo-note"
              value={f.note}
              onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))}
              placeholder="Inicio de mes, fin de mes…"
            />
          </div>

          <div className="flex gap-2 border-t border-border pt-4">
            <Button
              type="submit"
              disabled={!ok}
              loading={saving}
              className="flex-1 bg-service text-white hover:bg-service/90"
            >
              {!saving && <Check />}
              {isEdit ? "Guardar cambios" : "Guardar lectura"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
