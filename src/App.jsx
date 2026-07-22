import { useState } from "react";
import { C, S, VCOLORS } from "./theme.js";
import { todayISO } from "./lib/calc.js";
import { useFleetStore } from "./lib/useFleetStore.js";
import { ConfirmModal, SyncBadge } from "./components/ui.jsx";
import { ExpenseForm } from "./components/ExpenseForm.jsx";
import { OdometerForm } from "./components/OdometerForm.jsx";
import { VehicleForm } from "./components/VehicleForm.jsx";
import { ReportView } from "./views/ReportView.jsx";
import { CompareView } from "./views/CompareView.jsx";
import { OdometerView } from "./views/OdometerView.jsx";
import { LogView } from "./views/LogView.jsx";
import { FleetView } from "./views/FleetView.jsx";
import { SettingsView } from "./views/SettingsView.jsx";

const NAV = [
  { id: "report",   label: "📊 Informe"     },
  { id: "compare",  label: "⚖️ Comparación" },
  { id: "odometer", label: "🛣 Odómetro"    },
  { id: "log",      label: "🧾 Gastos"      },
  { id: "fleet",    label: "🚗 Flota"       },
  { id: "settings", label: "⚙️ Precios"     },
];

export default function App() {
  const { state, update, replaceAll, loaded, syncState } = useFleetStore();
  const { vehicles, expenses, odometer, fuelPrices, fuelHistory, taxes } = state;

  const [view, setView] = useState("report");
  const [toastMsg, setToastMsg] = useState(null);
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

  const toast = (m) => { setToastMsg(m); setTimeout(() => setToastMsg(null), 2500); };
  const askDel = (msg, fn) => setConfirm({ msg, onConfirm: () => { fn(); setConfirm(null); } });

  const blankExpense = { vehicleId: vehicles[0]?.id || "", type: "combustible", fuelType: "super", amount: "", date: todayISO(), km: "", note: "", liters: "" };
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
    askDel("Se eliminará el vehículo y todos sus gastos y lecturas de km.", () => {
      update((p) => ({
        ...p,
        vehicles: p.vehicles.filter((v) => v.id !== id),
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
    askDel("Se eliminará este gasto. Esta acción no se puede deshacer.", () => {
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
    const data = { exportedAt: new Date().toISOString(), vehicles, expenses, odometer, fuelPrices, fuelHistory, taxes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flota-datos-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importData(data) {
    replaceAll(data);
    toast("Datos importados");
    setView("report");
  }

  const openNewExpense = (vehicleId) => { closeForms(); setEditExpense({ ...blankExpense, ...(vehicleId ? { vehicleId } : {}) }); };
  const openNewOdometer = (vehicleId) => { closeForms(); setEditOdometer({ ...blankOdometer, ...(vehicleId ? { vehicleId } : {}) }); };
  const openNewVehicle = () => { closeForms(); setView("fleet"); setEditVehicle(blankVehicle); };

  if (!loaded) {
    return (
      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", background: C.paper, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: C.mist, fontSize: 14 }}>
        Cargando…
      </div>
    );
  }

  const formOpen = Boolean(editExpense || editOdometer || editVehicle);

  return (
    <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", background: C.paper, minHeight: "100vh", paddingBottom: 80 }}>
      {toastMsg && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: C.ink, color: C.white, padding: "10px 20px", borderRadius: 99, fontSize: 13, zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,.18)", whiteSpace: "nowrap" }}>
          ✓ {toastMsg}
        </div>
      )}

      {confirm && <ConfirmModal msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

      <div style={{ background: C.white, borderBottom: `1px solid ${C.bone}`, padding: "0 1.25rem" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 0", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>🚚</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: C.ink }}>Flota</span>
                  <SyncBadge state={syncState} />
                </div>
                <div style={{ fontSize: 11, color: C.mist }}>
                  {vehicles.length} vehículo{vehicles.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {(view === "report" || view === "log") && (
                <button style={S.btn(C.blue, C.white)} onClick={() => openNewExpense()}>+ Gasto</button>
              )}
              {(view === "report" || view === "odometer") && (
                <button style={S.btn(C.greenSoft, C.green, C.green + "44")} onClick={() => openNewOdometer()}>🛣 Registrar km</button>
              )}
              {view === "fleet" && (
                <button style={S.btn(C.blue, C.white)} onClick={openNewVehicle}>+ Vehículo</button>
              )}
              {view === "settings" && (
                <button style={S.btn(C.paper, C.slate, C.bone)} onClick={exportData}>⬇ Exportar datos</button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 0, marginTop: 12, overflowX: "auto" }}>
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => { setView(n.id); closeForms(); }}
                style={{
                  padding: "9px 16px", background: "transparent", border: "none", whiteSpace: "nowrap",
                  borderBottom: view === n.id ? `2.5px solid ${C.blue}` : "2.5px solid transparent",
                  color: view === n.id ? C.blue : C.slate,
                  fontSize: 13, fontWeight: view === n.id ? 600 : 400, cursor: "pointer",
                }}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.25rem" }}>
        {editExpense && (
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: "1rem" }}>
              {editExpense.id ? "Editar gasto" : "Nuevo gasto"}
            </div>
            <ExpenseForm
              initial={editExpense}
              vehicles={vehicles}
              fuelPrices={fuelPrices}
              taxes={taxes}
              isEdit={Boolean(editExpense.id)}
              onSave={saveExpense}
              onCancel={() => setEditExpense(null)}
            />
          </div>
        )}

        {editOdometer && (
          <div style={{ marginBottom: "1.25rem" }}>
            <OdometerForm
              initial={editOdometer}
              vehicles={vehicles}
              isEdit={Boolean(editOdometer.id)}
              onSave={saveOdometer}
              onCancel={() => setEditOdometer(null)}
            />
          </div>
        )}

        {editVehicle && (
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: "1rem" }}>
              {editVehicle.id ? "Editar vehículo" : "Nuevo vehículo"}
            </div>
            <VehicleForm
              initial={editVehicle}
              isEdit={Boolean(editVehicle.id)}
              onSave={saveVehicle}
              onCancel={() => setEditVehicle(null)}
            />
          </div>
        )}

        {view === "report" && !editExpense && !editOdometer && (
          <ReportView
            vehicles={vehicles} expenses={expenses} odometer={odometer}
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
            vehicles={vehicles} expenses={expenses}
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
            fuelHistory={fuelHistory}
            setFuelHistory={(fn) => update((p) => ({ ...p, fuelHistory: typeof fn === "function" ? fn(p.fuelHistory) : fn }))}
            taxes={taxes}
            setTaxes={(t) => update({ taxes: t })}
            toast={toast}
            onImport={importData}
          />
        )}
      </div>
    </div>
  );
}
