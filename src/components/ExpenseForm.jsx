import { useState } from "react";
import { C, S, CATEGORIES, FUEL_TYPES } from "../theme.js";
import { calcFinalPrice, calcFuelAmount } from "../lib/calc.js";

export function ExpenseForm({ initial, vehicles, fuelPrices, taxes, onSave, onCancel, isEdit }) {
  const [f, setF] = useState(initial);
  const isFuel = f.type === "combustible";

  // En combustible el importe se deriva de litros × precio final, nunca se tipea.
  const calcedAmount = isFuel && f.liters && f.fuelType
    ? calcFuelAmount(Number(f.liters), f.fuelType, fuelPrices, taxes)
    : null;

  const ok = f.vehicleId && (isFuel ? (f.liters && f.fuelType) : f.amount);

  function handleSave() {
    if (!ok) return;
    onSave(isFuel
      ? { ...f, amount: calcedAmount, liters: Number(f.liters) }
      : { ...f, amount: Number(f.amount) });
  }

  return (
    <div style={S.card}>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={S.label}>Vehículo <span style={{ color: C.rose }}>*</span></label>
          <select value={f.vehicleId} onChange={(e) => setF((p) => ({ ...p, vehicleId: e.target.value }))} style={S.input}>
            <option value="">— Seleccioná —</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>)}
          </select>
        </div>

        <div>
          <label style={S.label}>Tipo de gasto <span style={{ color: C.rose }}>*</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setF((p) => ({ ...p, type: c.id, fuelType: c.id === "combustible" ? (p.fuelType || "super") : "" }))}
                style={{
                  padding: "9px 6px", borderRadius: 10, fontSize: 12, cursor: "pointer",
                  border: f.type === c.id ? `2px solid ${c.color}` : `1.5px solid ${C.bone}`,
                  background: f.type === c.id ? c.bg : C.white,
                  color: f.type === c.id ? c.color : C.slate,
                  fontWeight: f.type === c.id ? 600 : 400,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}
              >
                <span style={{ fontSize: 16 }}>{c.icon}</span>{c.label}
              </button>
            ))}
          </div>
        </div>

        {isFuel ? (
          <>
            <div>
              <label style={S.label}>Tipo de combustible <span style={{ color: C.rose }}>*</span></label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                {FUEL_TYPES.map((ft) => {
                  const final = calcFinalPrice(fuelPrices?.[ft.id] || 0, taxes);
                  const sel = f.fuelType === ft.id;
                  return (
                    <button
                      key={ft.id}
                      onClick={() => setF((p) => ({ ...p, fuelType: ft.id }))}
                      style={{
                        padding: "9px 4px", borderRadius: 10, fontSize: 11, cursor: "pointer",
                        border: sel ? `2px solid ${C.blue}` : `1.5px solid ${C.bone}`,
                        background: sel ? C.blueSoft : C.white,
                        color: sel ? C.blue : C.slate,
                        fontWeight: sel ? 600 : 400,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{ft.icon}</span>
                      <span>{ft.label}</span>
                      <span style={{ fontSize: 10, color: sel ? C.blue : C.mist }}>
                        ${Math.round(final).toLocaleString("es-AR")}/L
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={S.label}>Litros cargados <span style={{ color: C.rose }}>*</span></label>
                <input type="number" value={f.liters || ""} onChange={(e) => setF((p) => ({ ...p, liters: e.target.value }))} placeholder="0.00" style={S.input} />
              </div>
              <div>
                <label style={S.label}>Fecha</label>
                <input type="date" value={f.date} onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))} style={S.input} />
              </div>
            </div>

            {calcedAmount !== null && Number(f.liters) > 0 && f.fuelType && (
              <div style={{ background: C.blueSoft, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.blue, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Desglose del importe calculado
                </div>
                {(() => {
                  const base = fuelPrices?.[f.fuelType] || 0;
                  const lts = Number(f.liters);
                  const sub = base * lts;
                  const rows = taxes.map((t) => ({ label: t.label, val: (sub * Number(t.pct)) / 100 }));
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", color: C.slate }}>
                        <span>Subtotal ({lts} L × ${Math.round(base).toLocaleString("es-AR")})</span>
                        <span>${Math.round(sub).toLocaleString("es-AR")}</span>
                      </div>
                      {rows.map((r) => (
                        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", color: C.slate }}>
                          <span>{r.label}</span>
                          <span>${Math.round(r.val).toLocaleString("es-AR")}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: C.blue, borderTop: `1px solid ${C.blue}33`, paddingTop: 6, marginTop: 2, fontSize: 15 }}>
                        <span>Total</span>
                        <span>${calcedAmount.toLocaleString("es-AR")}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={S.label}>Importe ($) <span style={{ color: C.rose }}>*</span></label>
              <input type="number" value={f.amount} onChange={(e) => setF((p) => ({ ...p, amount: e.target.value }))} placeholder="0" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Fecha</label>
              <input type="date" value={f.date} onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))} style={S.input} />
            </div>
          </div>
        )}

        <div>
          <label style={S.label}>
            Km odómetro <span style={{ fontSize: 11, fontWeight: 400, color: C.mist }}>(opcional)</span>
          </label>
          <input type="number" value={f.km} onChange={(e) => setF((p) => ({ ...p, km: e.target.value }))} placeholder="Lectura actual" style={S.input} />
        </div>

        <div>
          <label style={S.label}>Nota (opcional)</label>
          <input value={f.note} onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))} placeholder="Proveedor, descripción…" style={S.input} />
        </div>
      </div>

      <div style={{ height: 1, background: C.bone, margin: "14px 0" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSave} disabled={!ok} style={{ ...S.btn(ok ? C.blue : C.bone, ok ? C.white : C.mist), flex: 1, justifyContent: "center", padding: "11px", cursor: ok ? "pointer" : "default" }}>
          ✓ {isEdit ? "Guardar cambios" : "Guardar gasto"}
        </button>
        <button onClick={onCancel} style={{ ...S.btn(C.paper, C.slate, C.bone), padding: "11px 16px" }}>Cancelar</button>
      </div>
    </div>
  );
}
