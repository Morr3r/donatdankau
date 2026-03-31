"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Store, Waypoints } from "lucide-react";

import { navGroups, navTourTargets } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      data-tour="sidebar-shell"
      className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[320px] shrink-0 overflow-hidden rounded-[30px] border border-[#f1d6b2]/35 bg-gradient-to-b from-[#5a3523] via-[#4a2b1d] to-[#2f1b12] p-4 text-[#fff4e7] shadow-[0_40px_80px_-42px_rgba(35,18,10,0.8)] lg:block"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,143,180,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(241,183,93,0.22),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:52px_52px] opacity-25" />
      </div>

      <div className="relative flex h-full flex-col">
        <div className="mb-6 rounded-[24px] border border-[#f7dfbf]/22 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <Image
                src="/logo.png"
                alt="Logo Donat Dankau"
                fill
                sizes="80px"
                className="object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#f6dcc0]/80">Donat Dankau</p>
              <h1 className="mt-1 text-xl font-semibold leading-tight text-white">Stock Opname</h1>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/12 bg-white/10 p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#f7e4ce]/70">Skala</p>
              <p className="mt-1 text-sm font-semibold text-white">UMKM Satu Toko</p>
            </div>
            <div className="rounded-xl border border-white/12 bg-white/10 p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#f7e4ce]/70">Fokus</p>
              <p className="mt-1 text-sm font-semibold text-white">3 Tahap Operasional</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="flex items-center gap-2 px-1.5">
                <Sparkles size={13} className="text-[#f3c45f]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5dcc0]/65">{group.title}</p>
              </div>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-tour={navTourTargets[item.href]}
                      className={cn(
                        "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-sm font-medium tracking-[0.01em] transition",
                        active
                          ? "border border-[#f7d79f]/52 bg-[linear-gradient(135deg,#f4c45f,#e997bd)] text-[#331c10] shadow-[0_16px_30px_-18px_rgba(238,171,73,0.62)]"
                          : "border border-transparent text-[#f6ddc0]/82 hover:border-white/12 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition",
                          active
                            ? "border-white/38 bg-white/38 text-[#4b2f1f]"
                            : "border-white/12 bg-white/10 text-[#f8e3cc]/75 group-hover:border-white/18 group-hover:bg-white/16 group-hover:text-white",
                        )}
                      >
                        <Icon size={17} />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-5 rounded-[22px] border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.16)] text-[#f3c45f]">
              <Store size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#f7dfc3]/75">Checklist Hari Ini</p>
              <p className="mt-1 text-sm font-semibold text-white">Siap input opname bahan baku donat</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-[#f3e0cb]/78">
                <Waypoints size={12} />
                1 Toko Aktif
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
