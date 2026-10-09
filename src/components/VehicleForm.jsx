import { useRef, useState } from "react";
import { Camera, Check, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS = [
  { k: "name",      label: "Nombre o apodo",   placeholder: "Furgón Norte", req: true,  span: 2 },
  { k: "plate",     label: "Patente",           placeholder: "AA 123 BB",    req: true,  span: 2 },
  { k: "brand",     label: "Marca",             placeholder: "Ford" },
  { k: "model",     label: "Modelo",            placeholder: "Transit" },
  { k: "year",      label: "Año",               placeholder: "2021",         type: "number" },
  { k: "initialKm", label: "Km iniciales",      placeholder: "0",            type: "number" },
];

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export function VehicleForm({ initial, onSave, onCancel, isEdit }) {
  const [f, setF]       = useState(initial);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const ok     = f.name?.trim() && f.plate?.trim();
  const isSold = Boolean(f.soldAt);

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await compressImage(file);
    setF((p) => ({ ...p, photo: b64 }));
    e.target.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ok || saving) return;
    setSaving(true);
    try { await onSave(f); } finally { setSaving(false); }
  }

  return (
    <Card className="animate-rise">
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

          {/* ── Foto ── */}
          <div className="col-span-2 flex items-center gap-4">
            <div
              className="relative flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-input bg-muted transition-colors hover:border-primary"
              onClick={() => fileRef.current?.click()}
              role="button"
              aria-label="Subir foto del vehículo"
            >
              {f.photo ? (
                <img src={f.photo} alt="Foto del vehículo" className="size-full object-cover" />
              ) : (
                <Camera className="size-6 text-muted-foreground" aria-hidden />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">Foto del vehículo</span>
              <span className="text-[11px] text-muted-foreground">Se mostrará en lugar de las iniciales.</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Camera />Elegir foto
                </Button>
                {f.photo && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setF((p) => ({ ...p, photo: "" }))}
                    className="text-muted-foreground hover:text-danger">
                    <X />Quitar
                  </Button>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
          </div>

          {/* ── Campos de datos ── */}
          {FIELDS.map((fi) => (
            <div key={fi.k} className={fi.span === 2 ? "col-span-2" : ""}>
              <Label htmlFor={`veh-${fi.k}`} required={fi.req}>{fi.label}</Label>
              <Input
                id={`veh-${fi.k}`}
                type={fi.type || "text"}
                inputMode={fi.type === "number" ? "numeric" : undefined}
                value={f[fi.k] || ""}
                onChange={(e) => setF((p) => ({ ...p, [fi.k]: e.target.value }))}
                placeholder={fi.placeholder}
              />
            </div>
          ))}

          {/* ── Service programado ── */}
          <div className="col-span-2 rounded-xl border border-border bg-muted/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Wrench className="size-4 text-muted-foreground" aria-hidden />
              <span className="text-[13px] font-semibold">Service programado</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="veh-serviceDate">Fecha aprox. de service</Label>
                <Input
                  id="veh-serviceDate"
                  type="date"
                  value={f.serviceDate || ""}
                  onChange={(e) => setF((p) => ({ ...p, serviceDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="veh-serviceKm">Km para service</Label>
                <Input
                  id="veh-serviceKm"
                  type="number"
                  inputMode="numeric"
                  value={f.serviceKm || ""}
                  onChange={(e) => setF((p) => ({ ...p, serviceKm: e.target.value }))}
                  placeholder="Ej: 130000"
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Si completás fecha o km, la app te avisará cuando esté próximo o vencido.
            </p>
          </div>

          {/* ── Fecha de venta ── */}
          {isSold && (
            <div className="col-span-2">
              <Label htmlFor="veh-soldAt">Fecha de venta</Label>
              <Input
                id="veh-soldAt"
                type="date"
                value={f.soldAt || ""}
                onChange={(e) => setF((p) => ({ ...p, soldAt: e.target.value }))}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Podés corregir la fecha de venta si fue registrada incorrectamente.
              </p>
            </div>
          )}

          <p className="col-span-2 -mt-1 text-[11px] text-muted-foreground">
            Los km iniciales son el punto de partida para calcular el recorrido mensual.
          </p>

          <div className="col-span-2 flex gap-2 border-t border-border pt-4">
            <Button type="submit" disabled={!ok} loading={saving} className="flex-1">
              {!saving && <Check />}
              {isEdit ? "Guardar cambios" : "Guardar vehículo"}
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


