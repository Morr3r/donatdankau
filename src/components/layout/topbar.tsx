"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronDown, Clock3, LogOut, ShieldCheck, Sparkles, UserCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { logoutAction } from "@/lib/actions/auth";
import { navGroups, navTourTargets } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const flatItems = navGroups.flatMap((group) => group.items);

export function Topbar({
  currentUser,
}: {
  currentUser: {
    id: string;
    name: string;
    username: string;
  };
}) {
  const pathname = usePathname();
  const activeItem = flatItems.find((item) => item.href === pathname);
  const [openProfile, setOpenProfile] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [serverTimeZone, setServerTimeZone] = useState("Asia/Jakarta");
  const profileRef = useRef<HTMLDivElement>(null);
  const serverOffsetMsRef = useRef(0);

  useEffect(() => {
    let active = true;

    async function syncFromServer() {
      try {
        const response = await fetch("/api/server-time", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as {
          epochMs?: number;
          timeZone?: string;
        };

        if (!active) return;

        if (typeof payload.epochMs === "number") {
          serverOffsetMsRef.current = payload.epochMs - Date.now();
          setNow(new Date(payload.epochMs));
        }

        if (typeof payload.timeZone === "string" && payload.timeZone.trim().length > 0) {
          setServerTimeZone(payload.timeZone);
        }
      } catch {
        // fallback ke waktu lokal jika sinkronisasi server gagal sementara
      }
    }

    void syncFromServer();

    const tickTimer = window.setInterval(() => {
      setNow(new Date(Date.now() + serverOffsetMsRef.current));
    }, 1000);
    const syncTimer = window.setInterval(() => {
      void syncFromServer();
    }, 60_000);

    return () => {
      active = false;
      window.clearInterval(tickTimer);
      window.clearInterval(syncTimer);
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setOpenProfile(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!openProfile) return;

    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenProfile(false);
      }
    }

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [openProfile]);

  const fullDate = useMemo(
    () => {
      try {
        return new Intl.DateTimeFormat("id-ID", {
          dateStyle: "full",
          timeZone: serverTimeZone,
        }).format(now);
      } catch {
        return new Intl.DateTimeFormat("id-ID", {
          dateStyle: "full",
        }).format(now);
      }
    },
    [now, serverTimeZone],
  );

  const shortTime = useMemo(
    () => {
      try {
        return new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
          timeZone: serverTimeZone,
        }).format(now);
      } catch {
        return new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        }).format(now);
      }
    },
    [now, serverTimeZone],
  );

  return (
    <header className="relative z-20 space-y-2 sm:space-y-3">
      <div className="rounded-[26px] border border-[#ecd0ab] bg-[#fff9ef] shadow-[0_24px_52px_-34px_rgba(71,43,28,0.45)]">
        <div className="mx-auto flex min-h-[72px] w-full max-w-[1740px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:min-h-[82px] sm:gap-4 sm:px-6 lg:flex-nowrap lg:px-8">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ebc999] bg-[#fff1dc] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6043]">
              <Sparkles size={12} className="text-[#e58fb4]" />
              Donat Dankau
            </div>
            <h2 className="mt-2 truncate text-xl font-semibold tracking-[-0.04em] text-[#3f2418] sm:mt-3 sm:text-2xl md:text-[1.75rem]">
              {activeItem?.label ?? "Checklist Onboarding"}
            </h2>
          </div>

          <div className="hidden items-center gap-3 text-sm md:flex">
            <div className="rounded-xl border border-[#ecd0ab] bg-[#fff4e5] px-4 py-2 text-[#5a3523] shadow-[0_12px_24px_-20px_rgba(81,47,26,0.36)]">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a684a]">
                <CalendarDays size={13} />
                Tanggal
              </div>
              <p className="mt-1 whitespace-nowrap text-sm font-semibold">{fullDate}</p>
            </div>
            <div className="rounded-xl border border-[#ecd0ab] bg-[#fff4e5] px-4 py-2 text-[#5a3523] shadow-[0_12px_24px_-20px_rgba(81,47,26,0.36)]">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a684a]">
                <Clock3 size={13} />
                Waktu
              </div>
              <p className="mt-1 whitespace-nowrap text-sm font-semibold">{shortTime}</p>
            </div>
          </div>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setOpenProfile((prev) => !prev)}
              aria-expanded={openProfile}
              aria-haspopup="menu"
              className={cn(
                "group flex items-center gap-3 rounded-2xl border bg-[linear-gradient(145deg,#fff5e7_0%,#ffedd8_100%)] px-3 py-2 text-left shadow-[0_16px_34px_-22px_rgba(81,47,26,0.42)] outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[#f0c57f]",
                openProfile
                  ? "border-[#cd8d39] shadow-[0_22px_42px_-24px_rgba(81,47,26,0.5)]"
                  : "border-[#e6c494] hover:border-[#d29a53] hover:shadow-[0_20px_38px_-24px_rgba(81,47,26,0.45)]",
              )}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#efcb98] bg-[linear-gradient(135deg,#f3bc5f,#e58fb4)] text-[#4b2f1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
                <UserCircle2 size={20} />
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold text-[#4b2f1f]">{currentUser.name}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-[#87664a]">Admin Toko</p>
              </div>
              <ChevronDown
                size={15}
                className={cn(
                  "text-[#7a573e] transition duration-200 group-hover:text-[#ba7a37]",
                  openProfile && "rotate-180 text-[#ba7a37]",
                )}
              />
            </button>

            {openProfile ? (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-[24px] border border-[#ebcc9c] bg-[linear-gradient(180deg,#fffaf2_0%,#ffefd8_100%)] p-4 shadow-[0_28px_56px_-30px_rgba(71,43,28,0.52)] sm:w-72"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#f2d4aa] to-transparent"
                />
                <div className="rounded-[18px] border border-[#f0d5ae] bg-[#fff1dd] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#f3bc5f,#e58fb4)] text-[#4b2f1f]">
                      <UserCircle2 size={22} />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#4b2f1f]">{currentUser.name}</p>
                      <p className="text-sm text-[#7a573e]">@{currentUser.username}</p>
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#e8cdab] bg-[#fff7ec] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9b6d16]">
                        <ShieldCheck size={12} /> Admin Aktif
                      </p>
                    </div>
                  </div>
                </div>

                <form action={logoutAction} className="mt-4">
                  <button
                    type="submit"
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#c88734] bg-[#efb14e] text-sm font-semibold text-[#3c2318] transition hover:bg-[#e6a43c]"
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-[16px] border border-[#ebcc9f] bg-[#fff9ef] p-2 shadow-[0_16px_34px_-26px_rgba(71,43,28,0.35)] sm:grid-cols-2 md:hidden">
        <div className="rounded-xl border border-[#ecd0ab] bg-[#fff4e5] px-3 py-2 text-[#5a3523]">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a684a]">
            <CalendarDays size={12} />
            Tanggal
          </div>
          <p className="mt-1 truncate text-xs font-semibold">{fullDate}</p>
        </div>
        <div className="rounded-xl border border-[#ecd0ab] bg-[#fff4e5] px-3 py-2 text-[#5a3523]">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a684a]">
            <Clock3 size={12} />
            Waktu
          </div>
          <p className="mt-1 truncate text-xs font-semibold">{shortTime}</p>
        </div>
      </div>

      <div
        data-tour="mobile-nav-scroll"
        className="flex gap-2 overflow-x-auto rounded-[20px] border border-[#ebcc9f] bg-[#fff9ef] px-3 py-3 shadow-[0_16px_34px_-26px_rgba(71,43,28,0.35)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
      >
        {flatItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-tour={navTourTargets[item.href]}
            className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
              pathname === item.href
                ? "border-[#d8923f] bg-[#f1b14d] text-[#3a2114]"
                : "border-[#efd7b8] bg-[#fff5e7] text-[#5a3523]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
