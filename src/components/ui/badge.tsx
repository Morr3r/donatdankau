import { cn } from "@/lib/utils";

const variants = {
  neutral: "border border-[#e7ccb0] bg-[#fff6e8] text-[#5d3b2a]",
  warning: "border border-[#f0cc89] bg-[#fff1d9] text-[#8f6016]",
  danger: "border border-[#f0bcc4] bg-[#fff0f2] text-[#b33647]",
  success: "border border-[#ecc889] bg-[#fff2db] text-[#ab6e08]",
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

