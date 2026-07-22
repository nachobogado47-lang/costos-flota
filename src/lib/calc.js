import { CATEGORIES } from "../theme.js";

/** Precio final por litro aplicando todos los impuestos sobre el precio base. */
export function calcFinalPrice(basePrice, taxes) {
  const factor = taxes.reduce((acc, t) => acc + Number(t.pct) / 100, 0);
  return Number(basePrice) * (1 + factor);
}

/** Importe total de una carga: litros × precio final por litro. */
export function calcFuelAmount(liters, fuelType, fuelPrices, taxes) {
  const base = fuelPrices?.[fuelType] || 0;
  return Math.round(liters * calcFinalPrice(base, taxes));
}

export const $fmt = (n) =>
  "$" + Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const kmFmt = (n) => Number(n || 0).toLocaleString("es-AR") + " km";

export const initials = (s) =>
  String(s || "").trim().split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export const cat = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[8];

export const totalOf = (arr) => arr.reduce((s, e) => s + Number(e.amount || 0), 0);

/** Fecha local a mediodía, para evitar corrimientos por zona horaria. */
export const atNoon = (isoDate) => new Date(`${isoDate}T12:00:00`);

export const todayISO = () => new Date().toISOString().split("T")[0];

/**
 * Km recorridos por un vehículo dentro de un mes.
 * Toma la lectura más alta del mes y le resta la última lectura previa
 * (o los km iniciales del vehículo si no hay ninguna).
 * Devuelve null si el mes no tiene ninguna lectura.
 */
export function monthlyKm(odometer, expenses, v, month, year) {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const odomR = odometer
    .filter((o) => o.vehicleId === v.id)
    .map((o) => ({ date: atNoon(o.date), km: o.km }));
  const expR = expenses
    .filter((e) => e.vehicleId === v.id && e.km > 0)
    .map((e) => ({ date: atNoon(e.date), km: e.km }));

  const all = [...odomR, ...expR];
  const inM = all.filter((r) => r.date >= startOfMonth && r.date <= endOfMonth);
  const prevM = all.filter((r) => r.date < startOfMonth);
  if (!inM.length) return null;

  const maxNow = Math.max(...inM.map((r) => r.km));
  const kmStart = prevM.length ? Math.max(...prevM.map((r) => r.km)) : (v.initialKm || 0);
  return Math.max(0, maxNow - kmStart);
}

/** Lectura de odómetro más alta conocida para un vehículo. */
export function latestKm(odometer, expenses, v) {
  const all = [
    ...odometer.filter((o) => o.vehicleId === v.id).map((o) => o.km),
    ...expenses.filter((e) => e.vehicleId === v.id && e.km > 0).map((e) => e.km),
  ];
  return all.length ? Math.max(...all) : (v.initialKm || 0);
}

/** Km acumulados históricos: última lectura conocida menos los km iniciales. */
export function totalKm(odometer, expenses, v) {
  return Math.max(0, latestKm(odometer, expenses, v) - (v.initialKm || 0));
}
