import { useEffect, useState } from "react";
import {
  BarChart3, Car, Download, Moon, Plus, Receipt, Route, Scale, Settings2, Sun, Truck,
} from "lucide-react";
import { VCOLORS } from "@/theme";
import { todayISO } from "@/lib/calc";
import { useFleetStore } from "@/lib/useFleetStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { SyncBadge, ReportSkeleton } from "@/components/shared";
import { ExpenseForm } from "@/components/ExpenseForm";
import { OdometerForm } from "@/components/OdometerForm";
import { VehicleForm } from "@/components/VehicleForm";
import { ReportView } from "@/views/ReportView";
import { CompareView } from "@/views/CompareView";
import { OdometerView } from "@/views/OdometerView";
import { LogView } from "@/views/LogView";
import { FleetView } from "@/views/FleetView";
import { SettingsView } from "@/views/SettingsView";

const NAV = [
  { id: "report",   label: "Informe",     Icon: BarChart3 },
  { id: "compare",  label: "Comparación", Icon: Scale },
  { id: "odometer", label: "Odómetro",    Icon: Route },
  { id: "log",      label: "Gastos",      Icon: Receipt },
  { id: "fleet",    label: "Flota",       Icon: Car },
  { id: "settings", label: "Precios",     Icon: Settings2 },
];

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("fleet2:theme", dark ? "dark" : "light");
  }, [dark]);

  return [dark, () => setDark((d) => !d)];
}

export default function App() {
  const { state, update, replaceAll, loaded, syncState } = useFleetStore();
  const { vehicles, expenses, odometer, fuelPrices, fuelTypes, fuelHistory, taxes } = state;
  const toast = useToast();
  const [dark, toggleTheme] = useTheme();

  const [view, setView] = useState("report");
  const [confirm, setConfirm] = useState(null);

  const [editExpense, setEditExpense] = useState(null);
  const [editOdometer, setEditOdometer] = useState(null);
  const [editVehicle, setEditVehicle] = useState(null);

  const now = new Date();
  const [rMonth, setRMonth] = useState(now.getMonth());
  const [rYear, setRYear] = useState(now.getFullYear());
  const [rVid, setRVid] = useState(null);

  const [cMonth, setCMonth] = useState(now.getMonth());
  const [cYear, setCYear] = useState(now.getFullYear());
  const [cMode, setCMode] = useState("month");

  const askDel = (msg, fn) => setConfirm({ msg, onConfirm: fn });

  const blankExpense = { vehicleId: vehicles[0]?.id || "", type: "combustible", fuelType: fuelTypes[0]?.id || "", amount: "", date: todayISO(), km: "", note: "", liters: "" };
  const blankOdometer = { vehicleId: vehicles[0]?.id || "", km: "", date: todayISO(), note: "" };
  const blankVehicle = { name: "", plate: "", brand: "", model: "", year: "", initialKm: "" };

  function closeForms() {
    setEditExpense(null);
    setEditOdometer(null);
    setEditVehicle(null);
  }

  // ── Vehículos ──────────────────────────────────────────────────────────────
  function saveVehicle(f) {
    if (f.id) {
      update((p) => ({
        ...p,
        vehicles: p.vehicles.map((v) => (v.id === f.id ? { ...v, ...f, initialKm: Number(f.initialKm) || 0 } : v)),
      }));
      toast("Vehículo actualizado");
    } else {
      update((p) => ({
        ...p,
        vehicles: [...p.vehicles, {
          ...f,
          id: `${Date.now()}`,
          initialKm: Number(f.initialKm) || 0,
          colorIdx: p.vehicles.length % VCOLORS.length,
        }],
      }));
      toast("Vehículo guardado");
    }
    setEditVehicle(null);
    setView("fleet");
  }

  function delVehicle(id) {
    const v = vehicles.find((x) => x.id === id);
    askDel(`Se eliminará ${v?.name ?? "el vehículo"} junto con todos sus gastos y lecturas de km.`, () => {
      update((p) => ({
        ...p,
        vehicles: p.vehicles.filter((x) => x.id !== id),
        expenses: p.expenses.filter((e) => e.vehicleId !== id),
        odometer: p.odometer.filter((o) => o.vehicleId !== id),
      }));
      toast("Vehículo eliminado");
    });
  }

  // ── Gastos ─────────────────────────────────────────────────────────────────
  function saveExpense(f) {
    const data = { ...f, amount: Number(f.amount), km: Number(f.km) || 0, liters: Number(f.liters) || 0 };
    if (f.id) {
      update((p) => ({ ...p, expenses: p.expenses.map((e) => (e.id === f.id ? data : e)) }));
      toast("Gasto actualizado");
    } else {
      update((p) => ({ ...p, expenses: [...p.expenses, { ...data, id: `${Date.now()}` }] }));
      toast("Gasto registrado");
    }
    setEditExpense(null);
    setView("log");
  }

  function delExpense(id) {
    askDel("Se eliminará este gasto. La acción no se puede deshacer.", () => {
      update((p) => ({ ...p, expenses: p.expenses.filter((e) => e.id !== id) }));
      toast("Gasto eliminado");
    });
  }

  // ── Odómetro ───────────────────────────────────────────────────────────────
  function saveOdometer(f) {
    const data = { ...f, km: Number(f.km) };
    if (f.id) {
      update((p) => ({ ...p, odometer: p.odometer.map((o) => (o.id === f.id ? data : o)) }));
      toast("Lectura actualizada");
    } else {
      update((p) => ({ ...p, odometer: [...p.odometer, { ...data, id: `${Date.now()}` }] }));
      toast("Lectura guardada");
    }
    setEditOdometer(null);
  }

  function delOdometer(id) {
    askDel("Se eliminará esta lectura de odómetro.", () => {
      update((p) => ({ ...p, odometer: p.odometer.filter((o) => o.id !== id) }));
      toast("Lectura eliminada");
    });
  }

  function getExp(vid, month, year) {
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return (!vid || e.vehicleId === vid)
        && (month === undefined || d.getMonth() === month)
        && (year === undefined || d.getFullYear() === year);
    });
  }

  function exportData() {
    const data = { exportedAt: new Date().toISOString(), vehicles, expenses, odometer, fuelPrices, fuelTypes, fuelHistory, taxes };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `flota-datos-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Backup descargado");
  }

  function importData(data) {
    replaceAll(data);
    toast("Datos importados");
    setView("report");
  }

  const openNewExpense = (vehicleId) => { closeForms(); setEditExpense({ ...blankExpense, ...(vehicleId ? { vehicleId } : {}) }); };
  const openNewOdometer = (vehicleId) => { closeForms(); setEditOdometer({ ...blankOdometer, ...(vehicleId ? { vehicleId } : {}) }); };
  const openNewVehicle = () => { closeForms(); setView("fleet"); setEditVehicle(blankVehicle); };

  const formOpen = Boolean(editExpense || editOdometer || editVehicle);

  return (
    <div className="min-h-dvh bg-background pb-20">
      <Dialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="¿Confirmar eliminación?"
        description={confirm?.msg}
        footer={
          <>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => { confirm.onConfirm(); setConfirm(null); }}
            >
              Sí, eliminar
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>
              Cancelar
            </Button>
          </>
        }
      />

      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-5">
          <div className="flex items-center justify-between gap-3 pt-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background" aria-hidden>
                <Truck className="size-4.5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-lg leading-none">Flota</h1>
                  {loaded && <SyncBadge state={syncState} />}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {loaded ? `${vehicles.length} ${vehicles.length === 1 ? "vehículo" : "vehículos"}` : "Cargando…"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <Tooltip label={dark ? "Modo claro" : "Modo oscuro"} side="bottom">
                <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}>
                  {dark ? <Sun /> : <Moon />}
                </Button>
              </Tooltip>

              {loaded && (view === "report" || view === "log") && (
                <Button size="sm" onClick={() => openNewExpense()}><Plus />Gasto</Button>
              )}
              {loaded && (view === "report" || view === "odometer") && (
                <Button variant="outline" size="sm" onClick={() => openNewOdometer()}><Route />Km</Button>
              )}
              {loaded && view === "fleet" && (
                <Button size="sm" onClick={openNewVehicle}><Plus />Vehículo</Button>
              )}
              {loaded && view === "settings" && (
                <Button variant="outline" size="sm" onClick={exportData}><Download />Exportar</Button>
              )}
            </div>
          </div>

          <nav className="-mx-1 mt-3 flex gap-0.5 overflow-x-auto px-1" aria-label="Secciones">
            {NAV.map((n) => {
              const active = view === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => { setView(n.id); closeForms(); }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-[13px] transition-colors",
                    active
                      ? "border-primary font-semibold text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <n.Icon className="size-3.5" aria-hidden />
                  {n.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-5">
        {!loaded ? (
          <ReportSkeleton />
        ) : (
          <>
            {editExpense && (
              <FormShell title={editExpense.id ? "Editar gasto" : "Nuevo gasto"}>
                <ExpenseForm
                  initial={editExpense}
                  vehicles={vehicles}
                  fuelPrices={fuelPrices}
                  fuelTypes={fuelTypes}
                  taxes={taxes}
                  isEdit={Boolean(editExpense.id)}
                  onSave={saveExpense}
                  onCancel={() => setEditExpense(null)}
                />
              </FormShell>
            )}

            {editOdometer && (
              <FormShell>
                <OdometerForm
                  initial={editOdometer}
                  vehicles={vehicles}
                  odometer={odometer}
                  expenses={expenses}
                  isEdit={Boolean(editOdometer.id)}
                  onSave={saveOdometer}
                  onCancel={() => setEditOdometer(null)}
                />
              </FormShell>
            )}

            {editVehicle && (
              <FormShell title={editVehicle.id ? "Editar vehículo" : "Nuevo vehículo"}>
                <VehicleForm
                  initial={editVehicle}
                  isEdit={Boolean(editVehicle.id)}
                  onSave={saveVehicle}
                  onCancel={() => setEditVehicle(null)}
                />
              </FormShell>
            )}

            {view === "report" && !editExpense && !editOdometer && (
              <ReportView
                vehicles={vehicles} expenses={expenses} odometer={odometer} fuelTypes={fuelTypes}
                rMonth={rMonth} setRMonth={setRMonth} rYear={rYear} setRYear={setRYear}
                rVid={rVid} setRVid={setRVid} getExp={getExp}
                onNewExpense={openNewExpense} onNewOdometer={openNewOdometer}
                onEditExpense={(e) => { closeForms(); setEditExpense(e); }}
                onEditOdometer={(o) => { closeForms(); setEditOdometer(o); }}
                onDeleteExpense={delExpense} onDeleteOdometer={delOdometer}
                onAddVehicle={openNewVehicle}
              />
            )}

            {view === "compare" && !formOpen && (
              <CompareView
                vehicles={vehicles} expenses={expenses} odometer={odometer}
                cMode={cMode} setCMode={setCMode} cMonth={cMonth} setCMonth={setCMonth}
                cYear={cYear} setCYear={setCYear} getExp={getExp}
                onAddVehicle={openNewVehicle}
              />
            )}

            {view === "odometer" && !editOdometer && (
              <OdometerView
                vehicles={vehicles} expenses={expenses} odometer={odometer}
                onNewOdometer={openNewOdometer}
                onEditOdometer={(o) => { closeForms(); setEditOdometer(o); }}
                onDeleteOdometer={delOdometer}
                onAddVehicle={openNewVehicle}
              />
            )}

            {view === "log" && !editExpense && (
              <LogView
                vehicles={vehicles} expenses={expenses} fuelTypes={fuelTypes}
                onNewExpense={openNewExpense}
                onEditExpense={(e) => { closeForms(); setEditExpense(e); }}
                onDeleteExpense={delExpense}
              />
            )}

            {view === "fleet" && !editVehicle && (
              <FleetView
                vehicles={vehicles} expenses={expenses} odometer={odometer} getExp={getExp}
                onAddVehicle={openNewVehicle}
                onEditVehicle={(v) => { closeForms(); setEditVehicle(v); }}
                onDeleteVehicle={delVehicle}
                onNewExpense={openNewExpense}
                onNewOdometer={openNewOdometer}
              />
            )}

            {view === "settings" && !formOpen && (
              <SettingsView
                fuelPrices={fuelPrices}
                setFuelPrices={(fp) => update({ fuelPrices: fp })}
                fuelTypes={fuelTypes}
                setFuelTypes={(ft) => update({ fuelTypes: ft })}
                expenses={expenses}
                fuelHistory={fuelHistory}
                setFuelHistory={(fn) => update((p) => ({ ...p, fuelHistory: typeof fn === "function" ? fn(p.fuelHistory) : fn }))}
                taxes={taxes}
                setTaxes={(t) => update({ taxes: t })}
                toast={toast}
                onImport={importData}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function FormShell({ title, children }) {
  return (
    <div className="mb-5">
      {title && <h2 className="mb-3 text-[15px] font-semibold tracking-tight">{title}</h2>}
      {children}
    </div>
  );
}
