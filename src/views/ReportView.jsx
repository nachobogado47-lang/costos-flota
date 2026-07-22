import { C, S, CATEGORIES, MONTHS, YEARS, VCOLORS, FUEL_TYPES } from "../theme.js";
import { $fmt, kmFmt, cat, totalOf, monthlyKm, atNoon } from "../lib/calc.js";
import { MetricCard, VehicleAvatar, Badge, BarChart, ActionBtns, EmptyState } from "../components/ui.jsx";

export function ReportView({
  vehicles, expenses, odometer,
  rMonth, setRMonth, rYear, setRYear, rVid, setRVid,
  getExp, onNewExpense, onNewOdometer, onEditExpense, onEditOdometer,
  onDeleteExpense, onDeleteOdometer, onAddVehicle,
}) {
  const rVehicles = rVid ? vehicles.filter((v) => v.id === rVid) : vehicles;
  const rExps = getExp(rVid, rMonth, rYear);
  const rTotal = totalOf(rExps);
  const rTotalKm = rVehicles.reduce((s, v) => s + (monthlyKm(odometer, expenses, v, rMonth, rYear) || 0), 0);
  const rCostPerKm = rTotalKm > 0 ? Math.round(rTotal / rTotalKm) : null;
  const byCategory = CATEGORIES.map((c) => ({ id: c.id, amount: totalOf(rExps.filter((e) => e.type === c.id)) }));

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <select value={rMonth} onChange={(e) => setRMonth(Number(e.target.value))}
          style={{ ...S.input, width: "auto", flex: 1, minWidth: 130, fontWeight: 600, fontSize: 15, color: C.ink }}>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={rYear} onChange={(e) => setRYear(Number(e.target.value))}
          style={{ ...S.input, width: "auto", flex: "0 0 80px", fontWeight: 600, fontSize: 15, color: C.ink }}>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={rVid || ""} onChange={(e) => setRVid(e.target.value || null)}
          style={{ ...S.input, width: "auto", flex: 1, minWidth: 150 }}>
          <option value="">Toda la flota</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.plate}</option>)}
        </select>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState icon="🚗" title="Todavía no tenés vehículos registrados.">
          <button style={S.btn(C.blue, C.white)} onClick={onAddVehicle}>+ Agregar primer vehículo</button>
        </EmptyState>
      ) : rExps.length === 0 && rTotalKm === 0 ? (
        <EmptyState
          icon="📭"
          title={`Sin datos para ${MONTHS[rMonth]} ${rYear}`}
          hint="Cargá gastos o registrá km del odómetro para verlos acá."
        >
          <button style={S.btn(C.blue, C.white)} onClick={onNewExpense}>+ Cargar gasto</button>
          <button style={S.btn(C.greenSoft, C.green, C.green + "44")} onClick={onNewOdometer}>🛣 Registrar km</button>
        </EmptyState>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.25rem" }}>
            <MetricCard large label="Total gastado" value={$fmt(rTotal)} color={C.blue} bg={C.blueSoft} />
            <MetricCard large label="Km recorridos" value={rTotalKm > 0 ? kmFmt(rTotalKm) : "—"} color={C.green} bg={C.greenSoft}
              sub={rTotalKm === 0 ? "Sin lectura de km" : undefined} />
            {rCostPerKm !== null && (
              <MetricCard label="Costo por km" value={$fmt(rCostPerKm)} sub="promedio del período" color={C.amber} bg={C.amberSoft} />
            )}
            <MetricCard label="Gastos registrados" value={rExps.length} sub={`en ${MONTHS[rMonth]}`} color={C.violet} bg={C.violetSoft} />
          </div>

          {rExps.length > 0 && (
            <div style={{ ...S.card, marginBottom: "1.25rem" }}>
              <span style={S.section}>Distribución de gastos</span>
              <BarChart items={byCategory} total={rTotal} />
            </div>
          )}

          <span style={S.section}>Detalle por vehículo</span>
          {rVehicles.map((v) => (
            <VehicleReportCard
              key={v.id}
              v={v}
              rMonth={rMonth}
              rYear={rYear}
              expenses={expenses}
              odometer={odometer}
              getExp={getExp}
              onEditExpense={onEditExpense}
              onEditOdometer={onEditOdometer}
              onDeleteExpense={onDeleteExpense}
              onDeleteOdometer={onDeleteOdometer}
              onNewOdometerFor={() => onNewOdometer(v.id)}
            />
          ))}
        </>
      )}
    </>
  );
}

function VehicleReportCard({
  v, rMonth, rYear, expenses, odometer, getExp,
  onEditExpense, onEditOdometer, onDeleteExpense, onDeleteOdometer, onNewOdometerFor,
}) {
  const vExps = getExp(v.id, rMonth, rYear);
  const vTotal = totalOf(vExps);
  const vKm = monthlyKm(odometer, expenses, v, rMonth, rYear);
  const costPKm = vKm && vKm > 0 && vTotal > 0 ? Math.round(vTotal / vKm) : null;
  const fuelExps = vExps.filter((e) => e.type === "combustible");
  const totalL = fuelExps.reduce((s, e) => s + (e.liters || 0), 0);

  const prevExps = getExp(v.id, rMonth === 0 ? 11 : rMonth - 1, rMonth === 0 ? rYear - 1 : rYear);
  const prevTotal = totalOf(prevExps);
  const diff = prevTotal > 0 ? ((vTotal - prevTotal) / prevTotal) * 100 : null;

  const vColor = VCOLORS[v.colorIdx || 0];
  const odomThisMonth = odometer
    .filter((o) => {
      const d = atNoon(o.date);
      return o.vehicleId === v.id && d.getMonth() === rMonth && d.getFullYear() === rYear;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ ...S.card, marginBottom: 12, borderLeft: `4px solid ${vColor}`, paddingLeft: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <VehicleAvatar v={v} size={42} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{v.name}</div>
            <div style={{ fontSize: 12, color: C.mist }}>{v.plate}{v.brand ? ` · ${v.brand} ${v.model}` : ""}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: vColor }}>{$fmt(vTotal)}</div>
          {diff !== null && (
            <div style={{ fontSize: 11, color: diff > 0 ? C.rose : C.green, fontWeight: 500 }}>
              {diff > 0 ? "▲" : "▼"} {Math.abs(diff).toFixed(0)}% vs mes anterior
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(115px,1fr))", gap: 8, marginBottom: 14 }}>
        {vKm !== null ? (
          <div style={{ background: C.greenSoft, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.green, marginBottom: 3 }}>KM RECORRIDOS</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: C.green }}>{kmFmt(vKm)}</div>
          </div>
        ) : (
          <div style={{ background: C.bone, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.mist, marginBottom: 3 }}>KM RECORRIDOS</div>
            <div style={{ fontSize: 13, color: C.mist }}>Sin lectura</div>
            <button onClick={onNewOdometerFor} style={{ marginTop: 4, fontSize: 11, color: C.green, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
              + Registrar →
            </button>
          </div>
        )}
        {costPKm !== null && (
          <div style={{ background: C.amberSoft, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.amber, marginBottom: 3 }}>COSTO / KM</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: C.amber }}>{$fmt(costPKm)}</div>
          </div>
        )}
        {totalL > 0 && (
          <div style={{ background: C.blueSoft, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.blue, marginBottom: 3 }}>COMBUSTIBLE</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: C.blue }}>{totalL.toFixed(1)} L</div>
            <div style={{ fontSize: 11, color: C.blue }}>{$fmt(Math.round(totalOf(fuelExps) / totalL))}/litro</div>
          </div>
        )}
      </div>

      {odomThisMonth.length > 0 && (
        <div style={{ background: C.greenSoft, borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.green, marginBottom: 6 }}>LECTURAS DE ODÓMETRO DEL MES</div>
          {odomThisMonth.map((o) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
              <span style={{ color: C.green }}>
                🛣 {atNoon(o.date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}{o.note && ` · ${o.note}`}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700, color: C.green }}>{kmFmt(o.km)}</span>
                <ActionBtns onEdit={() => onEditOdometer(o)} onDelete={() => onDeleteOdometer(o.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {vExps.length > 0 ? (
        <>
          <span style={S.section}>Gastos del mes</span>
          <div style={{ marginBottom: 14 }}>
            <BarChart
              items={CATEGORIES.map((c) => ({ id: c.id, amount: totalOf(vExps.filter((e) => e.type === c.id)) }))}
              total={vTotal}
            />
          </div>

          <span style={S.section}>Movimientos</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...vExps].sort((a, b) => new Date(b.date) - new Date(a.date)).map((e) => {
              const c = cat(e.type);
              const ft = e.type === "combustible" && e.fuelType ? FUEL_TYPES.find((x) => x.id === e.fuelType) : null;
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: C.paper, borderRadius: 10 }}>
                  <Badge c={c} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>
                      {ft ? `${c.label} · ${ft.icon} ${ft.label}` : c.label}
                    </div>
                    <div style={{ fontSize: 11, color: C.mist }}>
                      {atNoon(e.date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}
                      {e.km > 0 && ` · ${kmFmt(e.km)}`}{e.liters > 0 && ` · ${e.liters}L`}{e.note && ` · ${e.note}`}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{$fmt(e.amount)}</div>
                  <ActionBtns onEdit={() => onEditExpense(e)} onDelete={() => onDeleteExpense(e.id)} />
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.bone}` }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.slate }}>Total {MONTHS[rMonth]}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: vColor }}>{$fmt(vTotal)}</span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, color: C.mist, textAlign: "center", padding: "0.75rem 0" }}>
          Sin gastos en {MONTHS[rMonth]} {rYear}.
        </div>
      )}
    </div>
  );
}
