import { Plus, Receipt } from "lucide-react";
import { MONTHS, VCOLORS } from "@/theme";
import { $fmt, totalOf } from "@/lib/calc";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared";
import { ExpenseRow } from "./ReportView";

export function LogView({ vehicles, expenses, fuelTypes, onNewExpense, onEditExpense, onDeleteExpense }) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No hay gastos cargados"
        hint="Cada gasto queda asociado a un vehículo y alimenta el informe mensual."
      >
        <Button onClick={() => onNewExpense()}><Plus />Cargar primer gasto</Button>
      </EmptyState>
    );
  }

  const groups = {};
  [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((e) => {
      const d = new Date(e.date);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (!groups[k]) groups[k] = { month: d.getMonth(), year: d.getFullYear(), exps: [] };
      groups[k].exps.push(e);
    });

  return Object.values(groups).map((g, i) => (
    <section key={`${g.year}-${g.month}`} className="mb-6 animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
      <header className="sticky top-0 z-10 -mx-1 mb-2 flex items-baseline justify-between gap-2 bg-background/85 px-1 py-2 backdrop-blur-sm">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          {MONTHS[g.month]} {g.year}
          <span className="ml-1.5 font-normal normal-case tracking-normal opacity-70">
            · {g.exps.length} {g.exps.length === 1 ? "gasto" : "gastos"}
          </span>
        </h2>
        <span className="text-[13px] font-semibold tabular">{$fmt(totalOf(g.exps))}</span>
      </header>

      <div className="flex flex-col gap-1.5">
        {g.exps.map((e) => {
          const v = vehicles.find((x) => x.id === e.vehicleId);
          return (
            <ExpenseRow
              key={e.id}
              e={e}
              vehicle={v}
              vehicleColor={v ? VCOLORS[v.colorIdx || 0] : undefined}
              fuelTypes={fuelTypes}
              onEdit={() => onEditExpense(e)}
              onDelete={() => onDeleteExpense(e.id)}
            />
          );
        })}
      </div>
    </section>
  ));
}
