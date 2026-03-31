import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f8ebd6] via-[#efd5ac] to-[#e2ba86] text-[#3e2418]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-16 h-72 w-72 rounded-full bg-[#f8c97c]/35 blur-3xl" />
        <div className="absolute -right-24 top-16 h-80 w-80 rounded-full bg-[#e99cbf]/30 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:64px_64px] opacity-25" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
