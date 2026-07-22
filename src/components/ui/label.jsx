import { cn } from "@/lib/utils";

function Label({ className, required, children, ...props }) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

export { Label };
