import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS = [
  {
    k: "name",
    label: "Nombre o apodo",
    placeholder: "Furgón Norte",
    req: true,
    span: 2,
  },
  {
    k: "plate",
    label: "Patente",
    placeholder: "AA 123 BB",
    req: true,
    span: 2,
  },
  {
    k: "brand",
    label: "Marca",
    placeholder: "Ford",
  },
  {
    k: "model",
    label: "Modelo",
    placeholder: "Transit",
  },
  {
    k: "year",
    label: "Año",
    placeholder: "2021",
    type: "number",
  },
  {
    k: "initialKm",
    label: "Km iniciales",
    placeholder: "0",
    type: "number",
  },
];

export function VehicleForm({
  initial,
  onSave,
  onCancel,
  isEdit,
}) {
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);

  const ok = f.name?.trim() && f.plate?.trim();

  const isSold = Boolean(f.soldAt);

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

  function reactivate() {
    setF((p) => ({
      ...p,
      soldAt: null,
    }));
  }

  return (
    <Card className="animate-rise">
      <CardContent className="pt-5">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4"
        >
          {isSold && (
            <div className="col-span-2 rounded-lg bg-danger-soft px-3 py-3 text-[12px] text-danger">
              <div className="mb-1 font-semibold">
                Este vehículo está marcado como vendido.
              </div>

              {f.soldAt && (
                <div>
                  Fecha de venta: {formatDate(f.soldAt)}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={reactivate}
              >
                <RotateCcw />
                Reactivar vehículo
              </Button>
            </div>
          )}

          {FIELDS.map((fi) => (
            <div
              key={fi.k}
              className={fi.span === 2 ? "col-span-2" : ""}
            >
              <Label
                htmlFor={`veh-${fi.k}`}
                required={fi.req}
              >
                {fi.label}
              </Label>

              <Input
                id={`veh-${fi.k}`}
                type={fi.type || "text"}
                inputMode={
                  fi.type === "number"
                    ? "numeric"
                    : undefined
                }
                value={f[fi.k] || ""}
                onChange={(e) =>
                  setF((p) => ({
                    ...p,
                    [fi.k]: e.target.value,
                  }))
                }
                placeholder={fi.placeholder}
              />
            </div>
          ))}

          <p className="col-span-2 -mt-1 text-[11px] text-muted-foreground">
            Los km iniciales son el punto de partida para calcular el recorrido mensual.
          </p>

          <div className="col-span-2 flex gap-2 border-t border-border pt-4">
            <Button
              type="submit"
              disabled={!ok}
              loading={saving}
              className="flex-1"
            >
              {!saving && <Check />}
              {isEdit
                ? "Guardar cambios"
                : "Guardar vehículo"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
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
