import { cn } from "@/lib/utils";

const variants = {
  primary:
    "border border-[#c98834] bg-[linear-gradient(135deg,#f0b04d_0%,#e596be_100%)] text-[#3a2217] shadow-[0_18px_32px_-20px_rgba(149,88,32,0.65)] hover:brightness-[1.04]",
  secondary:
    "border border-[#e8ca9f] bg-[#fff6e9] text-[#5a3523] shadow-[0_14px_24px_-20px_rgba(81,47,26,0.35)] hover:bg-[#ffefdc]",
  ghost: "border border-transparent bg-transparent text-[#6d4c36] hover:bg-[#fff2df]",
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, type = "button", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

