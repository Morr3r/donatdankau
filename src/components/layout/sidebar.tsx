"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Store, Waypoints } from "lucide-react";

import { navGroups, navTourTargets } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      data-tour="sidebar-shell"
      className={cn(
        "sticky top-4 hidden h-[calc(100vh-2rem)] shrink-0 overflow-hidden border border-[#f1d6b2]/35 bg-gradient-to-b from-[#5a3523] via-[#4a2b1d] to-[#2f1b12] text-[#fff4e7] shadow-[0_40px_80px_-42px_rgba(35,18,10,0.8)] transition-[width,padding,border-radius] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:block",
        collapsed ? "w-[112px] rounded-[24px] p-3" : "w-[320px] rounded-[30px] p-4",
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,143,180,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(241,183,93,0.22),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:52px_52px] opacity-25" />
      </div>

      <div className={cn("relative flex h-full flex-col", collapsed && "items-center")}>
        <div
          className={cn(
            "mb-5 w-full border border-[#f7dfbf]/22 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-[padding,border-radius] duration-300",
            collapsed ? "rounded-2xl p-3" : "rounded-[24px] p-5",
          )}
        >
          <div className={cn("flex", collapsed ? "flex-col items-center gap-2" : "items-start justify-between gap-3")}>
            <div className={cn("flex items-center", collapsed ? "order-2 justify-center" : "order-1 gap-4")}>
              <div className={cn("relative shrink-0 transition-[height,width] duration-300", collapsed ? "h-14 w-14" : "h-20 w-20")}>
                <Image
                  src="/logo.png"
                  alt="Logo Donat Dankau"
                  fill
                  sizes={collapsed ? "56px" : "80px"}
                  className="object-contain"
                  priority
                />
              </div>
              {!collapsed ? (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#f6dcc0]/80">Donat Dankau</p>
                  <h1 className="mt-1 text-xl font-semibold leading-tight text-white">Stock Opname</h1>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.2),rgba(255,255,255,0.08))] text-[#f9dec2] shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-sm transition duration-200 hover:border-[#f0c57f]/70 hover:text-[#ffd8a7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c57f]",
                collapsed ? "order-1" : "order-2 mt-0.5",
              )}
            >
              {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </button>
          </div>

          {!collapsed ? (
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
          ) : null}
        </div>

        <nav className={cn("flex-1 overflow-y-auto", collapsed ? "space-y-2" : "space-y-6 pr-1")}>
          {navGroups.map((group) => (
            <div key={group.title} className={cn(collapsed ? "space-y-2" : "space-y-2")}>
              {!collapsed ? (
                <div className="px-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f5dcc0]/65">{group.title}</p>
                </div>
              ) : null}

              <div className={cn("space-y-1.5", collapsed && "space-y-2")}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-tour={navTourTargets[item.href]}
                      title={collapsed ? item.label : undefined}
                      aria-label={item.label}
                      className={cn(
                        "group relative flex overflow-hidden rounded-xl text-sm font-medium tracking-[0.01em] transition duration-200",
                        collapsed ? "items-center justify-center px-2 py-2.5" : "items-center gap-3 px-3 py-3",
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
                      {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div
          className={cn(
            "mt-5 w-full border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] transition-[padding,border-radius] duration-300",
            collapsed ? "rounded-2xl p-2.5" : "rounded-[22px] p-4",
          )}
        >
          <div className={cn("flex", collapsed ? "flex-col items-center gap-2" : "items-start gap-3")}>
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.16)] text-[#f3c45f]">
              {collapsed ? <Waypoints size={16} /> : <Store size={18} />}
            </div>
            <div className={cn(collapsed && "text-center")}>
              {!collapsed ? (
                <>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#f7dfc3]/75">Checklist Hari Ini</p>
                  <p className="mt-1 text-sm font-semibold text-white">Siap input opname bahan baku donat</p>
                </>
              ) : null}

              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 text-[11px] uppercase tracking-[0.15em] text-[#f3e0cb]/78",
                  collapsed ? "px-2.5 py-1.5" : "mt-3 px-3 py-1",
                )}
              >
                <Waypoints size={12} />
                {collapsed ? "1" : "1 Toko Aktif"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
