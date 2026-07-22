#!/usr/bin/env node
/**
 * Carga un export de la app en la base. Por defecto usa db/seed.json.
 *
 *   DATABASE_URL="postgres://…" node scripts/seed-db.js [ruta.json]
 *
 * Reemplaza todo el contenido de las tablas: pensado para la carga inicial
 * o para restaurar un backup completo.
 */
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ Falta DATABASE_URL.");
  console.error('  Uso: DATABASE_URL="postgres://…" npm run db:seed');
  process.exit(1);
}

const file = process.argv[2] ? resolve(process.argv[2]) : join(root, "db", "seed.json");
const data = JSON.parse(await readFile(file, "utf8"));

const {
  vehicles = [], expenses = [], odometer = [],
  fuelPrices = {}, fuelHistory = [], taxes = [],
} = data;

console.log(`→ Archivo: ${file}`);
console.log(`  ${vehicles.length} vehículos · ${expenses.length} gastos · ${odometer.length} lecturas`);

const sql = neon(url);
const statements = [];

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

for (const [fuelType, basePrice] of Object.entries(fuelPrices)) {
  statements.push(sql`
    INSERT INTO fuel_prices (fuel_type, base_price) VALUES (${fuelType}, ${Number(basePrice) || 0})
  `);
}

for (const h of fuelHistory) {
  statements.push(sql`
    INSERT INTO fuel_price_history (id, date, prices)
    VALUES (${String(h.id)}, ${h.date}, ${JSON.stringify(h.prices)})
  `);
}

for (const t of taxes) {
  statements.push(sql`
    INSERT INTO taxes (id, label, pct) VALUES (${String(t.id)}, ${t.label || ""}, ${Number(t.pct) || 0})
  `);
}

await sql.transaction(statements);

const [[v], [e], [o]] = await Promise.all([
  sql`SELECT count(*)::int AS n FROM vehicles`,
  sql`SELECT count(*)::int AS n FROM expenses`,
  sql`SELECT count(*)::int AS n FROM odometer_readings`,
]);

console.log(`✓ Cargado: ${v.n} vehículos · ${e.n} gastos · ${o.n} lecturas`);
