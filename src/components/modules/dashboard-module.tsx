import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  PackageSearch,
} from "lucide-react";

import { DashboardDateRangePicker } from "@/components/modules/dashboard-date-range-picker";
import { StockFlowChart } from "@/components/charts/stock-flow-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle, CardValue } from "@/components/ui/card";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/format";
import { getDashboardData } from "@/lib/queries/dashboard";

const summaryCards: Array<{
  key: string;
  title: string;
  icon: React.ReactNode;
  note: string;
  shellClass: string;
  value: (data: Awaited<ReturnType<typeof getDashboardData>>) => string;
}> = [
  {
    key: "raw",
    title: "Total Stok Bahan Baku",
    icon: <PackageSearch size={16} />,
    note: "Stok aktif seluruh bahan utama donat.",
    shellClass: "from-[#fff6e8] to-[#ffe9f1]",
    value: (data) => `${formatNumber(data.totals.rawStock)}`,
  },
  {
    key: "incoming",
    title: "Masuk Hari Ini",
    icon: <ArrowUpCircle size={16} />,
    note: "Penambahan bahan baku hari ini.",
    shellClass: "from-[#fff8e3] to-[#ffe9cc]",
    value: (data) => `${formatNumber(data.totals.incomingToday)}`,
  },
  {
    key: "outgoing",
    title: "Keluar Hari Ini",
    icon: <ArrowDownCircle size={16} />,
    note: "Pemakaian bahan baku hari ini.",
    shellClass: "from-[#fff2e7] to-[#ffe4d7]",
    value: (data) => `${formatNumber(data.totals.outgoingToday)}`,
  },
  {
    key: "pending",
    title: "Draft Opname",
    icon: <ClipboardList size={16} />,
    note: "Dokumen opname yang belum selesai.",
    shellClass: "from-[#fff1ea] to-[#ffe7ee]",
    value: (data) => `${data.totals.pendingOpnames}`,
  },
];

const opnameRhythm = [
  {
    period: "Harian",
    note: "Cek stok fisik bahan fresh dan donat display.",
  },
  {
    period: "Bulanan",
    note: "Rekap bahan kering, kemasan, dan perlengkapan toko.",
  },
  {
    period: "Tindak Lanjut",
    note: "Lakukan rekonsiliasi jika ada selisih stok.",
  },
];

type DashboardModuleSearchParams = {
  startDate?: string;
  endDate?: string;
};

function toHumanDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export async function DashboardModule({ searchParams }: { searchParams?: DashboardModuleSearchParams }) {
  const data = await getDashboardData(searchParams);
  const chartIncomingTotal = data.movementChart.reduce((total, row) => total + row.incoming, 0);
  const chartOutgoingTotal = data.movementChart.reduce((total, row) => total + row.outgoing, 0);
  const movementPeriodLabel = `${data.movementRange.days} hari`;
  const movementRangeLabel = `${toHumanDate(data.movementRange.startDate)} - ${toHumanDate(data.movementRange.endDate)}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.key} className={`bg-[linear-gradient(145deg,var(--tw-gradient-stops))] ${card.shellClass}`}>
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="max-w-[85%]">
                <CardTitle>{card.title}</CardTitle>
                <CardValue className="mt-4">{card.value(data)}</CardValue>
                <CardDescription className="mt-3 text-[13px] leading-6">{card.note}</CardDescription>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#ebcfa6] bg-[#fff4e3] text-[#b57515] shadow-[0_14px_26px_-20px_rgba(90,53,35,0.36)]">
                {card.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.8fr_1fr]">
        <Card>
          <div className="relative z-10 flex flex-col gap-4 lg:gap-5">
            <div>
              <CardTitle>Pergerakan Bahan Baku</CardTitle>
              <CardDescription className="mt-3 max-w-2xl">
                Lihat ritme bahan masuk dan bahan terpakai untuk periode {movementPeriodLabel}. Rentang aktif:{" "}
                {movementRangeLabel}.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <DashboardDateRangePicker
                startDate={data.movementRange.startDate}
                endDate={data.movementRange.endDate}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#ecd0ab] bg-[#fff4e3] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d6949]">Total Masuk</p>
                  <p className="mt-2 text-lg font-semibold text-[#4b2f1f]">{formatNumber(chartIncomingTotal)}</p>
                </div>
                <div className="rounded-xl border border-[#ecd0ab] bg-[#fff4e3] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d6949]">Total Keluar</p>
                  <p className="mt-2 text-lg font-semibold text-[#4b2f1f]">{formatNumber(chartOutgoingTotal)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-5">
            <StockFlowChart data={data.movementChart} />
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="relative z-10">
            <CardTitle>Ritme Stock Opname Donat Dankau</CardTitle>
            <CardDescription className="mt-3">
              Jalankan tiga periode opname agar pencatatan tetap ringan tapi konsisten untuk UMKM satu toko.
            </CardDescription>
          </div>

          <div className="space-y-2">
            {opnameRhythm.map((item) => (
              <div key={item.period} className="rounded-xl border border-[#ecd0ab] bg-[#fff4e3] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a6d14]">{item.period}</p>
                <p className="mt-1 text-sm text-[#5c3a2a]">{item.note}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[20px] border border-[#ecd0ab] bg-[#fff6e9] p-4 text-sm text-[#4b2f1f]">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-[#4b2f1f]">Opname terakhir</p>
            </div>
            {data.latestOpname ? (
              <>
                <p className="mt-3 text-[#6e503c]">{data.latestOpname.documentNumber}</p>
                <p className="text-[#6e503c]">{formatDate(data.latestOpname.opnameDate)}</p>
              </>
            ) : (
              <p className="mt-3 text-[#6e503c]">Belum ada data opname.</p>
            )}
          </div>

          <div className="rounded-[20px] border border-[#ecd0ab] bg-[#fff6e9] p-4 text-sm text-[#4b2f1f]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-[#d4981f]" />
              <p className="font-semibold text-[#4b2f1f]">Selisih terbesar terakhir</p>
            </div>
            {data.biggestVariance ? (
              <>
                <p className="mt-3 text-[#6e503c]">{data.biggestVariance.item.name}</p>
                <p className="text-[#6e503c]">Selisih {formatNumber(Math.abs(Number(data.biggestVariance.difference)))}</p>
              </>
            ) : (
              <p className="mt-3 text-[#6e503c]">Belum ada data selisih.</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Alert Bahan Baku</CardTitle>
            <CardDescription className="mt-3">
              Fokus pada bahan yang stoknya menipis atau mendekati masa kedaluwarsa.
            </CardDescription>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-[#ecd0ab] bg-[#fff4e3] px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8d6949]">Minimum</p>
              <Badge variant={data.totals.lowStockItems > 0 ? "warning" : "success"} className="mt-2">
                {data.totals.lowStockItems}
              </Badge>
            </div>
            <div className="rounded-xl border border-[#ecd0ab] bg-[#fff4e3] px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8d6949]">Near Exp</p>
              <Badge variant={data.totals.expiringItems > 0 ? "warning" : "success"} className="mt-2">
                {data.totals.expiringItems}
              </Badge>
            </div>
            <div className="rounded-xl border border-[#ecd0ab] bg-[#fff4e3] px-3 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8d6949]">Expired</p>
              <Badge variant={data.totals.expiredItems > 0 ? "danger" : "success"} className="mt-2">
                {data.totals.expiredItems}
              </Badge>
            </div>
          </div>
        </div>

        <TableWrapper className="mt-4">
          <Table>
            <thead>
              <tr>
                <Th>Bahan Baku</Th>
                <Th>Satuan</Th>
                <Th>Stok Saat Ini</Th>
                <Th>Batas Minimum</Th>
              </tr>
            </thead>
            <tbody>
              {data.lowStockItems.length === 0 ? (
                <tr>
                  <Td colSpan={4} className="text-center text-[#7a573e]">
                    Tidak ada bahan baku yang menyentuh stok minimum.
                  </Td>
                </tr>
              ) : (
                data.lowStockItems.map((row) => (
                  <tr key={row.id}>
                    <Td>{row.item.name}</Td>
                    <Td>{row.item.unit.name}</Td>
                    <Td>{formatNumber(row.quantity)}</Td>
                    <Td>{formatNumber(row.item.minStock)}</Td>
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
