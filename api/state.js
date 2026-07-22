import { db, toISODate } from "./_db.js";

/**
 * GET  /api/state — devuelve todo el estado con la misma forma que usa el frontend.
 * PUT  /api/state — reemplaza el estado completo dentro de una transacción.
 *
 * El frontend es la fuente de verdad de la sesión y manda el estado entero.
 * Es suficiente para el volumen de esta app (decenas de filas por mes) y evita
 * tener que reconciliar diffs parciales.
 */
export default async function handler(req, res) {
  let sql;
  try {
    sql = db();
  } catch (err) {
    // Sin base configurada la app funciona igual contra localStorage.
    return res.status(503).json({ error: err.message });
  }

  try {
    if (req.method === "GET") return res.status(200).json(await readState(sql));
    if (req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      await writeState(sql, body);
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Método no permitido" });
  } catch (err) {
    console.error("[api/state]", err);
    return res.status(500).json({ error: err.message });
  }
}

async function readState(sql) {
  const [vehicles, expenses, odometer, prices, history, taxes] = await Promise.all([
    sql`SELECT * FROM vehicles ORDER BY created_at ASC`,
    sql`SELECT * FROM expenses ORDER BY date DESC`,
    sql`SELECT * FROM odometer_readings ORDER BY date DESC`,
    sql`SELECT * FROM fuel_prices ORDER BY sort_order ASC, fuel_type ASC`,
    sql`SELECT * FROM fuel_price_history ORDER BY date DESC, created_at DESC`,
    sql`SELECT * FROM taxes ORDER BY id ASC`,
  ]);

  return {
    vehicles: vehicles.map((v) => ({
      id: v.id,
      name: v.name,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      year: v.year,
      initialKm: Number(v.initial_km),
      colorIdx: Number(v.color_idx),
    })),
    expenses: expenses.map((e) => ({
      id: e.id,
      vehicleId: e.vehicle_id,
      type: e.type,
      fuelType: e.fuel_type || "",
      amount: Number(e.amount),
      liters: Number(e.liters),
      km: Number(e.km),
      date: toISODate(e.date),
      note: e.note,
    })),
    odometer: odometer.map((o) => ({
      id: o.id,
      vehicleId: o.vehicle_id,
      km: Number(o.km),
      date: toISODate(o.date),
      note: o.note,
    })),
    fuelPrices: Object.fromEntries(prices.map((p) => [p.fuel_type, Number(p.base_price)])),
    fuelTypes: prices.map((p) => ({
      id: p.fuel_type,
      label: p.label || p.fuel_type,
      dot: p.dot || "var(--neutral)",
    })),
    fuelHistory: history.map((h) => ({ id: h.id, date: toISODate(h.date), prices: h.prices })),
    taxes: taxes.map((t) => ({ id: t.id, label: t.label, pct: Number(t.pct) })),
  };
}

async function writeState(sql, state) {
  const {
    vehicles = [], expenses = [], odometer = [],
    fuelPrices = {}, fuelTypes = [], fuelHistory = [], taxes = [],
  } = state || {};

  // El catálogo manda sobre las claves sueltas de fuelPrices: si un tipo se
  // eliminó desde la app, no debe resucitar por tener precio cargado.
  const catalog = fuelTypes.length
    ? fuelTypes
    : Object.keys(fuelPrices).map((id) => ({ id, label: id, dot: "var(--neutral)" }));

  const statements = [];

  // Las tablas hijas se borran primero: expenses y odometer_readings tienen FK
  // a vehicles, y el DELETE de vehicles las arrastraría por CASCADE igual.
  statements.push(sql`DELETE FROM expenses`);
  statements.push(sql`DELETE FROM odometer_readings`);
  statements.push(sql`DELETE FROM vehicles`);
  statements.push(sql`DELETE FROM fuel_prices`);
  statements.push(sql`DELETE FROM fuel_price_history`);
  statements.push(sql`DELETE FROM taxes`);

  for (const v of vehicles) {
    statements.push(sql`
      INSERT INTO vehicles (id, name, plate, brand, model, year, initial_km, color_idx)
      VALUES (
        ${String(v.id)}, ${v.name || ""}, ${v.plate || ""}, ${v.brand || ""},
        ${v.model || ""}, ${String(v.year ?? "")}, ${Number(v.initialKm) || 0}, ${Number(v.colorIdx) || 0}
      )
    `);
  }

  for (const e of expenses) {
    statements.push(sql`
      INSERT INTO expenses (id, vehicle_id, type, fuel_type, amount, liters, km, date, note)
      VALUES (
        ${String(e.id)}, ${String(e.vehicleId)}, ${e.type}, ${e.fuelType || null},
        ${Number(e.amount) || 0}, ${Number(e.liters) || 0}, ${Number(e.km) || 0},
        ${e.date}, ${e.note || ""}
      )
    `);
  }

  for (const o of odometer) {
    statements.push(sql`
      INSERT INTO odometer_readings (id, vehicle_id, km, date, note)
      VALUES (${String(o.id)}, ${String(o.vehicleId)}, ${Number(o.km) || 0}, ${o.date}, ${o.note || ""})
    `);
  }

  catalog.forEach((ft, i) => {
    statements.push(sql`
      INSERT INTO fuel_prices (fuel_type, label, dot, sort_order, base_price)
      VALUES (
        ${String(ft.id)}, ${ft.label || String(ft.id)}, ${ft.dot || "var(--neutral)"},
        ${i}, ${Number(fuelPrices[ft.id]) || 0}
      )
    `);
  });

  for (const h of fuelHistory) {
    statements.push(sql`
      INSERT INTO fuel_price_history (id, date, prices)
      VALUES (${String(h.id)}, ${h.date}, ${JSON.stringify(h.prices)})
    `);
  }

  for (const t of taxes) {
    statements.push(sql`
      INSERT INTO taxes (id, label, pct)
      VALUES (${String(t.id)}, ${t.label || ""}, ${Number(t.pct) || 0})
    `);
  }

  await sql.transaction(statements);
}
