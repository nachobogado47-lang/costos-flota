import { useRef, useState } from "react";
import {
  Check, Database, Fuel, History, Lock, Pencil, Percent, Plus, TriangleAlert, Upload, X,
} from "lucide-react";
import { DOT_COLORS } from "@/theme";
import { calcFinalPrice, todayISO } from "@/lib/calc";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";

/** Un id estable a partir del nombre, para que el gasto no dependa del label. */
function slugify(label, taken) {
  const base = label.trim().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "combustible";
  let id = base;
  let n = 2;
  while (taken.includes(id)) id = `${base}-${n++}`;
  return id;
}

export function SettingsView({
  fuelPrices, setFuelPrices, fuelTypes, setFuelTypes, expenses,
  fuelHistory, setFuelHistory, taxes, setTaxes, toast, onImport,
}) {
  const [editingPrices, setEditingPrices] = useState(false);
  const [draftPrices, setDraftPrices] = useState({ ...fuelPrices });
  const [draftTypes, setDraftTypes] = useState(fuelTypes.map((t) => ({ ...t })));
  const [editingTaxes, setEditingTaxes] = useState(false);
  const [draftTaxes, setDraftTaxes] = useState(taxes.map((t) => ({ ...t })));
  const [importing, setImporting] = useState(false);
  const fileInput = useRef(null);

  /** Cuántos gastos quedarían huérfanos si se quita un tipo. */
  const usageOf = (id) => expenses.filter((e) => e.fuelType === id).length;

  function savePrices() {
    const clean = draftTypes
      .map((t) => ({ ...t, label: t.label.trim() }))
      .filter((t) => t.label);

    if (!clean.length) {
      toast("Dejá al menos un tipo de combustible.", "error");
      return;
    }

    const prices = Object.fromEntries(clean.map((t) => [t.id, Number(draftPrices[t.id]) || 0]));

    setFuelTypes(clean);
    setFuelPrices(prices);
    setFuelHistory((p) => [{ id: `${Date.now()}`, date: todayISO(), prices }, ...p]);
    setEditingPrices(false);
    toast("Combustibles actualizados");
  }

  function startEditingPrices() {
    setDraftPrices({ ...fuelPrices });
    setDraftTypes(fuelTypes.map((t) => ({ ...t })));
    setEditingPrices(true);
  }

  function addFuelType() {
    const id = slugify("nuevo", draftTypes.map((t) => t.id));
    setDraftTypes((p) => [...p, { id, label: "", dot: DOT_COLORS[p.length % DOT_COLORS.length] }]);
    setDraftPrices((p) => ({ ...p, [id]: "" }));
  }

  function removeFuelType(id) {
    const used = usageOf(id);
    if (used > 0) {
      toast(`No se puede quitar: hay ${used} ${used === 1 ? "gasto" : "gastos"} con ese combustible.`, "error");
      return;
    }
    setDraftTypes((p) => p.filter((t) => t.id !== id));
  }

  function saveTaxes() {
    setTaxes(draftTaxes.map((t) => ({ ...t, pct: Number(t.pct) || 0 })));
    setEditingTaxes(false);
    toast("Impuestos actualizados");
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object" || !Array.isArray(data.vehicles)) {
          throw new Error("El archivo no tiene el formato esperado.");
        }
        onImport(data);
      } catch (err) {
        toast(`No se pudo importar: ${err.message}`, "error");
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      toast("No se pudo leer el archivo.", "error");
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const totalTaxPct = taxes.reduce((s, t) => s + Number(t.pct), 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Precios */}
      <Card className="animate-rise">
        <CardContent className="pt-5">
          <SectionHead
            icon={Fuel}
            title="Combustibles"
            desc={editingPrices ? "Agregá, renombrá o quitá tipos" : "Precio base por litro, sin impuestos"}
            action={
              !editingPrices ? (
                <Button variant="outline" size="sm" onClick={startEditingPrices}>
                  <Pencil />Administrar
                </Button>
              ) : (
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={savePrices} className="bg-service text-white hover:bg-service/90">
                    <Check />Guardar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingPrices(false)}>Cancelar</Button>
                </div>
              )
            }
          />

          {editingPrices ? (
            <div className="flex flex-col gap-2">
              {draftTypes.map((ft, i) => {
                const used = usageOf(ft.id);
                return (
                  <div key={ft.id} className="grid grid-cols-[auto_1fr_112px_32px] items-center gap-2">
                    <ColorPicker
                      value={ft.dot}
                      onChange={(dot) => setDraftTypes((p) => p.map((x, j) => (j === i ? { ...x, dot } : x)))}
                      label={ft.label || "combustible"}
                    />
                    <Input
                      value={ft.label}
                      onChange={(e) => setDraftTypes((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                      placeholder="Nombre del combustible"
                      aria-label="Nombre del combustible"
                    />
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={draftPrices[ft.id] ?? ""}
                        onChange={(e) => setDraftPrices((p) => ({ ...p, [ft.id]: e.target.value }))}
                        className="pl-5"
                        placeholder="0,00"
                        aria-label={`Precio base de ${ft.label || "combustible"}`}
                      />
                    </div>
                    <Tooltip label={used > 0 ? `${used} ${used === 1 ? "gasto usa" : "gastos usan"} este tipo` : "Quitar"}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeFuelType(ft.id)}
                        aria-label={`Quitar ${ft.label || "combustible"}`}
                        className={cn(
                          "text-muted-foreground",
                          used > 0 ? "opacity-40" : "hover:bg-danger-soft hover:text-danger",
                        )}
                      >
                        {used > 0 ? <Lock /> : <X />}
                      </Button>
                    </Tooltip>
                  </div>
                );
              })}
              <Button variant="outline" size="sm" className="mt-1 w-full border-dashed" onClick={addFuelType}>
                <Plus />Agregar combustible
              </Button>
              <Notice>
                Los nuevos registros usarán estos precios. Los gastos ya cargados no cambian.
              </Notice>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {fuelTypes.map((ft) => {
                const base = fuelPrices[ft.id] || 0;
                const final = calcFinalPrice(base, taxes);
                const used = usageOf(ft.id);
                return (
                  <div key={ft.id} className="rounded-xl bg-muted/70 p-3.5">
                    <div className="mb-2 flex items-center gap-1.5">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: ft.dot }} aria-hidden />
                      <span className="truncate text-[13px] font-semibold">{ft.label}</span>
                    </div>
                    <div className="text-[11px] tabular text-muted-foreground">
                      Base ${Number(base).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="mt-1 text-[15px] font-semibold tabular text-fuel">
                      ${Math.round(final).toLocaleString("es-AR")}
                      <span className="text-[11px] font-normal text-muted-foreground">/L</span>
                    </div>
                    <div className="mt-1.5 text-[10px] text-muted-foreground">
                      {used > 0 ? `${used} ${used === 1 ? "carga" : "cargas"}` : "sin uso"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impuestos */}
      <Card className="animate-rise" style={{ animationDelay: "60ms" }}>
        <CardContent className="pt-5">
          <SectionHead
            icon={Percent}
            title="Impuestos sobre combustible"
            desc="Se aplican sobre el precio base"
            action={
              !editingTaxes ? (
                <Button variant="outline" size="sm" onClick={() => { setDraftTaxes(taxes.map((t) => ({ ...t }))); setEditingTaxes(true); }}>
                  <Pencil />Editar
                </Button>
              ) : (
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={saveTaxes} className="bg-service text-white hover:bg-service/90">
                    <Check />Guardar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingTaxes(false)}>Cancelar</Button>
                </div>
              )
            }
          />

          {editingTaxes ? (
            <div className="flex flex-col gap-2">
              {draftTaxes.map((t, i) => (
                <div key={t.id} className="grid grid-cols-[1fr_96px_32px] items-center gap-2">
                  <Input
                    value={t.label}
                    onChange={(e) => setDraftTaxes((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    placeholder="Nombre del impuesto"
                    aria-label="Nombre del impuesto"
                  />
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      value={t.pct}
                      onChange={(e) => setDraftTaxes((p) => p.map((x, j) => (j === i ? { ...x, pct: e.target.value } : x)))}
                      className="pr-7"
                      aria-label="Porcentaje"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">%</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDraftTaxes((p) => p.filter((x) => x.id !== t.id))}
                    aria-label={`Quitar ${t.label}`}
                    className="text-muted-foreground hover:bg-danger-soft hover:text-danger"
                  >
                    <X />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="mt-1 w-full border-dashed"
                onClick={() => setDraftTaxes((p) => [...p, { id: `${Date.now()}`, label: "", pct: 0 }])}
              >
                <Plus />Agregar impuesto
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {taxes.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-muted/70 px-3 py-2">
                  <span className="text-[13px]">{t.label}</span>
                  <span className="text-[15px] font-semibold tabular">{t.pct}%</span>
                </div>
              ))}
              <div className="mt-1 flex items-center justify-between rounded-lg bg-insurance-soft px-3 py-2">
                <span className="text-[13px] font-semibold text-insurance">Total impuestos</span>
                <span className="text-[15px] font-semibold tabular text-insurance">{totalTaxPct}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup */}
      <Card className="animate-rise" style={{ animationDelay: "120ms" }}>
        <CardContent className="pt-5">
          <SectionHead icon={Database} title="Copia de seguridad" desc="Restaurá toda la información desde un export" />
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            className="sr-only"
            tabIndex={-1}
          />
          <Button
            variant="outline"
            className="w-full border-dashed"
            loading={importing}
            onClick={() => fileInput.current?.click()}
          >
            {!importing && <Upload />}
            Importar datos desde JSON
          </Button>
          <Notice>Importar reemplaza toda la información actual por la del archivo.</Notice>
        </CardContent>
      </Card>

      {/* Historial */}
      {fuelHistory.length > 0 && (
        <Card className="animate-rise" style={{ animationDelay: "180ms" }}>
          <CardContent className="pt-5">
            <SectionHead icon={History} title="Historial de precios" desc={`${fuelHistory.length} ${fuelHistory.length === 1 ? "actualización" : "actualizaciones"}`} />
            <ol className="flex flex-col gap-2">
              {fuelHistory.map((h, i) => (
                <li
                  key={h.id}
                  className={cn(
                    "rounded-xl p-3.5",
                    i === 0 ? "bg-service-soft ring-1 ring-service/20" : "bg-muted/70",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={cn("text-[13px] font-semibold", i === 0 && "text-service")}>
                      {new Date(`${h.date}T12:00:00`).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                    {i === 0 && <Badge variant="success">Actual</Badge>}
                  </div>
                  {/* Se listan las claves del snapshot, no el catálogo actual:
                      un tipo que ya no existe igual debe verse en su historial. */}
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {Object.entries(h.prices).map(([id, price]) => (
                      <div key={id} className="text-[11px]">
                        <span className="text-muted-foreground">
                          {fuelTypes.find((t) => t.id === id)?.label ?? id}{" "}
                        </span>
                        <span className={cn("font-semibold tabular", i === 0 ? "text-service" : "text-foreground")}>
                          ${Number(price || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Ciclo por la paleta: un clic pasa al siguiente color disponible. */
function ColorPicker({ value, onChange, label }) {
  const idx = Math.max(0, DOT_COLORS.indexOf(value));
  return (
    <Tooltip label="Cambiar color">
      <button
        type="button"
        onClick={() => onChange(DOT_COLORS[(idx + 1) % DOT_COLORS.length])}
        aria-label={`Cambiar el color de ${label}`}
        className="flex size-9 items-center justify-center rounded-lg border border-input bg-card transition-colors hover:bg-muted"
      >
        <span className="size-3.5 rounded-full" style={{ backgroundColor: value }} aria-hidden />
      </button>
    </Tooltip>
  );
}

function SectionHead({ icon: Icon, title, desc, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold leading-tight">{title}</h2>
          {desc && <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Notice({ children }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg bg-repair-soft px-3 py-2.5 text-[12px] text-repair">
      <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
