import { ActivityLogModule } from "@/components/modules/activity-log-module";
import { PageHeading } from "@/components/system/page-heading";

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; action?: string; q?: string; limit?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-5">
      <PageHeading
        title="Aktivitas User"
        description="Pantau aktivitas tambah, ubah, dan hapus data yang dilakukan user di seluruh menu operasional."
      />
      <ActivityLogModule searchParams={params} />
    </div>
  );
}
