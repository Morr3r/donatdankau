import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-[#e8c89d] bg-[#fff9ef] p-4 shadow-[0_24px_50px_-34px_rgba(81,47,26,0.44)] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(229,143,180,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(243,197,94,0.16),transparent_32%)] sm:p-5",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "relative z-10 text-sm font-semibold uppercase tracking-[0.18em] text-[#7f583a]",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("relative z-10 text-sm leading-6 text-[#775842]", className)} {...props} />;
}

export function CardValue({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("relative z-10 text-3xl font-semibold tracking-[-0.05em] text-[#3f2417]", className)} {...props} />;
}

