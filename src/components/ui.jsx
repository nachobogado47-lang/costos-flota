import { C, S, VCOLORS } from "../theme.js";
import { $fmt, cat, initials } from "../lib/calc.js";

export function ConfirmModal({ msg, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: C.white, borderRadius: 18, padding: "1.5rem", maxWidth: 340, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 8 }}>¿Confirmar eliminación?</div>
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 20 }}>{msg}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onConfirm} style={{ ...S.btn(C.rose, C.white), flex: 1, justifyContent: "center" }}>Sí, eliminar</button>
          <button onClick={onCancel} style={{ ...S.btn(C.paper, C.slate, C.bone), flex: 1, justifyContent: "center" }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export function MetricCard({ label, value, sub, color, bg, large }) {
  return (
    <div style={{ background: bg || C.paper, borderRadius: 14, padding: "1rem 1.1rem" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: color || C.slate, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: large ? 26 : 20, fontWeight: 700, color: color || C.ink, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.mist, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export function VehicleAvatar({ v, size = 38 }) {
  const c = VCOLORS[v.colorIdx || 0];
  return (
    <div style={{ width: size, height: size, background: c + "22", border: `2px solid ${c}33`, borderRadius: size * 0.26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: c, flexShrink: 0 }}>
      {initials(v.name)}
    </div>
  );
}

export function Badge({ c }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 9, background: c.bg, fontSize: 16, flexShrink: 0 }}>
      {c.icon}
    </span>
  );
}

export function BarChart({ items, total }) {
  const sorted = items.filter((i) => i.amount > 0).sort((a, b) => b.amount - a.amount);
  if (!sorted.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sorted.map((i) => {
        const c = cat(i.id);
        const pct = total > 0 ? (i.amount / total) * 100 : 0;
        return (
          <div key={i.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}><Badge c={c} />{c.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
                {$fmt(i.amount)} <span style={{ fontSize: 11, fontWeight: 400, color: C.mist }}>({pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div style={{ height: 6, background: C.bone, borderRadius: 99 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: c.color, borderRadius: 99, transition: "width 0.35s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ActionBtns({ onEdit, onDelete }) {
  return (
    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
      <button onClick={onEdit} style={{ ...S.btn(C.blueSoft, C.blue, C.blue + "33"), padding: "5px 10px", fontSize: 12 }} title="Editar" aria-label="Editar">✏️</button>
      <button onClick={onDelete} style={{ ...S.btn(C.roseSoft, C.rose, C.rose + "33"), padding: "5px 10px", fontSize: 12 }} title="Eliminar" aria-label="Eliminar">🗑</button>
    </div>
  );
}

export function EmptyState({ icon, title, hint, children }) {
  return (
    <div style={{ ...S.card, textAlign: "center", padding: "2.5rem 1rem" }}>
      <div style={{ fontSize: 42, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, color: C.slate, marginBottom: hint ? 6 : 16 }}>{title}</div>
      {hint && <div style={{ fontSize: 13, color: C.mist, marginBottom: 20 }}>{hint}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

const SYNC_LABELS = {
  syncing: { text: "Guardando…",       color: C.mist,  bg: C.bone      },
  synced:  { text: "Guardado",          color: C.green, bg: C.greenSoft },
  local:   { text: "Solo este equipo",  color: C.amber, bg: C.amberSoft },
  error:   { text: "Sin sincronizar",   color: C.rose,  bg: C.roseSoft  },
};

export function SyncBadge({ state }) {
  const s = SYNC_LABELS[state];
  if (!s) return null;
  return (
    <span
      title={
        state === "local"
          ? "No hay base de datos conectada: los datos viven en este navegador."
          : state === "error"
            ? "No se pudo guardar en la base de datos. Los datos están a salvo en este navegador."
            : undefined
      }
      style={{ fontSize: 10, fontWeight: 600, color: s.color, background: s.bg, padding: "3px 8px", borderRadius: 99, whiteSpace: "nowrap", letterSpacing: "0.03em" }}
    >
      {s.text}
    </span>
  );
}
