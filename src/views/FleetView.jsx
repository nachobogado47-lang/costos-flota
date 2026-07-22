import { C, S, VCOLORS } from "../theme.js";
import { $fmt, kmFmt, totalOf, monthlyKm, latestKm } from "../lib/calc.js";
import { VehicleAvatar, EmptyState } from "../components/ui.jsx";

export function FleetView({
  vehicles, expenses, odometer, getExp,
  onAddVehicle, onEditVehicle, onDeleteVehicle, onNewExpense, onNewOdometer,
}) {
  if (vehicles.length === 0) {
    return (
      <EmptyState icon="🚗" title="No hay vehículos registrados.">
        <button style={S.btn(C.blue, C.white)} onClick={onAddVehicle}>+ Agregar vehículo</button>
      </EmptyState>
    );
  }

  const now = new Date();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {vehicles.map((v) => {
        const allExps = getExp(v.id);
        const vColor = VCOLORS[v.colorIdx || 0];
        const kmMonth = monthlyKm(odometer, expenses, v, now.getMonth(), now.getFullYear());
        const latest = latestKm(odometer, expenses, v);

        return (
          <div key={v.id} style={{ ...S.card, borderLeft: `4px solid ${vColor}`, paddingLeft: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <VehicleAvatar v={v} size={46} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: C.mist }}>
                    {v.plate}{v.brand ? ` · ${v.brand} ${v.model}` : ""}{v.year ? ` (${v.year})` : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button onClick={() => onNewExpense(v.id)} style={{ ...S.btn(C.blueSoft, C.blue, C.blue + "33"), padding: "6px 10px", fontSize: 12 }}>+ Gasto</button>
                <button onClick={() => onNewOdometer(v.id)} style={{ ...S.btn(C.greenSoft, C.green, C.green + "33"), padding: "6px 10px", fontSize: 12 }}>🛣 km</button>
                <button onClick={() => onEditVehicle(v)} style={{ ...S.btn(C.blueSoft, C.blue, C.blue + "33"), padding: "6px 10px", fontSize: 12 }} title="Editar" aria-label="Editar vehículo">✏️</button>
                <button onClick={() => onDeleteVehicle(v.id)} style={{ ...S.btn(C.roseSoft, C.rose, C.rose + "33"), padding: "6px 10px", fontSize: 12 }} title="Eliminar" aria-label="Eliminar vehículo">🗑</button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: C.slate, background: C.paper, padding: "4px 10px", borderRadius: 99 }}>
                🛣 {kmFmt(latest)} actuales
              </span>
              {kmMonth !== null && (
                <span style={{ fontSize: 12, color: C.green, background: C.greenSoft, padding: "4px 10px", borderRadius: 99 }}>
                  📅 {kmFmt(kmMonth)} este mes
                </span>
              )}
              <span style={{ fontSize: 12, color: C.slate, background: C.paper, padding: "4px 10px", borderRadius: 99 }}>
                🧾 {allExps.length} gastos · {$fmt(totalOf(allExps))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
