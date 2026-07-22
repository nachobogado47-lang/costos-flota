import { useState } from "react";
import { C, S } from "../theme.js";

const FIELDS = [
  { k: "name",      label: "Nombre o apodo",            placeholder: "Ej: Furgón Norte", req: true },
  { k: "plate",     label: "Patente",                   placeholder: "AA 123 BB",        req: true },
  { k: "brand",     label: "Marca",                     placeholder: "Ford" },
  { k: "model",     label: "Modelo",                    placeholder: "Transit" },
  { k: "year",      label: "Año",                       placeholder: "2021" },
  { k: "initialKm", label: "Km iniciales del odómetro", placeholder: "0" },
];

export function VehicleForm({ initial, onSave, onCancel, isEdit }) {
  const [f, setF] = useState(initial);
  const ok = f.name && f.plate;

  return (
    <div style={S.card}>
      <div style={{ display: "grid", gap: 14 }}>
        {FIELDS.map((fi) => (
          <div key={fi.k}>
            <label style={S.label}>
              {fi.label}{fi.req && <span style={{ color: C.rose }}> *</span>}
            </label>
            <input
              value={f[fi.k] || ""}
              onChange={(e) => setF((p) => ({ ...p, [fi.k]: e.target.value }))}
              placeholder={fi.placeholder}
              style={S.input}
            />
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: C.bone, margin: "14px 0" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => ok && onSave(f)} disabled={!ok} style={{ ...S.btn(ok ? C.blue : C.bone, ok ? C.white : C.mist), flex: 1, justifyContent: "center", padding: "11px", cursor: ok ? "pointer" : "default" }}>
          ✓ {isEdit ? "Guardar cambios" : "Guardar vehículo"}
        </button>
        <button onClick={onCancel} style={{ ...S.btn(C.paper, C.slate, C.bone), padding: "11px 16px" }}>Cancelar</button>
      </div>
    </div>
  );
}
