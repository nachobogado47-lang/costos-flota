import { C, S, VCOLORS } from "../theme.js";
import { kmFmt, latestKm, atNoon } from "../lib/calc.js";
import { VehicleAvatar, ActionBtns, EmptyState } from "../components/ui.jsx";

export function OdometerView({ vehicles, expenses, odometer, onNewOdometer, onEditOdometer, onDeleteOdometer, onAddVehicle }) {
  if (vehicles.length === 0) {
    return (
      <EmptyState icon="🛣" title="Primero agregá un vehículo desde la pestaña Flota.">
        <button style={S.btn(C.blue, C.white)} onClick={onAddVehicle}>+ Agregar vehículo</button>
      </EmptyState>
    );
  }

  return (
    <>
      {vehicles.map((v) => {
        const vOdom = odometer
          .filter((o) => o.vehicleId === v.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        const vColor = VCOLORS[v.colorIdx || 0];
        const latest = latestKm(odometer, expenses, v);

        return (
          <div key={v.id} style={{ ...S.card, marginBottom: 12, borderLeft: `4px solid ${vColor}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <VehicleAvatar v={v} size={38} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: C.mist }}>{v.plate}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: C.mist, marginBottom: 2 }}>ÚLTIMO REGISTRO</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: vColor }}>{kmFmt(latest)}</div>
                </div>
                <button onClick={() => onNewOdometer(v.id)} style={{ ...S.btn(C.greenSoft, C.green, C.green + "44"), padding: "7px 12px", fontSize: 12 }}>
                  + Lectura
                </button>
              </div>
            </div>

            {vOdom.length === 0 ? (
              <div style={{ fontSize: 13, color: C.mist }}>Sin lecturas manuales todavía.</div>
            ) : (
              <>
                <span style={S.section}>Historial de lecturas</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {vOdom.map((o, i, arr) => {
                    const prev = arr[i + 1];
                    const recorrido = prev ? Math.max(0, o.km - prev.km) : null;
                    return (
                      <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: C.paper, borderRadius: 10 }}>
                        <span style={{ fontSize: 20 }}>🛣</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{kmFmt(o.km)}</div>
                          <div style={{ fontSize: 11, color: C.mist }}>
                            {atNoon(o.date).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                            {o.note && ` · ${o.note}`}
                            {recorrido !== null && (
                              <span style={{ color: C.green, fontWeight: 500 }}> · +{kmFmt(recorrido)} desde anterior</span>
                            )}
                          </div>
                        </div>
                        <ActionBtns onEdit={() => onEditOdometer(o)} onDelete={() => onDeleteOdometer(o.id)} />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
