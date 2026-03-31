import { notFound } from "next/navigation";

import { ReportsModule } from "@/components/modules/reports-module";
import { PageHeading } from "@/components/system/page-heading";

const sectionMeta: Record<string, { title: string; description: string }> = {
  "current-stock": {
    title: "Laporan - Stok Saat Ini",
    description: "Lihat stok bahan baku toko utama dan nilai stok saat ini.",
  },
  "stock-card": {
    title: "Laporan - Kartu Stok",
    description: "Pantau riwayat mutasi per item: saldo awal, masuk, keluar, dan saldo akhir.",
  },
  opname: {
    title: "Laporan - Stock Opname",
    description: "Analisis hasil opname per periode, selisih item, dan lokasi dengan selisih terbesar.",
  },
  inbound: {
    title: "Laporan - Barang Masuk",
    description: "Rekap pembelian per supplier dan penerimaan barang per periode.",
  },
  outbound: {
    title: "Laporan - Barang Keluar",
    description: "Rekap pemakaian bahan, rusak, expired, dan transfer keluar.",
  },
  "waste-variance": {
    title: "Laporan - Waste & Selisih",
    description: "Laporan total selisih stok, total rusak/expired, dan item paling sering selisih.",
  },
  "user-activity": {
    title: "Laporan - Aktivitas User",
    description: "Audit siapa input apa, jam aktivitas, dan perubahan data penting.",
  },
};

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { section } = await params;
  const meta = sectionMeta[section];

  if (!meta) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;

  return (
    <div className="space-y-5">
      <PageHeading title={meta.title} description={meta.description} />
      <ReportsModule section={section} searchParams={resolvedSearchParams} />
    </div>
  );
}

