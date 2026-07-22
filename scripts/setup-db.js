#!/usr/bin/env node
/**
 * Crea el esquema en la base configurada en DATABASE_URL.
 *
 *   DATABASE_URL="postgres://…" node scripts/setup-db.js
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ Falta DATABASE_URL.");
  console.error('  Uso: DATABASE_URL="postgres://…" npm run db:setup');
  process.exit(1);
}

const sql = neon(url);
const schema = await readFile(join(root, "db", "schema.sql"), "utf8");

// El driver HTTP manda una sentencia por request. Para DDL arbitrario se lo
// invoca con un array de strings: es la forma de pasar un template sin
// interpolaciones, ya que este driver no expone .query().
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s && !s.split("\n").every((l) => l.trim().startsWith("--")));

console.log(`→ Aplicando ${statements.length} sentencias…`);
for (const statement of statements) {
  await sql([statement]);
}

const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name
`;

console.log("✓ Esquema aplicado. Tablas:");
for (const t of tables) console.log(`  · ${t.table_name}`);
