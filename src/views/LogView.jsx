import { C, S, MONTHS, VCOLORS, FUEL_TYPES } from "../theme.js";
import { $fmt, kmFmt, cat, totalOf, atNoon } from "../lib/calc.js";
import { Badge, ActionBtns, EmptyState } from "../components/ui.jsx";

export function LogView({ vehicles, expenses, onNewExpense, onEditExpense, onDeleteExpense }) {
  if (expenses.length === 0) {
    return (
      <EmptyState icon="🧾" title="No hay gastos cargados todavía.">
        <button style={S.btn(C.blue, C.white)} onClick={onNewExpense}>+ Cargar primer gasto</button>
      </EmptyState>
    );
  }

  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  const groups = {};
  sorted.forEach((e) => {
    const d = new Date(e.date);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups[k]) groups[k] = { month: d.getMonth(), year: d.getFullYear(), exps: [] };
    groups[k].exps.push(e);
  });

  return Object.values(groups).map((g) => (
    <div key={`${g.year}-${g.month}`} style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={S.section}>{MONTHS[g.month]} {g.year}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{$fmt(totalOf(g.exps))}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {g.exps.map((e) => {
          const c = cat(e.type);
          const v = vehicles.find((x) => x.id === e.vehicleId);
          const vColor = v ? VCOLORS[v.colorIdx || 0] : C.mist;
          const ft = e.type === "combustible" && e.fuelType ? FUEL_TYPES.find((x) => x.id === e.fuelType) : null;
          return (
            <div key={e.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
              <Badge c={c} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
                  {ft ? `${c.label} · ${ft.icon} ${ft.label}` : c.label}
                </div>
                <div style={{ fontSize: 12, color: C.mist, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {v && <span style={{ color: vColor, fontWeight: 500 }}>{v.name}</span>}
                  <span>{atNoon(e.date).toLocaleDateString("es-AR")}</span>
                  {e.km > 0 && <span>· {kmFmt(e.km)}</span>}
                  {e.liters > 0 && <span>· {e.liters}L</span>}
                  {e.note && <span>· {e.note}</span>}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{$fmt(e.amount)}</div>
              <ActionBtns onEdit={() => onEditExpense(e)} onDelete={() => onDeleteExpense(e.id)} />
            </div>
          );
        })}
      </div>
    </div>
  ));
}
