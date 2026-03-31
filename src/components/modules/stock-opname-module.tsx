import Link from "next/link";

import { opnameStatusLabel } from "@/lib/constants";
import { createOpnameAction, submitOpnameAction, upsertOpnameItemAction } from "@/lib/actions/stock";
import { DraftOpnameRowActions, OpnameItemRowActions } from "@/components/modules/stock-opname-row-actions";
import { currencyFormatter, formatDate, formatNumber } from "@/lib/format";
import { getStockOpnamePageData } from "@/lib/queries/stock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, Label } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";

export async function StockOpnameModule({
  section,
  opnameId,
}: {
  section: string;
  opnameId?: string;
}) {
  const data = await getStockOpnamePageData(section, opnameId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageData = data as any;

  if (!data) {
    return (
      <Card>
        <p className="text-sm text-[#7a573e]">Modul stock opname tidak ditemukan.</p>
      </Card>
    );
  }

  if (section === "create" && "draftOpnames" in data) {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[430px_1fr]">
        <Card>
          <CardTitle>Persiapan & Checklist Opname</CardTitle>
          <CardDescription className="mt-3">
            Rapikan stok, pisahkan waste, dan buat dokumen checklist sebelum proses hitung fisik dimulai.
          </CardDescription>
          <div className="mt-4 rounded-[20px] border border-[#ecd0ab] bg-[#fff6e9] p-4 text-sm text-[#6e503c]">
            Fokus checklist: bahan kering, bahan fresh, produk jadi donat, kemasan, dan perlengkapan non-makanan.
          </div>
          <form action={createOpnameAction} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <Label htmlFor="documentNumber">Nomor Dokumen</Label>
                <Input id="documentNumber" name="documentNumber" placeholder="Auto" />
              </Field>
              <Field>
                <Label htmlFor="opnameDate">Tanggal Opname</Label>
                <Input id="opnameDate" name="opnameDate" type="date" data-tour="tour-opname-date" required />
              </Field>
            </div>
            <input type="hidden" name="locationId" value={pageData.defaultLocation.id} />
            <Field>
              <Label htmlFor="notes">Catatan</Label>
              <Input id="notes" name="notes" placeholder="Contoh: pisahkan donat waste sebelum hitung" />
            </Field>
            <Button type="submit" className="w-full" data-tour="tour-opname-create-submit">
              Buat Dokumen Checklist
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Dokumen Persiapan Aktif</CardTitle>
          <CardDescription className="mt-3">
            Gunakan dokumen ini sebagai dasar saat proses hitung fisik dan rekonsiliasi.
          </CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>No. Dokumen</Th>
                  <Th>Tanggal</Th>
                  <Th>Item</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {(pageData.draftOpnames ?? []).length === 0 ? (
                  <tr>
                    <Td colSpan={4} className="text-center text-[#7a573e]">
                      Belum ada dokumen draft.
                    </Td>
                  </tr>
                ) : (
                  (pageData.draftOpnames ?? []).map((opname) => (
                    <tr key={opname.id}>
                      <Td>{opname.documentNumber}</Td>
                      <Td>{formatDate(opname.opnameDate)}</Td>
                      <Td>{opname.items.length}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/stock-opname/process?id=${opname.id}`}
                            className="inline-flex rounded-xl border border-[#e8cb9e] bg-[#fff4e2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9d6a15] transition hover:bg-[#ffeed4]"
                          >
                            Proses
                          </Link>
                          <DraftOpnameRowActions
                            opname={{
                              id: opname.id,
                              documentNumber: opname.documentNumber,
                              opnameDate: opname.opnameDate.toISOString(),
                              notes: opname.notes,
                            }}
                          />
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableWrapper>
        </Card>
      </div>
    );
  }

  if (section === "process" && "draftOpnames" in data) {
    const selected = pageData.selectedOpname;
    const totalDifferenceQty = selected
      ? selected.items.reduce((acc, row) => acc + Math.abs(Number(row.difference)), 0)
      : 0;
    const totalDifferenceValue = selected
      ? selected.items.reduce((acc, row) => acc + Math.abs(Number(row.difference)) * Number(row.item.standardCost), 0)
      : 0;

    return (
      <div className="space-y-6">
        <Card>
          <CardTitle>Pilih Dokumen untuk Penghitungan</CardTitle>
          <CardDescription className="mt-3">
            Lakukan penghitungan saat toko tutup/sebelum buka, lalu cocokkan fisik dengan sistem.
          </CardDescription>
          <div className="mt-3 rounded-[20px] border border-[#ecd0ab] bg-[#fff6e9] p-4 text-sm text-[#6e503c]">
            Setelah hitung, terapkan prinsip FIFO/FEFO: bahan lama dipakai lebih dulu untuk mengurangi risiko waste.
          </div>
          <form className="mt-3 flex flex-col gap-3 md:flex-row md:items-end" method="get">
            <Field className="flex-1">
              <Label htmlFor="id">Dokumen Opname</Label>
              <Select id="id" name="id" defaultValue={selected?.id ?? ""}>
                <option value="">Pilih dokumen draft</option>
                {(pageData.draftOpnames ?? []).map((opname) => (
                  <option key={opname.id} value={opname.id}>
                    {opname.documentNumber}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" data-tour="tour-opname-process-select-doc">
              Tampilkan
            </Button>
          </form>
        </Card>

        {!selected ? (
          <Card>
            <p className="text-sm text-[#7a573e]">Pilih dokumen terlebih dahulu untuk proses hitung dan rekonsiliasi.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[430px_1fr]">
            <Card>
              <CardTitle>Input Hasil Hitung Fisik</CardTitle>
              <CardDescription className="mt-3">
                Catat hasil hitung donat/bahan baku. Jika ada selisih, beri catatan untuk proses adjustment.
              </CardDescription>
              <div className="mt-4 rounded-[20px] border border-[#ecd0ab] bg-[#fff6e9] p-4 text-sm text-[#4b2f1f]">
                <p className="font-semibold text-[#4b2f1f]">{selected.documentNumber}</p>
                <p className="mt-1 text-[#765844]">{pageData.defaultLocation.name}</p>
              </div>

              <form action={upsertOpnameItemAction} className="mt-4 space-y-3">
                <input type="hidden" name="opnameId" value={selected.id} />
                <Field>
                  <Label htmlFor="itemId">Bahan Baku</Label>
                  <Select id="itemId" name="itemId" data-tour="tour-opname-item" required>
                    <option value="">Pilih bahan baku</option>
                    {(pageData.items ?? []).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="physicalStock">Stok Saat Ini</Label>
                  <Input
                    id="physicalStock"
                    name="physicalStock"
                    type="number"
                    step="0.001"
                    data-tour="tour-opname-physical-stock"
                    required
                  />
                </Field>
                <Field>
                  <Label htmlFor="note">Catatan Selisih</Label>
                  <Input id="note" name="note" placeholder="Contoh: waste, rusak, salah timbang, atau kedaluwarsa" />
                </Field>
                <Button type="submit" className="w-full" data-tour="tour-opname-save-item">
                  Simpan Hasil Hitung
                </Button>
              </form>

              <form action={submitOpnameAction} className="mt-3">
                <input type="hidden" name="opnameId" value={selected.id} />
                <Button type="submit" className="w-full" data-tour="tour-opname-submit-reconcile">
                  Submit Rekonsiliasi & Adjustment
                </Button>
              </form>
            </Card>

            <Card>
              <CardTitle>Detail Rekonsiliasi Stok</CardTitle>
              <CardDescription className="mt-3">
                Tabel fokus untuk melihat perbandingan stok saat ini dan stok sistem (terakhir) per bahan baku.
              </CardDescription>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-[#ecd0ab] bg-[#fff4e3] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d6949]">Total Selisih Qty</p>
                  <p className="mt-1 text-base font-semibold text-[#4b2f1f]">{formatNumber(totalDifferenceQty)}</p>
                </div>
                <div className="rounded-xl border border-[#ecd0ab] bg-[#fff4e3] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d6949]">Total Selisih Nilai</p>
                  <p className="mt-1 text-base font-semibold text-[#4b2f1f]">
                    {currencyFormatter.format(totalDifferenceValue)}
                  </p>
                </div>
              </div>
              <TableWrapper className="mt-4">
                <Table>
                  <thead>
                    <tr>
                      <Th>Bahan Baku</Th>
                      <Th>Stok Saat Ini</Th>
                      <Th>Stok Sistem (Terakhir)</Th>
                      <Th>Selisih Qty</Th>
                      <Th>Selisih Nilai</Th>
                      <Th>Aksi</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.length === 0 ? (
                      <tr>
                        <Td colSpan={6} className="text-center text-[#7a573e]">
                          Belum ada item dihitung.
                        </Td>
                      </tr>
                    ) : (
                      selected.items.map((item) => {
                        const differenceQty = Number(item.difference);
                        const differenceValue = Math.abs(differenceQty) * Number(item.item.standardCost);

                        return (
                          <tr key={item.id}>
                            <Td>{item.item.name}</Td>
                            <Td>{formatNumber(item.physicalStock)}</Td>
                            <Td>{formatNumber(item.systemStock)}</Td>
                            <Td>
                              <Badge
                                variant={
                                  differenceQty === 0
                                    ? "success"
                                    : differenceQty > 0
                                      ? "warning"
                                      : "danger"
                                }
                              >
                                {formatNumber(differenceQty)}
                              </Badge>
                            </Td>
                            <Td>{currencyFormatter.format(differenceValue)}</Td>
                            <Td>
                              <OpnameItemRowActions
                                row={{
                                  id: item.id,
                                  opnameId: selected.id,
                                  itemName: item.item.name,
                                  physicalStock: Number(item.physicalStock),
                                  note: item.note,
                                }}
                              />
                            </Td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </TableWrapper>
            </Card>
          </div>
        )}
      </div>
    );
  }

  if (section === "history" && "opnames" in data) {
    const opnames = pageData.opnames ?? [];
    const monthSummary = new Map<
      string,
      { monthLabel: string; totalDocs: number; totalDifferenceQty: number; totalDifferenceValue: number }
    >();

    for (const opname of opnames) {
      const monthKey = new Date(opname.opnameDate).toISOString().slice(0, 7);
      const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
        new Date(opname.opnameDate),
      );
      const totalDifferenceQty = opname.items.reduce((acc, row) => acc + Math.abs(Number(row.difference)), 0);
      const totalDifferenceValue = opname.items.reduce(
        (acc, row) => acc + Math.abs(Number(row.difference)) * Number(row.item.standardCost),
        0,
      );

      const current = monthSummary.get(monthKey) ?? {
        monthLabel,
        totalDocs: 0,
        totalDifferenceQty: 0,
        totalDifferenceValue: 0,
      };

      current.totalDocs += 1;
      current.totalDifferenceQty += totalDifferenceQty;
      current.totalDifferenceValue += totalDifferenceValue;
      monthSummary.set(monthKey, current);
    }

    const monthlyRows = Array.from(monthSummary.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([, value]) => value);

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const currentMonthSummary = monthSummary.get(currentMonthKey);

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardTitle>Dokumen Bulan Ini</CardTitle>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#3f2417]">
              {currentMonthSummary?.totalDocs ?? 0}
            </p>
          </Card>
          <Card>
            <CardTitle>Selisih Qty Bulan Ini</CardTitle>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#3f2417]">
              {formatNumber(currentMonthSummary?.totalDifferenceQty ?? 0)}
            </p>
          </Card>
          <Card>
            <CardTitle>Selisih Nilai Bulan Ini</CardTitle>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#3f2417]">
              {currencyFormatter.format(currentMonthSummary?.totalDifferenceValue ?? 0)}
            </p>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Rekap Bulanan Stock Opname</CardTitle>
              <CardDescription className="mt-3">
                Rekap per bulan untuk melihat selisih stok tercatat vs stok fisik beserta nilai rupiahnya.
              </CardDescription>
            </div>
            <a
              href="/api/stock-opname/history/export"
              data-tour="tour-opname-export"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#c98834] bg-[linear-gradient(135deg,#f0b04d_0%,#e596be_100%)] px-4 text-sm font-semibold text-[#3a2217] shadow-[0_18px_32px_-20px_rgba(149,88,32,0.65)] transition hover:brightness-[1.04] sm:w-auto"
            >
              Export Excel
            </a>
          </div>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Periode</Th>
                  <Th>Jumlah Dokumen</Th>
                  <Th>Total Selisih Qty</Th>
                  <Th>Total Selisih Nilai</Th>
                </tr>
              </thead>
              <tbody>
                {monthlyRows.length === 0 ? (
                  <tr>
                    <Td colSpan={4} className="text-center text-[#7a573e]">
                      Belum ada rekap bulanan.
                    </Td>
                  </tr>
                ) : (
                  monthlyRows.map((row) => (
                    <tr key={row.monthLabel}>
                      <Td>{row.monthLabel}</Td>
                      <Td>{row.totalDocs}</Td>
                      <Td>{formatNumber(row.totalDifferenceQty)}</Td>
                      <Td>{currencyFormatter.format(row.totalDifferenceValue)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableWrapper>
        </Card>

        <Card>
          <CardTitle>Detail Dokumen Opname</CardTitle>
          <CardDescription className="mt-3">
            Detail per dokumen untuk audit petugas, status, dan total selisih kuantitas/nilai.
          </CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>No. Dokumen</Th>
                  <Th>Tanggal</Th>
                  <Th>Petugas</Th>
                  <Th>Status</Th>
                  <Th>Item</Th>
                  <Th>Total Selisih Qty</Th>
                  <Th>Total Selisih Nilai</Th>
                </tr>
              </thead>
              <tbody>
                {opnames.length === 0 ? (
                  <tr>
                    <Td colSpan={7} className="text-center text-[#7a573e]">
                      Belum ada riwayat opname.
                    </Td>
                  </tr>
                ) : (
                  opnames.map((opname) => {
                    const totalDiffQty = opname.items.reduce((acc, row) => acc + Math.abs(Number(row.difference)), 0);
                    const totalDiffValue = opname.items.reduce(
                      (acc, row) => acc + Math.abs(Number(row.difference)) * Number(row.item.standardCost),
                      0,
                    );

                    return (
                      <tr key={opname.id}>
                        <Td>{opname.documentNumber}</Td>
                        <Td>{formatDate(opname.opnameDate)}</Td>
                        <Td>{opname.officer.name}</Td>
                        <Td>
                          <Badge
                            variant={opname.status === "APPROVED" ? "success" : "warning"}
                          >
                            {opnameStatusLabel[opname.status]}
                          </Badge>
                        </Td>
                        <Td>{opname.items.length}</Td>
                        <Td>{formatNumber(totalDiffQty)}</Td>
                        <Td>{currencyFormatter.format(totalDiffValue)}</Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </TableWrapper>
        </Card>
      </div>
    );
  }

  return null;
}
