import { notFound } from "next/navigation";

import { StockOpnameModule } from "@/components/modules/stock-opname-module";
import { FlowNotice } from "@/components/system/flow-notice";
import { PageHeading } from "@/components/system/page-heading";

const sectionMeta: Record<string, { title: string; description: string }> = {
  create: {
    title: "Persiapan Stock Opname",
    description: "Rapikan stok, pisahkan waste, dan siapkan checklist sebelum penghitungan fisik.",
  },
  process: {
    title: "Penghitungan & Rekonsiliasi",
    description: "Bandingkan stok saat ini dengan stok sistem (terakhir) dan lihat selisih kuantitas beserta nilai rupiahnya.",
  },
  history: {
    title: "Rekap Stock Opname Bulanan",
    description: "Pantau selisih stok bulanan per dokumen, termasuk total selisih qty dan total selisih nilai.",
  },
};

export default async function StockOpnamePage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ id?: string; success?: string; error?: string }>;
}) {
  const { section } = await params;
  const meta = sectionMeta[section];

  if (!meta) {
    notFound();
  }

  const { id, success, error } = await searchParams;

  const nextStepBySection: Record<string, { href: string; label: string } | undefined> = {
    create: { href: "/stock-opname/process", label: "Hitung & Rekonsiliasi" },
    process: { href: "/stock-opname/history", label: "Rekap Bulanan" },
  };

  return (
    <div className="space-y-5">
      <PageHeading title={meta.title} description={meta.description} flowStep={3} flowLabel="Tutup Bulan" />
      <FlowNotice
        success={success}
        error={error}
        nextHref={nextStepBySection[section]?.href}
        nextLabel={nextStepBySection[section]?.label}
      />
      <StockOpnameModule section={section} opnameId={id} />
    </div>
  );
}

