export const C = {
  ink: "#1A1917", slate: "#4B4A47", mist: "#9B9992", bone: "#E8E5DE", paper: "#F6F4EF", white: "#FFFFFF",
  blue: "#1A5EA8", blueSoft: "#E6EEF9", green: "#0C6B4A", greenSoft: "#E1F4EC",
  amber: "#B86B10", amberSoft: "#FAF0DC", rose: "#C0393B", roseSoft: "#FBEBEB",
  violet: "#4E3AAB", violetSoft: "#EEEBFB",
};

export const CATEGORIES = [
  { id: "combustible", label: "Combustible", icon: "⛽", color: C.blue,   bg: C.blueSoft   },
  { id: "service",     label: "Service",     icon: "🔧", color: C.green,  bg: C.greenSoft  },
  { id: "reparacion",  label: "Reparación",  icon: "🛠",  color: C.amber,  bg: C.amberSoft  },
  { id: "seguro",      label: "Seguro",      icon: "🛡",  color: C.violet, bg: C.violetSoft },
  { id: "patente",     label: "Patente",     icon: "📋", color: C.violet, bg: C.violetSoft },
  { id: "neumaticos",  label: "Neumáticos",  icon: "⚙",  color: C.slate,  bg: C.bone       },
  { id: "lavado",      label: "Lavado",      icon: "💧", color: C.green,  bg: C.greenSoft  },
  { id: "peaje",       label: "Peajes",      icon: "🚧", color: C.slate,  bg: C.bone       },
  { id: "otro",        label: "Otro",        icon: "📦", color: C.mist,   bg: C.paper      },
];

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const YEARS = [2023, 2024, 2025, 2026, 2027];

export const VCOLORS = [C.blue, C.green, C.amber, C.violet, C.rose, "#0C6B6B"];

/** Tipos de combustible con precio base unitario (sin impuestos). */
export const FUEL_TYPES = [
  { id: "gnc",        label: "GNC",        icon: "🔵" },
  { id: "super",      label: "Super",      icon: "🟢" },
  { id: "gasoil",     label: "Gasoil",     icon: "🟡" },
  { id: "eurodiesel", label: "Eurodiesel", icon: "🟠" },
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

export const S = {
  card:  { background: C.white, border: `1px solid ${C.bone}`, borderRadius: 16, padding: "1.25rem" },
  btn:   (bg, color, border) => ({
    padding: "9px 18px", background: bg, color, border: `1.5px solid ${border || bg}`,
    borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6,
  }),
  input: {
    width: "100%", boxSizing: "border-box", padding: "9px 12px", border: `1px solid ${C.bone}`,
    borderRadius: 9, fontSize: 14, background: C.white, color: C.ink, outline: "none",
  },
  label: {
    fontSize: 12, fontWeight: 500, color: C.slate, display: "block",
    marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em",
  },
  section: {
    fontSize: 11, fontWeight: 600, color: C.mist, textTransform: "uppercase",
    letterSpacing: "0.08em", marginBottom: 10, display: "block",
  },
};
