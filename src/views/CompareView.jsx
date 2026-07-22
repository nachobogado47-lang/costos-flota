import { C, S, MONTHS, YEARS, VCOLORS } from "../theme.js";
import { $fmt, kmFmt, initials, totalOf, monthlyKm, totalKm } from "../lib/calc.js";
import { MetricCard, EmptyState } from "../components/ui.jsx";

export function CompareView({
  vehicles, expenses, odometer,
  cMode, setCMode, cMonth, setCMonth, cYear, setCYear,
  getExp, onAddVehicle,
}) {
  if (vehicles.length < 2) {
    return (
      <div>
        <Filters {...{ cMode, setCMode, cMonth, setCMonth, cYear, setCYear }} />
        <EmptyState icon="⚖️" title="Necesitás al menos 2 vehículos para comparar.">
          <button style={S.btn(C.blue, C.white)} onClick={onAddVehicle}>+ Agregar vehículo</button>
        </EmptyState>
      </div>
    );
  }

  const stats = vehicles.map((v) => {
    const vExps = cMode === "month" ? getExp(v.id, cMonth, cYear) : getExp(v.id);
    const totalGasto = totalOf(vExps);
    const vKm = cMode === "month"
      ? (monthlyKm(odometer, expenses, v, cMonth, cYear) || 0)
      : totalKm(odometer, expenses, v);
    const costPerKm = vKm > 0 ? Math.round(totalGasto / vKm) : null;
    const fuelExps = vExps.filter((e) => e.type === "combustible");
    const totalLitros = fuelExps.reduce((s, e) => s + (e.liters || 0), 0);
    const totalCombust = totalOf(fuelExps);
    const servicios = vExps.filter((e) => e.type === "service");
    const reparaciones = vExps.filter((e) => e.type === "reparacion");
    const totalMant = totalOf([...servicios, ...reparaciones]);
    const totalSeguros = totalOf(vExps.filter((e) => e.type === "seguro"));
    const totalPatentes = totalOf(vExps.filter((e) => e.type === "patente"));
    return { v, totalGasto, vKm, costPerKm, totalLitros, totalCombust, servicios, reparaciones, totalMant, totalSeguros, totalPatentes };
  });

  const period = cMode === "month" ? `${MONTHS[cMonth]} ${cYear}` : "Todo el período";
  const totalFlota = stats.reduce((s, x) => s + x.totalGasto, 0);
  const totalKmFlota = stats.reduce((s, x) => s + x.vKm, 0);
  const totalLFlota = stats.reduce((s, x) => s + x.totalLitros, 0);
  const totalMantFlota = stats.reduce((s, x) => s + x.totalMant, 0);

  const rows = [
    { label: "Gasto total",            icon: "💰", values: stats.map((s) => s.totalGasto),      fmt: (v) => $fmt(v) },
    { label: "Km recorridos",          icon: "🛣",  values: stats.map((s) => s.vKm),             fmt: (v) => (v > 0 ? kmFmt(v) : "—") },
    { label: "Costo por km",           icon: "📍", values: stats.map((s) => s.costPerKm || 0),  fmt: (v) => (v > 0 ? $fmt(v) : "—"), sub: "menor = más eficiente" },
    { label: "Litros de combustible",  icon: "⛽", values: stats.map((s) => s.totalLitros),     fmt: (v) => (v > 0 ? `${v.toFixed(1)} L` : "—") },
    { label: "Gasto en combustible",   icon: "⛽", values: stats.map((s) => s.totalCombust),    fmt: (v) => $fmt(v) },
    { label: "Services realizados",    icon: "🔧", values: stats.map((s) => s.servicios.length),    fmt: (v) => `${v} service${v !== 1 ? "s" : ""}` },
    { label: "Reparaciones",           icon: "🛠",  values: stats.map((s) => s.reparaciones.length), fmt: (v) => `${v} reparación${v !== 1 ? "es" : ""}` },
    { label: "Gasto en mantenimiento", icon: "🔧", values: stats.map((s) => s.totalMant),       fmt: (v) => $fmt(v), sub: "service + reparaciones" },
    { label: "Seguros",                icon: "🛡",  values: stats.map((s) => s.totalSeguros),    fmt: (v) => $fmt(v) },
    { label: "Patentes",               icon: "📋", values: stats.map((s) => s.totalPatentes),   fmt: (v) => $fmt(v) },
  ];

  return (
    <div>
      <Filters {...{ cMode, setCMode, cMonth, setCMonth, cYear, setCYear }} />

      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 13, color: C.mist, marginBottom: 10 }}>
          Período: <strong style={{ color: C.ink }}>{period}</strong>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8 }}>
          <MetricCard label="Total flota"    value={$fmt(totalFlota)} color={C.blue} bg={C.blueSoft} />
          <MetricCard label="Km totales"     value={totalKmFlota > 0 ? kmFmt(totalKmFlota) : "—"} color={C.green} bg={C.greenSoft} />
          <MetricCard label="Litros totales" value={totalLFlota > 0 ? `${totalLFlota.toFixed(1)} L` : "—"} color={C.amber} bg={C.amberSoft} />
          <MetricCard label="Mantenimiento"  value={$fmt(totalMantFlota)} color={C.violet} bg={C.violetSoft} />
        </div>
      </div>

      {rows.map((r) => (
        <CompareRow key={r.label} label={r.label} icon={r.icon} sub={r.sub} values={r.values} fmt={r.fmt} stats={stats} />
      ))}

      <div style={{ ...S.card, marginTop: 4 }}>
        <span style={S.section}>Resumen comparativo</span>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.bone}` }}>
                <th style={{ textAlign: "left", padding: "6px 8px", color: C.mist, fontWeight: 600 }}>Vehículo</th>
                {["Km", "$/km", "Litros", "Mant.", "Total"].map((h) => (
                  <th key={h} style={{ textAlign: "right", padding: "6px 8px", color: C.mist, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => {
                const vc = VCOLORS[s.v.colorIdx || 0];
                return (
                  <tr key={s.v.id} style={{ borderBottom: `1px solid ${C.bone}` }}>
                    <td style={{ padding: "8px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 20, height: 20, background: vc + "22", border: `1.5px solid ${vc}44`, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: vc }}>
                          {initials(s.v.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: C.ink }}>{s.v.name}</div>
                          <div style={{ color: C.mist, fontSize: 10 }}>{s.v.plate}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", padding: "8px 8px", color: C.slate }}>{s.vKm > 0 ? kmFmt(s.vKm) : "—"}</td>
                    <td style={{ textAlign: "right", padding: "8px 8px", color: C.slate }}>{s.costPerKm ? $fmt(s.costPerKm) : "—"}</td>
                    <td style={{ textAlign: "right", padding: "8px 8px", color: C.slate }}>{s.totalLitros > 0 ? `${s.totalLitros.toFixed(1)} L` : "—"}</td>
                    <td style={{ textAlign: "right", padding: "8px 8px", color: C.slate }}>{$fmt(s.totalMant)}</td>
                    <td style={{ textAlign: "right", padding: "8px 8px", fontWeight: 700, color: vc }}>{$fmt(s.totalGasto)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Filters({ cMode, setCMode, cMonth, setCMonth, cYear, setCYear }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
      <div style={{ display: "flex", background: C.bone, borderRadius: 10, padding: 3, gap: 2 }}>
        {[{ id: "month", label: "Por mes" }, { id: "all", label: "Acumulado" }].map((m) => (
          <button key={m.id} onClick={() => setCMode(m.id)} style={{
            padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: cMode === m.id ? C.white : "transparent",
            color: cMode === m.id ? C.ink : C.mist,
          }}>{m.label}</button>
        ))}
      </div>
      {cMode === "month" && (
        <>
          <select value={cMonth} onChange={(e) => setCMonth(Number(e.target.value))}
            style={{ ...S.input, width: "auto", flex: 1, minWidth: 130, fontWeight: 600, fontSize: 14, color: C.ink }}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={cYear} onChange={(e) => setCYear(Number(e.target.value))}
            style={{ ...S.input, width: "auto", flex: "0 0 80px", fontWeight: 600, fontSize: 14, color: C.ink }}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </>
      )}
    </div>
  );
}

function CompareRow({ label, icon, sub, values, fmt, stats }) {
  const max = Math.max(...values.map((x) => x || 0));
  if (max === 0) return null;
  return (
    <div style={{ ...S.card, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{label}</span>
        {sub && <span style={{ fontSize: 12, color: C.mist }}>· {sub}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {stats.map((s, i) => {
          const val = values[i] || 0;
          const pct = max > 0 ? (val / max) * 100 : 0;
          const vc = VCOLORS[s.v.colorIdx || 0];
          const isMax = val === max && max > 0;
          return (
            <div key={s.v.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, background: vc + "22", border: `1.5px solid ${vc}33`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: vc, flexShrink: 0 }}>
                    {initials(s.v.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{s.v.name}</div>
                    <div style={{ fontSize: 11, color: C.mist }}>{s.v.plate}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isMax ? vc : C.ink }}>{fmt(val)}</div>
                  {isMax && <div style={{ fontSize: 10, color: vc, fontWeight: 600 }}>★ Mayor</div>}
                </div>
              </div>
              <div style={{ height: 8, background: C.bone, borderRadius: 99 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: isMax ? vc : vc + "99", borderRadius: 99, transition: "width 0.4s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
