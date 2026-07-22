import { useState } from "react";
import { Check, Info } from "lucide-react";
import { CATEGORIES, FUEL_TYPES } from "@/theme";
import { calcFinalPrice, calcFuelAmount, $fmt } from "@/lib/calc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ExpenseForm({ initial, vehicles, fuelPrices, taxes, onSave, onCancel, isEdit }) {
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);
  const isFuel = f.type === "combustible";

  // En combustible el importe se deriva de litros × precio final, nunca se tipea.
  const calcedAmount = isFuel && f.liters && f.fuelType
    ? calcFuelAmount(Number(f.liters), f.fuelType, fuelPrices, taxes)
    : null;

  const ok = f.vehicleId && (isFuel ? Number(f.liters) > 0 && f.fuelType : Number(f.amount) > 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ok || saving) return;
    setSaving(true);
    try {
      await onSave(isFuel
        ? { ...f, amount: calcedAmount, liters: Number(f.liters) }
        : { ...f, amount: Number(f.amount) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="animate-rise">
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="grid gap-5">
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

          <div>
            <Label required>Tipo de gasto</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((c) => {
                const sel = f.type === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setF((p) => ({
                      ...p,
                      type: c.id,
                      fuelType: c.id === "combustible" ? (p.fuelType || "super") : "",
                    }))}
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

          {isFuel ? (
            <>
              <div>
                <Label required>Tipo de combustible</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {FUEL_TYPES.map((ft) => {
                    const final = calcFinalPrice(fuelPrices?.[ft.id] || 0, taxes);
                    const sel = f.fuelType === ft.id;
                    return (
                      <button
                        key={ft.id}
                        type="button"
                        onClick={() => setF((p) => ({ ...p, fuelType: ft.id }))}
                        aria-pressed={sel}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-lg border px-1 py-2.5 text-[11px] transition-all duration-150",
                          "hover:border-foreground/20 active:scale-[0.98]",
                          sel ? "border-primary bg-accent font-semibold text-accent-foreground" : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: ft.dot }} aria-hidden />
                        <span>{ft.label}</span>
                        <span className={cn("tabular text-[10px]", sel ? "text-accent-foreground" : "text-muted-foreground/70")}>
                          ${Math.round(final).toLocaleString("es-AR")}/L
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <Label htmlFor="exp-date-f">Fecha</Label>
                  <Input
                    id="exp-date-f"
                    type="date"
                    value={f.date}
                    onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>
              </div>

              {calcedAmount !== null && Number(f.liters) > 0 && f.fuelType && (
                <FuelBreakdown
                  liters={Number(f.liters)}
                  base={fuelPrices?.[f.fuelType] || 0}
                  taxes={taxes}
                  total={calcedAmount}
                />
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="exp-amount" required>Importe</Label>
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
          )}

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

function FuelBreakdown({ liters, base, taxes, total }) {
  const sub = base * liters;
  return (
    <div className="rounded-xl bg-accent p-4 animate-rise">
      <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-accent-foreground">
        <Info className="size-3" aria-hidden />
        Importe calculado
      </div>
      <dl className="flex flex-col gap-1.5 text-[13px]">
        <div className="flex justify-between text-accent-foreground/80">
          <dt>Subtotal · {liters} L × ${Math.round(base).toLocaleString("es-AR")}</dt>
          <dd className="tabular">${Math.round(sub).toLocaleString("es-AR")}</dd>
        </div>
        {taxes.map((t) => (
          <div key={t.id} className="flex justify-between text-accent-foreground/80">
            <dt>{t.label} · {t.pct}%</dt>
            <dd className="tabular">${Math.round((sub * Number(t.pct)) / 100).toLocaleString("es-AR")}</dd>
          </div>
        ))}
        <div className="mt-1 flex items-baseline justify-between border-t border-accent-foreground/15 pt-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">Total</dt>
          <dd className="font-display text-xl tabular text-accent-foreground">{$fmt(total)}</dd>
        </div>
      </dl>
    </div>
  );
}
