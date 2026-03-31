import { notFound } from "next/navigation";

import { StockMovementModule } from "@/components/modules/stock-movement-module";
import { FlowNotice } from "@/components/system/flow-notice";
import { PageHeading } from "@/components/system/page-heading";

const sectionMeta: Record<string, { title: string; description: string }> = {
  in: {
    title: "Stok Masuk",
    description: "Catat stok awal atau pembelian bahan baku yang menambah stok sistem.",
  },
  out: {
    title: "Stok Keluar",
    description: "Catat pemakaian bahan baku harian agar stok sistem selalu sesuai kondisi aktual.",
  },
  adjustments: {
    title: "Adjustment Stok",
    description: "Koreksi stok jika ada selisih fisik, barang rusak, atau kondisi khusus lainnya.",
  },
};

export default async function StockMovementPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { section } = await params;
  const { success, error } = await searchParams;
  const meta = sectionMeta[section];

  if (!meta) {
    notFound();
  }

  const nextStepBySection: Record<string, { href: string; label: string } | undefined> = {
    in: { href: "/stock-movement/out", label: "Stok Keluar" },
    out: { href: "/stock-movement/adjustments", label: "Adjustment" },
    adjustments: { href: "/stock-opname/create", label: "Persiapan Opname" },
  };

  return (
    <div className="space-y-5">
      <PageHeading title={meta.title} description={meta.description} flowStep={2} flowLabel="Operasional Harian" />
      <FlowNotice
        success={success}
        error={error}
        nextHref={nextStepBySection[section]?.href}
        nextLabel={nextStepBySection[section]?.label}
      />
      <StockMovementModule section={section} />
    </div>
  );
}

