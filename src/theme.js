import {
  Fuel,
  Wrench,
  Hammer,
  ShieldCheck,
  ClipboardList,
  CircleDot,
  Droplets,
  TrafficCone,
  Package,
} from "lucide-react";

/**
 * Categorías de gasto. `tone`/`surface` son variables CSS, no clases: se usan
 * tanto en `style` (barras, bordes dinámicos) como vía utilidades de Tailwind.
 */
export const CATEGORIES = [
  { id: "combustible", label: "Combustible", Icon: Fuel,          tone: "var(--fuel)",      surface: "var(--fuel-soft)" },
  { id: "service",     label: "Service",     Icon: Wrench,        tone: "var(--service)",   surface: "var(--service-soft)" },
  { id: "reparacion",  label: "Reparación",  Icon: Hammer,        tone: "var(--repair)",    surface: "var(--repair-soft)" },
  { id: "seguro",      label: "Seguro",      Icon: ShieldCheck,   tone: "var(--insurance)", surface: "var(--insurance-soft)" },
  { id: "patente",     label: "Patente",     Icon: ClipboardList, tone: "var(--insurance)", surface: "var(--insurance-soft)" },
  { id: "neumaticos",  label: "Neumáticos",  Icon: CircleDot,     tone: "var(--neutral)",   surface: "var(--neutral-soft)" },
  { id: "lavado",      label: "Lavado",      Icon: Droplets,      tone: "var(--service)",   surface: "var(--service-soft)" },
  { id: "peaje",       label: "Peajes",      Icon: TrafficCone,   tone: "var(--neutral)",   surface: "var(--neutral-soft)" },
  { id: "otro",        label: "Otro",        Icon: Package,       tone: "var(--neutral)",   surface: "var(--neutral-soft)" },
];

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const YEARS = [2023, 2024, 2025, 2026, 2027];

/** Serie de colores por vehículo, en orden de asignación. */
export const VCOLORS = [
  "var(--v1)", "var(--v2)", "var(--v3)",
  "var(--v4)", "var(--v5)", "var(--v6)",
];

/**
 * Catálogo inicial de combustibles. Es sólo la semilla: el catálogo real vive
 * en el estado y se administra desde Precios, así que un combustible nuevo no
 * requiere tocar el código. `dot` es el color del indicador.
 */
export const DEFAULT_FUEL_TYPES = [
  { id: "gnc",        label: "GNC",        dot: "var(--fuel)" },
  { id: "super",      label: "Super",      dot: "var(--service)" },
  { id: "gasoil",     label: "Gasoil",     dot: "var(--repair)" },
  { id: "eurodiesel", label: "Eurodiesel", dot: "var(--v5)" },
];

/** Paleta ofrecida al crear un combustible nuevo. */
export const DOT_COLORS = [
  "var(--fuel)", "var(--service)", "var(--repair)",
  "var(--insurance)", "var(--v5)", "var(--v6)", "var(--neutral)",
];

/** Impuestos por defecto: IVA 21% + Otro impuesto 15.5%. */
export const DEFAULT_TAXES = [
  { id: "iva",  label: "IVA",           pct: 21   },
  { id: "otro", label: "Otro impuesto", pct: 15.5 },
];

/** Precio unitario SIN impuestos, por litro. */
export const DEFAULT_FUEL_PRICES = {
  gnc:        821.07,
  super:      1494.97,
  gasoil:     1665.25,
  eurodiesel: 1781.77,
};
