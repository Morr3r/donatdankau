import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { CgProfile } from "react-icons/cg";

import { LoginForm } from "@/components/auth/login-form";
import { loginAction } from "@/lib/actions/auth";
import { getAuthUser } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await getAuthUser();
  if (user) {
    redirect("/dashboard");
  }

  const { success, error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#d9b787] bg-[#fff4e0] shadow-[0_20px_48px_-28px_rgba(78,45,26,0.45)] lg:grid-cols-[1.12fr_0.88fr]">
        <div className="relative hidden overflow-hidden border-r border-[#f0d4ad]/40 bg-[url('/background1.jpeg')] bg-cover bg-center p-10 text-[#fff4e8] lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(28,16,12,0.74)_0%,rgba(48,30,21,0.66)_42%,rgba(22,14,11,0.78)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(233,138,181,0.2),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(243,197,94,0.22),transparent_32%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-[#f4d8b4]/30 bg-white/10 px-4 py-2">
                <div className="relative h-10 w-10 overflow-hidden rounded-2xl ring-1 ring-white/20">
                  <Image src="/logo.png" alt="Logo Donat Dankau" fill sizes="40px" className="object-cover" priority />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#ffff]/80">Donat Dankau</p>
                </div>
              </div>

              <h1 className="mt-10 max-w-md text-5xl font-semibold tracking-[-0.06em] text-white">
                Website Monitoring Stock Opname and POS System Donat Dankau.
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[26px] border border-[#f6dcbc]/24 bg-white/10 p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#f8dec1]/65">Periode</p>
                <p className="mt-2 text-2xl font-semibold text-white">3 Jadwal</p>
                <p className="mt-2 text-sm text-[#fae7d2]/85">Harian, mingguan, dan bulanan untuk stok opname.</p>
              </div>
              <div className="rounded-[26px] border border-[#f6dcbc]/24 bg-white/10 p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#f8dec1]/65">Skala</p>
                <p className="mt-2 text-2xl font-semibold text-white">UMKM</p>
                <p className="mt-2 text-sm text-[#fae7d2]/85">Dirancang untuk satu toko tanpa cabang.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="mb-7">
            <div className="flex items-start justify-between gap-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#e8c490] bg-[#ffefd5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8f6045]">
                <Sparkles size={12} className="text-[#e99cbf]" />
                Admin Login
              </p>
              <div className="hidden h-14 w-14 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#f4c45e,#e99cbf)] text-[#4b2f1f] shadow-[0_14px_28px_-20px_rgba(133,75,28,0.55)] sm:flex">
                <ShieldCheck size={24} />
              </div>
            </div>
            <h2 className="mt-4 flex justify-center text-[#402518]">
              <CgProfile size={84} aria-label="Profil" />
            </h2>
          </div>

          {success ? (
            <p className="mt-4 rounded-xl border border-[#f0cf8f] bg-[#fff3dd] px-4 py-3 text-sm text-[#8f5d15]">{success}</p>
          ) : null}
          {error ? <p className="mt-4 rounded-xl border border-[#f0b1b8] bg-[#fff2f4] px-4 py-3 text-sm text-[#9b2f39]">{error}</p> : null}

          <LoginForm action={loginAction} />

          <div className="mt-6 flex flex-col gap-3 rounded-[22px] border border-[#e6c292] bg-[#fff9ee] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#4b2f1f]">Belum punya akun admin?</p>
            </div>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl border border-[#d89f48] bg-[#f5ba5f] px-4 py-3 text-sm font-semibold text-[#3d2418] transition hover:bg-[#efaf49]"
            >
              Registrasi Admin
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
