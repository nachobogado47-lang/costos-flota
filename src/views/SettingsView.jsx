import { useRef, useState } from "react";
import { C, S, FUEL_TYPES } from "../theme.js";
import { calcFinalPrice, todayISO } from "../lib/calc.js";

export function SettingsView({
  fuelPrices, setFuelPrices, fuelHistory, setFuelHistory, taxes, setTaxes, toast, onImport,
}) {
  const [editingPrices, setEditingPrices] = useState(false);
  const [draftPrices, setDraftPrices] = useState({ ...fuelPrices });
  const [editingTaxes, setEditingTaxes] = useState(false);
  const [draftTaxes, setDraftTaxes] = useState(taxes.map((t) => ({ ...t })));
  const fileInput = useRef(null);

  function savePrices() {
    const prices = Object.fromEntries(
      Object.entries(draftPrices).map(([k, v]) => [k, Number(v) || 0]),
    );
    setFuelPrices(prices);
    setFuelHistory((p) => [{ id: `${Date.now()}`, date: todayISO(), prices }, ...p]);
    setEditingPrices(false);
    toast("Precios actualizados");
  }

  function saveTaxes() {
    setTaxes(draftTaxes.map((t) => ({ ...t, pct: Number(t.pct) || 0 })));
    setEditingTaxes(false);
    toast("Impuestos actualizados");
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object" || !Array.isArray(data.vehicles)) {
          throw new Error("El archivo no tiene el formato esperado.");
        }
        onImport(data);
      } catch (err) {
        toast(`No se pudo importar: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const totalTaxPct = taxes.reduce((s, t) => s + Number(t.pct), 0);

  return (
    <div>
      {/* Precios de combustible */}
      <div style={{ ...S.card, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>⛽ Precios de combustible</div>
            <div style={{ fontSize: 12, color: C.mist, marginTop: 2 }}>Precio base por litro (sin impuestos)</div>
          </div>
          {!editingPrices ? (
            <button style={S.btn(C.blueSoft, C.blue, C.blue + "44")} onClick={() => { setDraftPrices({ ...fuelPrices }); setEditingPrices(true); }}>
              ✏️ Actualizar
            </button>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button style={S.btn(C.green, C.white)} onClick={savePrices}>✓ Guardar</button>
              <button style={S.btn(C.paper, C.slate, C.bone)} onClick={() => setEditingPrices(false)}>Cancelar</button>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
          {FUEL_TYPES.map((ft) => {
            const base = fuelPrices[ft.id] || 0;
            const final = calcFinalPrice(base, taxes);
            return (
              <div key={ft.id} style={{ background: C.paper, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{ft.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{ft.label}</div>
                {editingPrices ? (
                  <input
                    type="number"
                    value={draftPrices[ft.id] ?? ""}
                    onChange={(e) => setDraftPrices((p) => ({ ...p, [ft.id]: e.target.value }))}
                    style={{ ...S.input, padding: "6px 10px", fontSize: 13 }}
                    placeholder="0.00"
                  />
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: C.mist }}>
                      Base: <strong style={{ color: C.slate }}>
                        ${Number(base).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/L
                      </strong>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.blue, marginTop: 3 }}>
                      Con imp.: ${Math.round(final).toLocaleString("es-AR")}/L
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {editingPrices && (
          <div style={{ marginTop: 12, background: C.amberSoft, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.amber }}>
            ⚠️ Al guardar estos precios, los nuevos registros de combustible usarán estos valores. Los gastos ya registrados no cambian.
          </div>
        )}
      </div>

      {/* Impuestos */}
      <div style={{ ...S.card, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>📊 Impuestos sobre combustible</div>
            <div style={{ fontSize: 12, color: C.mist, marginTop: 2 }}>Se aplican siempre sobre el precio base</div>
          </div>
          {!editingTaxes ? (
            <button style={S.btn(C.blueSoft, C.blue, C.blue + "44")} onClick={() => { setDraftTaxes(taxes.map((t) => ({ ...t }))); setEditingTaxes(true); }}>
              ✏️ Editar
            </button>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button style={S.btn(C.green, C.white)} onClick={saveTaxes}>✓ Guardar</button>
              <button style={S.btn(C.paper, C.slate, C.bone)} onClick={() => setEditingTaxes(false)}>Cancelar</button>
            </div>
          )}
        </div>

        {editingTaxes ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {draftTaxes.map((t, i) => (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 36px", gap: 8, alignItems: "center" }}>
                <input value={t.label} onChange={(e) => setDraftTaxes((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} style={S.input} placeholder="Nombre del impuesto" />
                <div style={{ position: "relative" }}>
                  <input type="number" value={t.pct} onChange={(e) => setDraftTaxes((p) => p.map((x, j) => (j === i ? { ...x, pct: e.target.value } : x)))} style={{ ...S.input, paddingRight: 28 }} placeholder="0" />
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.mist }}>%</span>
                </div>
                <button onClick={() => setDraftTaxes((p) => p.filter((x) => x.id !== t.id))} style={{ ...S.btn(C.roseSoft, C.rose, C.rose + "33"), padding: "8px", justifyContent: "center" }} aria-label="Quitar impuesto">✕</button>
              </div>
            ))}
            <button onClick={() => setDraftTaxes((p) => [...p, { id: `${Date.now()}`, label: "Nuevo impuesto", pct: 0 }])} style={{ ...S.btn(C.paper, C.slate, C.bone), justifyContent: "center", marginTop: 4 }}>
              + Agregar impuesto
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {taxes.map((t) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: C.paper, borderRadius: 9 }}>
                <span style={{ fontSize: 13, color: C.slate }}>{t.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{t.pct}%</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: C.violetSoft, borderRadius: 9, marginTop: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.violet }}>Total impuestos</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.violet }}>{totalTaxPct}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Backup */}
      <div style={{ ...S.card, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 2 }}>💾 Copia de seguridad</div>
        <div style={{ fontSize: 12, color: C.mist, marginBottom: 14 }}>
          Importá un archivo exportado antes para restaurar toda la información.
        </div>
        <input ref={fileInput} type="file" accept="application/json,.json" onChange={handleFile} style={{ display: "none" }} />
        <button style={{ ...S.btn(C.paper, C.slate, C.bone), justifyContent: "center", width: "100%" }} onClick={() => fileInput.current?.click()}>
          ⬆ Importar datos desde JSON
        </button>
        <div style={{ marginTop: 10, background: C.amberSoft, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.amber }}>
          ⚠️ Importar reemplaza toda la información actual por la del archivo.
        </div>
      </div>

      {/* Historial de precios */}
      {fuelHistory.length > 0 && (
        <div style={S.card}>
          <span style={S.section}>Historial de actualizaciones de precios</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {fuelHistory.map((h, i) => (
              <div key={h.id} style={{ background: i === 0 ? C.greenSoft : C.paper, borderRadius: 10, padding: "10px 14px", border: i === 0 ? `1px solid ${C.green}33` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? C.green : C.ink }}>
                    {new Date(`${h.date}T12:00:00`).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                  {i === 0 && (
                    <span style={{ fontSize: 11, background: C.green, color: C.white, padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>Actual</span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 6 }}>
                  {FUEL_TYPES.map((ft) => (
                    <div key={ft.id} style={{ fontSize: 12 }}>
                      <span style={{ color: C.mist }}>{ft.icon} {ft.label}: </span>
                      <strong style={{ color: i === 0 ? C.green : C.slate }}>
                        ${Number(h.prices[ft.id] || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
