import { neon } from "@neondatabase/serverless";

let cached = null;

/**
 * Cliente Neon. Lanza si falta DATABASE_URL para que el endpoint pueda
 * devolver 503 y el frontend caiga a localStorage en vez de romperse.
 */
export function db() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta la variable de entorno DATABASE_URL");
  cached = neon(url);
  return cached;
}

/** Fecha de Postgres (Date u objeto) a "YYYY-MM-DD". */
export function toISODate(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}
