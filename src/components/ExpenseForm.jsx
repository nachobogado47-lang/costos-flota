import { useState } from "react";
import { Check } from "lucide-react";
import { CATEGORIES } from "@/theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ExpenseForm({ initial, vehicles, fuelPrices, fuelTypes, taxes, onSave, onCancel, isEdit }) {
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);
  const isFuel = f.type === "combustible";

  const ok = f.vehicleId && Number(f.amount) > 0 && (isFuel ? Number(f.liters) > 0 : true);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ok || saving) return;
    setSaving(true);
    try {
      await onSave({ ...f, amount: Number(f.amount), liters: Number(f.liters) || 0 });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="animate-rise">
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="grid gap-5">

          {/* Vehículo */}
          <div>
            <Label htmlFor="exp-vehicle" required>Vehículo</Label>
            <Select
              id="exp-vehicle"
              value={f.vehicleId}
              onChange={(e) => setF((p) => ({ ...p, vehicleId: e.target.value }))}
            >
              <option value="">— Seleccioná —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
              ))}
            </Select>
          </div>

          {/* Tipo de gasto */}
          <div>
            <Label required>Tipo de gasto</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((c) => {
                const sel = f.type === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setF((p) => ({ ...p, type: c.id }))}
                    aria-pressed={sel}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs transition-all duration-150",
                      "hover:border-foreground/20 active:scale-[0.98]",
                      sel ? "border-transparent font-semibold" : "border-border bg-card text-muted-foreground",
                    )}
                    style={sel ? { backgroundColor: c.surface, color: c.tone, boxShadow: `inset 0 0 0 1.5px ${c.tone}` } : undefined}
                  >
                    <c.Icon className="size-3.5 shrink-0" aria-hidden />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Importe + fecha — siempre manual */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="exp-amount" required>Importe ($)</Label>
              <Input
                id="exp-amount"
                type="number"
                inputMode="decimal"
                min="0"
                value={f.amount}
                onChange={(e) => setF((p) => ({ ...p, amount: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="exp-date">Fecha</Label>
              <Input
                id="exp-date"
                type="date"
                value={f.date}
                onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
          </div>

          {/* Litros — solo si es combustible */}
          {isFuel && (
            <div>
              <Label htmlFor="exp-liters" required>Litros cargados</Label>
              <Input
                id="exp-liters"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={f.liters || ""}
                onChange={(e) => setF((p) => ({ ...p, liters: e.target.value }))}
                placeholder="0,00"
              />
            </div>
          )}

          {/* Km odómetro */}
          <div>
            <Label htmlFor="exp-km">
              Km odómetro <span className="font-normal normal-case tracking-normal opacity-70">(opcional)</span>
            </Label>
            <Input
              id="exp-km"
              type="number"
              inputMode="numeric"
              min="0"
              value={f.km}
              onChange={(e) => setF((p) => ({ ...p, km: e.target.value }))}
              placeholder="Lectura actual"
            />
          </div>

          {/* Nota */}
          <div>
            <Label htmlFor="exp-note">
              Nota <span className="font-normal normal-case tracking-normal opacity-70">(opcional)</span>
            </Label>
            <Input
              id="exp-note"
              value={f.note}
              onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))}
              placeholder="Proveedor, descripción…"
            />
          </div>

          <div className="flex gap-2 border-t border-border pt-4">
            <Button type="submit" disabled={!ok} loading={saving} className="flex-1">
              {!saving && <Check />}
              {isEdit ? "Guardar cambios" : "Guardar gasto"}
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
