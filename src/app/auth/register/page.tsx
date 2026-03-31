import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldPlus } from "lucide-react";

import { RegisterForm } from "@/components/auth/register-form";
import { registerAction } from "@/lib/actions/auth";
import { getAuthUser } from "@/lib/auth/session";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await getAuthUser();
  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#d9b787] bg-[#fff4e0] shadow-[0_20px_48px_-28px_rgba(78,45,26,0.45)] lg:grid-cols-[0.96fr_1.04fr]">
        <div className="relative hidden overflow-hidden border-r border-[#f0d4ad]/40 bg-[url('/background1.jpeg')] bg-cover bg-center p-10 text-[#fff4e8] lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(28,16,12,0.74)_0%,rgba(48,30,21,0.66)_42%,rgba(22,14,11,0.78)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,143,180,0.2),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(243,197,94,0.22),transparent_32%)]" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-[#f4d8b4]/30 bg-white/10 px-4 py-2">
                <div className="relative h-10 w-10 overflow-hidden rounded-2xl ring-1 ring-white/20">
                  <Image src="/logo.png" alt="Logo Donat Dankau" fill sizes="40px" className="object-cover" priority />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#f2d8b7]/80">Donat Dankau</p>
                  <p className="text-sm font-semibold text-white">Admin Registration</p>
                </div>
              </div>

              <h1 className="mt-10 max-w-md text-5xl font-semibold tracking-[-0.06em] text-white">
                Buat akses admin baru dengan alur yang rapi dan cepat.
              </h1>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-[#f6dcbc]/24 bg-white/10 p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#f8dec1]/65">Akses</p>
                <p className="mt-2 text-2xl font-semibold text-white">Instant Active</p>
                <p className="mt-2 text-sm text-[#fae7d2]/85">Akun admin siap dipakai segera setelah registrasi berhasil.</p>
              </div>
              <div className="rounded-[24px] border border-[#f6dcbc]/24 bg-white/10 p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#f8dec1]/65">Flow</p>
                <p className="mt-2 text-2xl font-semibold text-white">Simple</p>
                <p className="mt-2 text-sm text-[#fae7d2]/85">Dirancang untuk operasional toko tunggal tanpa approval berlapis.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#e8c490] bg-[#ffefd5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8f6045]">
                Registrasi Admin
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#402518] sm:text-4xl">Buat akun baru</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-[#6d4f39]">
                Lengkapi form di bawah untuk membuat akun admin dengan validasi manual dan akses langsung aktif.
              </p>
            </div>
            <div className="hidden h-14 w-14 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#f4c45e,#e99cbf)] text-[#4b2f1f] shadow-[0_14px_28px_-20px_rgba(133,75,28,0.55)] sm:flex">
              <ShieldPlus size={24} />
            </div>
          </div>

          {params.success ? (
            <p className="mt-4 rounded-xl border border-[#f0cf8f] bg-[#fff3dd] px-4 py-3 text-sm text-[#8f5d15]">{params.success}</p>
          ) : null}
          {params.error ? <p className="mt-4 rounded-xl border border-[#f0b1b8] bg-[#fff2f4] px-4 py-3 text-sm text-[#9b2f39]">{params.error}</p> : null}

          <RegisterForm action={registerAction} />

          <div className="mt-6 rounded-[22px] border border-[#e6c292] bg-[#fff9ee] p-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-xl border border-[#d9b88b] bg-[#fff4e3] px-3 py-2 text-sm font-semibold text-[#7a5237] transition hover:bg-[#ffeacd] hover:text-[#4b2f1f]"
            >
              <ArrowLeft size={16} />
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
