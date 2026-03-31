import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-[#d9b88a] bg-[#fffdf8] px-4 text-sm text-[#472b1c] shadow-[0_10px_20px_-16px_rgba(71,43,28,0.42)] outline-none transition placeholder:text-[#9c7555] focus:border-[#cf8f37] focus:bg-white focus:ring-2 focus:ring-[#f2cf95]",
        className,
      )}
      {...props}
    />
  );
}

