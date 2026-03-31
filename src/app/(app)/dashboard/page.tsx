import { DashboardModule } from "@/components/modules/dashboard-module";
import { PageHeading } from "@/components/system/page-heading";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-5">
      <PageHeading
        title="Ringkasan Stock Opname"
        description="Pantau stok sistem, stok fisik, dan kontrol selisih stok bahan baku donat secara ringkas."
      />
      <DashboardModule searchParams={params} />
    </div>
  );
}

