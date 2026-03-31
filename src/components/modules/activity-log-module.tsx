import { Card, CardDescription, CardTitle, CardValue } from "@/components/ui/card";
import { Field, Label } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { ActivityLogPaginatedTable } from "@/components/modules/activity-log-paginated-table";
import { getActivityLogData, type ActivityLogQueryInput } from "@/lib/queries/activity-log";

export async function ActivityLogModule({ searchParams }: { searchParams?: ActivityLogQueryInput }) {
  const data = await getActivityLogData(searchParams);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardTitle>Total Log Tampil</CardTitle>
          <CardValue className="mt-2">{data.summary.total}</CardValue>
        </Card>
        <Card>
          <CardTitle>Tambah</CardTitle>
          <CardValue className="mt-2">{data.summary.create}</CardValue>
        </Card>
        <Card>
          <CardTitle>Ubah</CardTitle>
          <CardValue className="mt-2">{data.summary.update}</CardValue>
        </Card>
        <Card>
          <CardTitle>Hapus</CardTitle>
          <CardValue className="mt-2">{data.summary.delete}</CardValue>
        </Card>
        <Card>
          <CardTitle>User Aktif</CardTitle>
          <CardValue className="mt-2">{data.summary.users}</CardValue>
          <CardDescription className="mt-2">Jumlah user unik pada data yang sedang difilter.</CardDescription>
        </Card>
      </div>

      <Card>
        <CardTitle>Filter Aktivitas</CardTitle>
        <CardDescription className="mt-3">
          Tampilkan log sesuai user, jenis aksi, dan kata kunci agar review perubahan data lebih cepat.
        </CardDescription>

        <form method="get" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Field>
            <Label htmlFor="userId">User</Label>
            <Select id="userId" name="userId" defaultValue={data.filters.userId}>
              <option value="">Semua user</option>
              {data.allUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.username ? `(@${user.username})` : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label htmlFor="action">Jenis Aksi</Label>
            <Select id="action" name="action" defaultValue={data.filters.action}>
              <option value="CRUD">CRUD (Tambah/Ubah/Hapus)</option>
              <option value="ALL">Semua aksi</option>
              <option value="CREATE">Tambah saja</option>
              <option value="UPDATE">Ubah saja</option>
              <option value="DELETE">Hapus saja</option>
            </Select>
          </Field>

          <Field>
            <Label htmlFor="q">Kata Kunci</Label>
            <input
              id="q"
              name="q"
              defaultValue={data.filters.keyword}
              placeholder="Cari modul, detail, atau nama user"
              className="h-12 w-full rounded-xl border border-[#d9b88a] bg-[#fffdf8] px-4 text-sm text-[#472b1c] shadow-[0_10px_20px_-16px_rgba(71,43,28,0.42)] outline-none transition placeholder:text-[#9a7558] focus:border-[#cf8f37] focus:bg-white focus:ring-2 focus:ring-[#f2cf95]"
            />
          </Field>

          <Field>
            <Label htmlFor="limit">Jumlah Data</Label>
            <div className="flex gap-2">
              <Select id="limit" name="limit" defaultValue={String(data.filters.limit)} className="min-w-0 flex-1">
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="500">500</option>
              </Select>
              <button
                type="submit"
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl border border-[#c88734] bg-[#efb14e] px-4 text-sm font-semibold text-[#3c2318] transition hover:bg-[#e6a43c]"
              >
                Terapkan
              </button>
            </div>
          </Field>
        </form>
      </Card>

      <Card>
        <CardTitle>Riwayat Aktivitas User</CardTitle>
        <CardDescription className="mt-3">
          Menampilkan jejak perubahan data: kapan, oleh siapa, di modul mana, dan detail apa yang dilakukan.
        </CardDescription>

        <div className="mt-4">
          <ActivityLogPaginatedTable
            rows={data.rows.map((row) => ({
              id: row.id,
              createdAt: row.createdAt.toISOString(),
              module: row.module,
              action: row.action,
              entity: row.entity,
              entityId: row.entityId,
              details: row.details,
              user: row.user,
            }))}
          />
        </div>
      </Card>
    </div>
  );
}
