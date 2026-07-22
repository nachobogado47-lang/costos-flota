import { useState } from "react";
import { C, S } from "../theme.js";

export function OdometerForm({ initial, vehicles, onSave, onCancel, isEdit }) {
  const [f, setF] = useState(initial);
  const ok = f.vehicleId && f.km;

  return (
    <div style={{ ...S.card, border: `1.5px solid ${C.green}44` }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: C.green, marginBottom: 14 }}>
        🛣 {isEdit ? "Editar lectura" : "Nueva lectura de odómetro"}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={S.label}>Vehículo <span style={{ color: C.rose }}>*</span></label>
          <select value={f.vehicleId} onChange={(e) => setF((p) => ({ ...p, vehicleId: e.target.value }))} style={S.input}>
            <option value="">— Seleccioná —</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={S.label}>Km del odómetro <span style={{ color: C.rose }}>*</span></label>
            <input type="number" value={f.km} onChange={(e) => setF((p) => ({ ...p, km: e.target.value }))} placeholder="Ej: 125430" style={S.input} />
          </div>
          <div>
            <label style={S.label}>Fecha</label>
            <input type="date" value={f.date} onChange={(e) => setF((p) => ({ ...p, date: e.target.value }))} style={S.input} />
          </div>
        </div>

        <div>
          <label style={S.label}>Nota (opcional)</label>
          <input value={f.note} onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))} placeholder="Ej: Inicio de mes, fin de mes…" style={S.input} />
        </div>
      </div>

      <div style={{ height: 1, background: C.bone, margin: "14px 0" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => ok && onSave(f)} disabled={!ok} style={{ ...S.btn(ok ? C.green : C.bone, ok ? C.white : C.mist), flex: 1, justifyContent: "center", padding: "11px", cursor: ok ? "pointer" : "default" }}>
          ✓ {isEdit ? "Guardar cambios" : "Guardar lectura"}
        </button>
        <button onClick={onCancel} style={{ ...S.btn(C.paper, C.slate, C.bone), padding: "11px 16px" }}>Cancelar</button>
      </div>
    </div>
  );
}
