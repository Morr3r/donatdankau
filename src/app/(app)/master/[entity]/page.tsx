import { notFound } from "next/navigation";

import { MasterModule } from "@/components/modules/master-module";
import { FlowNotice } from "@/components/system/flow-notice";
import { PageHeading } from "@/components/system/page-heading";

const masterTitle: Record<string, { title: string; description: string }> = {
  "raw-materials": {
    title: "Data Master Bahan Baku",
    description: "Kelola bahan baku inti termasuk harga standar, stok minimum, dan masa simpan.",
  },
  units: {
    title: "Data Master Satuan",
    description: "Standarisasi satuan transaksi seperti Kg, Gram, Liter, Pcs, Tray, dan Box.",
  },
  suppliers: {
    title: "Data Master Supplier",
    description: "Kelola supplier, kontak, alamat, dan produk yang disuplai.",
  },
  register: {
    title: "Registrasi Admin",
    description: "Daftarkan akun admin baru langsung aktif tanpa persetujuan.",
  },
};

export default async function MasterPage({
  params,
  searchParams,
}: {
  params: Promise<{ entity: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { entity } = await params;
  const { success, error } = await searchParams;

  const meta = masterTitle[entity];
  if (!meta) {
    notFound();
  }

  const nextStepByEntity: Record<string, { href: string; label: string } | undefined> = {
    units: { href: "/master/raw-materials", label: "Bahan Baku" },
    "raw-materials": { href: "/stock-movement/in", label: "Stok Awal" },
  };

  return (
    <div className="space-y-5">
      <PageHeading title={meta.title} description={meta.description} flowStep={1} flowLabel="Setup Awal" />
      <FlowNotice
        success={success}
        error={error}
        nextHref={nextStepByEntity[entity]?.href}
        nextLabel={nextStepByEntity[entity]?.label}
      />
      <MasterModule entity={entity} />
    </div>
  );
}

