import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getOnboardingChecklistData } from "@/lib/queries/onboarding";

function ChecklistRow({ done, label, href }: { done: boolean; label: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#ecd0ab] bg-[#fff4e3] px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-[#4b2f1f]">
        {done ? <CheckCircle2 size={16} className="text-[#b57515]" /> : <Circle size={16} className="text-[#9b7554]" />}
        <span>{label}</span>
      </div>
      {href ? (
        <Link
          href={href}
          className="rounded-lg border border-[#e4c99f] bg-[#fff8ee] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#7b5537]"
        >
          Buka
        </Link>
      ) : null}
    </div>
  );
}

export async function OnboardingModule() {
  const data = await getOnboardingChecklistData();

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle>Progress Alur</CardTitle>
        <CardDescription className="mt-3">Checklist otomatis akan tercentang saat data Anda sudah tercatat di sistem.</CardDescription>
        <div className="mt-4 rounded-xl border border-[#ecd0ab] bg-[#fff4e3] px-4 py-3">
          <p className="text-sm font-semibold text-[#4b2f1f]">Tahapan selesai: {data.stageDone} dari 3</p>
        </div>
        {data.nextStep ? (
          <Link
            href={data.nextStep.href}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-[#c88734] bg-[#efb14e] px-4 text-sm font-semibold text-[#3c2318] transition hover:bg-[#e6a43c]"
          >
            Lanjut: {data.nextStep.label}
          </Link>
        ) : (
          <p className="mt-4 text-sm text-[#6e503c]">Semua tahapan sudah lengkap. Anda bisa lanjut operasional normal.</p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card>
          <CardTitle>1. Setup Awal</CardTitle>
          <div className="mt-4 space-y-3">
            <ChecklistRow done={data.setup.unitDone} label="Buat satuan" href="/master/units" />
            <ChecklistRow done={data.setup.materialDone} label="Input bahan baku" href="/master/raw-materials" />
            <ChecklistRow done={data.setup.priceDone} label="Isi harga standar" href="/master/raw-materials" />
            <ChecklistRow done={data.setup.initialStockDone} label="Catat stok awal" href="/stock-movement/in" />
          </div>
        </Card>

        <Card>
          <CardTitle>2. Operasional Harian</CardTitle>
          <div className="mt-4 space-y-3">
            <ChecklistRow done={data.daily.stockInDone} label="Pakai menu stok masuk" href="/stock-movement/in" />
            <ChecklistRow done={data.daily.stockOutDone} label="Pakai menu stok keluar" href="/stock-movement/out" />
            <ChecklistRow done={data.daily.adjustmentDone} label="Pakai menu adjustment" href="/stock-movement/adjustments" />
          </div>
        </Card>

        <Card>
          <CardTitle>3. Tutup Bulan</CardTitle>
          <div className="mt-4 space-y-3">
            <ChecklistRow done={data.closing.createDone} label="Buat dokumen opname" href="/stock-opname/create" />
            <ChecklistRow done={data.closing.countDone} label="Input hitung fisik" href="/stock-opname/process" />
            <ChecklistRow done={data.closing.recapDone} label="Lihat rekap bulanan" href="/stock-opname/history" />
          </div>
        </Card>
      </div>
    </div>
  );
}
