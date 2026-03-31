import { cn } from "@/lib/utils";

export function TableWrapper({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-[20px] border border-[#ead0aa] bg-[#fffdf8] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_16px_36px_-28px_rgba(71,43,28,0.42)]",
        className,
      )}
      {...props}
    />
  );
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full min-w-[640px] border-separate border-spacing-0 sm:min-w-[760px]", className)} {...props} />;
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-[#ecd4b0] bg-[#fcecd3] px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7c593e] sm:px-4 sm:py-3.5 sm:text-[11px] sm:tracking-[0.18em]",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("border-b border-[#f0ddc2] px-3 py-3 text-xs text-[#4d311f] sm:px-4 sm:py-3.5 sm:text-sm", className)}
      {...props}
    />
  );
}

