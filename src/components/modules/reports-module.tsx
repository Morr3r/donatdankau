import { movementCategoryLabel } from "@/lib/constants";
import {
  getCurrentStockReport,
  getInboundReport,
  getOpnameReport,
  getOutboundReport,
  getStockCardReport,
  getUserActivityReport,
  getWasteVarianceReport,
} from "@/lib/queries/reports";
import { currencyFormatter, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle, CardValue } from "@/components/ui/card";
import { Field, Label } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";

export async function ReportsModule({
  section,
  searchParams,
}: {
  section: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (section === "current-stock") {
    const report = await getCurrentStockReport();

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardTitle>Total Stok Bahan Baku</CardTitle>
            <CardValue className="mt-2">{formatNumber(report.totals.rawQty)}</CardValue>
          </Card>
          <Card>
            <CardTitle>Mode Operasional</CardTitle>
            <CardValue className="mt-2">{Math.max(report.totals.locationCount, 1)}</CardValue>
            <CardDescription className="mt-2">Lokasi aktif dalam sistem stock opname.</CardDescription>
          </Card>
          <Card>
            <CardTitle>Jumlah Item-Lokasi</CardTitle>
            <CardValue className="mt-2">{report.totals.itemCount}</CardValue>
          </Card>
          <Card>
            <CardTitle>Estimasi Nilai Stok</CardTitle>
            <CardValue className="mt-2">{currencyFormatter.format(report.totals.estimatedValue)}</CardValue>
          </Card>
        </div>

        <Card>
          <CardTitle>Laporan Stok Saat Ini</CardTitle>
          <CardDescription className="mt-3">Snapshot stok bahan baku terbaru untuk operasional toko saat ini.</CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Kode Item</Th>
                  <Th>Item</Th>
                  <Th>Satuan</Th>
                  <Th>Qty</Th>
                  <Th>Last Update</Th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 ? (
                  <tr>
                    <Td colSpan={5} className="text-center text-[#7a573e]">
                      Data stok belum tersedia.
                    </Td>
                  </tr>
                ) : (
                  report.rows.map((row) => (
                    <tr key={row.id}>
                      <Td>{row.item.code}</Td>
                      <Td>{row.item.name}</Td>
                      <Td>{row.item.unit.name}</Td>
                      <Td>{formatNumber(row.quantity)}</Td>
                      <Td>{formatDateTime(row.updatedAt)}</Td>
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

  if (section === "stock-card") {
    const itemId = searchParams?.itemId;
    const report = await getStockCardReport(itemId);

    return (
      <Card>
        <CardTitle>Laporan Kartu Stok</CardTitle>
        <CardDescription className="mt-3">
          Telusuri mutasi tiap bahan baku dari waktu ke waktu untuk melihat alur stok dan saldo akhirnya.
        </CardDescription>

        <form method="get" className="mt-4 max-w-sm">
          <Field>
            <Label htmlFor="itemId">Filter Item</Label>
            <Select id="itemId" name="itemId" defaultValue={itemId ?? ""}>
              <option value="">Semua item</option>
              {report.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </form>

        <TableWrapper className="mt-4">
          <Table>
            <thead>
              <tr>
                <Th>Tanggal</Th>
                <Th>No. Transaksi</Th>
                <Th>Item</Th>
                <Th>Referensi Asal</Th>
                <Th>Referensi Tujuan</Th>
                <Th>Masuk</Th>
                <Th>Keluar</Th>
                <Th>Saldo Akhir</Th>
                <Th>User</Th>
              </tr>
            </thead>
            <tbody>
              {report.rows.length === 0 ? (
                <tr>
                  <Td colSpan={9} className="text-center text-[#7a573e]">
                    Data mutasi belum tersedia.
                  </Td>
                </tr>
              ) : (
                report.rows.map((row) => (
                  <tr key={row.id}>
                    <Td>{formatDateTime(row.movementDate)}</Td>
                    <Td>{row.transactionNumber}</Td>
                    <Td>{row.item.name}</Td>
                    <Td>{row.sourceLocation?.name ?? "-"}</Td>
                    <Td>{row.destinationLocation?.name ?? "-"}</Td>
                    <Td>{row.masuk ? formatNumber(row.masuk) : "-"}</Td>
                    <Td>{row.keluar ? formatNumber(row.keluar) : "-"}</Td>
                    <Td>{formatNumber(row.saldoAkhir)}</Td>
                    <Td>{row.inputBy.name}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </Card>
    );
  }

  if (section === "opname") {
    const report = await getOpnameReport();

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardTitle>Total Dokumen Opname</CardTitle>
            <CardValue className="mt-2">{report.summary.totalDocuments}</CardValue>
          </Card>
          <Card>
            <CardTitle>Total Selisih</CardTitle>
            <CardValue className="mt-2">{formatNumber(report.summary.totalDifference)}</CardValue>
          </Card>
          <Card>
            <CardTitle>Ringkasan Selisih Terbesar</CardTitle>
            <CardValue className="mt-2 text-lg">
              {report.summary.topDiffLocation
                ? `Toko Utama (${formatNumber(report.summary.topDiffLocation.totalDiff)})`
                : "-"}
            </CardValue>
          </Card>
        </div>

        <Card>
          <CardTitle>Laporan Stock Opname Periode</CardTitle>
          <CardDescription className="mt-3">Analisis dokumen opname berdasarkan petugas, status, dan total selisih.</CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Dokumen</Th>
                  <Th>Tanggal</Th>
                  <Th>Petugas</Th>
                  <Th>Approver</Th>
                  <Th>Status</Th>
                  <Th>Item</Th>
                  <Th>Total Selisih</Th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 ? (
                  <tr>
                    <Td colSpan={7} className="text-center text-[#7a573e]">
                      Data opname belum tersedia.
                    </Td>
                  </tr>
                ) : (
                  report.rows.map((row) => (
                    <tr key={row.id}>
                      <Td>{row.documentNumber}</Td>
                      <Td>{formatDate(row.opnameDate)}</Td>
                      <Td>{row.officer.name}</Td>
                      <Td>{row.approvedBy?.name ?? "-"}</Td>
                      <Td>{row.status}</Td>
                      <Td>{row.items.length}</Td>
                      <Td>
                        {formatNumber(row.items.reduce((acc, item) => acc + Math.abs(Number(item.difference)), 0))}
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

  if (section === "inbound") {
    const report = await getInboundReport();

    return (
      <div className="space-y-5">
        <Card>
          <CardTitle>Ringkasan Pembelian / Barang Masuk per Supplier (30 Hari)</CardTitle>
          <CardDescription className="mt-3">
            Supplier dengan volume pasokan tertinggi dalam 30 hari terakhir ditampilkan lebih dulu.
          </CardDescription>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            {report.supplierSummary.length === 0 ? (
              <p className="text-sm text-[#7a573e]">Belum ada data supplier.</p>
            ) : (
              report.supplierSummary.slice(0, 8).map((supplier) => (
                <div key={supplier.name} className="rounded-xl border border-[#d8b88b] bg-[#f9ead3] px-3 py-2">
                  <p className="text-xs text-[#7a573e]">{supplier.name}</p>
                  <p className="text-sm font-semibold text-[#4b2f1f]">{formatNumber(supplier.qty)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Laporan Barang Masuk</CardTitle>
          <CardDescription className="mt-3">Detail transaksi penerimaan bahan baku lengkap dengan supplier dan admin input.</CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>No. Transaksi</Th>
                  <Th>Item</Th>
                  <Th>Supplier</Th>
                  <Th>Qty</Th>
                  <Th>User</Th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 ? (
                  <tr>
                    <Td colSpan={6} className="text-center text-[#7a573e]">
                      Belum ada transaksi barang masuk.
                    </Td>
                  </tr>
                ) : (
                  report.rows.map((row) => (
                    <tr key={row.id}>
                      <Td>{formatDateTime(row.movementDate)}</Td>
                      <Td>{row.transactionNumber}</Td>
                      <Td>{row.item.name}</Td>
                      <Td>{row.sourceSupplier?.name ?? "-"}</Td>
                      <Td>{formatNumber(row.quantity)}</Td>
                      <Td>{row.inputBy.name}</Td>
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

  if (section === "outbound") {
    const report = await getOutboundReport();

    return (
      <Card>
        <CardTitle>Laporan Barang Keluar</CardTitle>
        <CardDescription className="mt-3">Seluruh pengeluaran bahan baku untuk produksi, waste, dan penyesuaian stok.</CardDescription>
        <TableWrapper className="mt-4">
          <Table>
            <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>No. Transaksi</Th>
                  <Th>Item</Th>
                  <Th>Tujuan</Th>
                  <Th>Kategori</Th>
                  <Th>Qty</Th>
                  <Th>User</Th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 ? (
                  <tr>
                    <Td colSpan={7} className="text-center text-[#7a573e]">
                      Belum ada transaksi barang keluar.
                    </Td>
                  </tr>
                ) : (
                report.rows.map((row) => (
                  <tr key={row.id}>
                      <Td>{formatDateTime(row.movementDate)}</Td>
                      <Td>{row.transactionNumber}</Td>
                      <Td>{row.item.name}</Td>
                      <Td>{row.destinationLocation?.name ?? "-"}</Td>
                      <Td>{movementCategoryLabel[row.category]}</Td>
                      <Td>{formatNumber(row.quantity)}</Td>
                    <Td>{row.inputBy.name}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </Card>
    );
  }

  if (section === "waste-variance") {
    const report = await getWasteVarianceReport();

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardTitle>Total Expired</CardTitle>
            <CardValue className="mt-2">{formatNumber(report.summary.totalExpired)}</CardValue>
          </Card>
          <Card>
            <CardTitle>Total Rusak</CardTitle>
            <CardValue className="mt-2">{formatNumber(report.summary.totalDamaged)}</CardValue>
          </Card>
          <Card>
            <CardTitle>Total Selisih Opname</CardTitle>
            <CardValue className="mt-2">{formatNumber(report.summary.totalVariance)}</CardValue>
          </Card>
        </div>

        <Card>
          <CardTitle>Item Paling Sering Selisih / Waste</CardTitle>
          <CardDescription className="mt-3">Daftar item yang paling sering memerlukan perhatian karena waste atau selisih opname.</CardDescription>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            {report.summary.frequentVarianceItems.length === 0 ? (
              <p className="text-sm text-[#7a573e]">Belum ada data.</p>
            ) : (
              report.summary.frequentVarianceItems.map((item) => (
                <div key={item.item} className="rounded-xl border border-[#d8b88b] bg-[#f9ead3] px-3 py-2">
                  <p className="text-xs text-[#7a573e]">{item.item}</p>
                  <p className="text-sm font-semibold text-[#4b2f1f]">{formatNumber(item.total)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Detail Laporan Selisih dan Waste</CardTitle>
          <CardDescription className="mt-3">Telusuri sumber waste dan selisih untuk pengendalian operasional yang lebih presisi.</CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>Item</Th>
                  <Th>Kategori</Th>
                  <Th>Qty</Th>
                  <Th>User</Th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 ? (
                  <tr>
                    <Td colSpan={5} className="text-center text-[#7a573e]">
                      Belum ada transaksi waste/selisih.
                    </Td>
                  </tr>
                ) : (
                  report.rows.map((row) => (
                    <tr key={row.id}>
                      <Td>{formatDateTime(row.movementDate)}</Td>
                      <Td>{row.item.name}</Td>
                      <Td>
                        <Badge variant={row.category === "EXPIRED" || row.category === "DAMAGED" ? "danger" : "warning"}>
                          {movementCategoryLabel[row.category]}
                        </Badge>
                      </Td>
                      <Td>{formatNumber(row.quantity)}</Td>
                      <Td>{row.inputBy.name}</Td>
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

  if (section === "user-activity") {
    const report = await getUserActivityReport();

    return (
      <div className="space-y-5">
        <Card>
          <CardTitle>Ringkasan Aktivitas User</CardTitle>
          <CardDescription className="mt-3">Aktivitas admin yang paling aktif tampil di bagian atas untuk monitoring cepat.</CardDescription>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            {report.summary.length === 0 ? (
              <p className="text-sm text-[#7a573e]">Belum ada aktivitas.</p>
            ) : (
              report.summary.slice(0, 8).map((item) => (
                <div key={item.name} className="rounded-xl border border-[#d8b88b] bg-[#f9ead3] px-3 py-2">
                  <p className="text-xs text-[#7a573e]">{item.name}</p>
                  <p className="text-sm font-semibold text-[#4b2f1f]">{item.total} aktivitas</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Laporan Aktivitas User</CardTitle>
          <CardDescription className="mt-3">Audit log seluruh aksi yang dilakukan admin di sistem.</CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Waktu</Th>
                  <Th>User</Th>
                  <Th>Modul</Th>
                  <Th>Aksi</Th>
                  <Th>Entity</Th>
                  <Th>Detail</Th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 ? (
                  <tr>
                    <Td colSpan={6} className="text-center text-[#7a573e]">
                      Belum ada log aktivitas.
                    </Td>
                  </tr>
                ) : (
                  report.rows.map((row) => (
                    <tr key={row.id}>
                      <Td>{formatDateTime(row.createdAt)}</Td>
                      <Td>{row.user?.name ?? "System"}</Td>
                      <Td>{row.module}</Td>
                      <Td>{row.action}</Td>
                      <Td>{row.entity ?? "-"}</Td>
                      <Td>{row.details ?? "-"}</Td>
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

  return (
    <Card>
      <p className="text-sm text-[#7a573e]">Halaman laporan tidak ditemukan.</p>
    </Card>
  );
}

