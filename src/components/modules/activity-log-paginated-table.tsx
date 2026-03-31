"use client";

import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@heroui/react";

import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";

type ActivityLogRow = {
  id: string;
  createdAt: string;
  module: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: string | null;
  user: {
    id: string;
    name: string;
    username: string | null;
  } | null;
};

type PageToken = number | "...";

function normalizeModuleName(moduleName: string) {
  return moduleName
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getActionVariant(action: string): "success" | "warning" | "danger" | "neutral" {
  if (action === "CREATE") return "success";
  if (action === "UPDATE") return "warning";
  if (action === "DELETE") return "danger";
  return "neutral";
}

function getActionLabel(action: string) {
  if (action === "CREATE") return "Tambah";
  if (action === "UPDATE") return "Ubah";
  if (action === "DELETE") return "Hapus";
  return action;
}

function buildPageTokens(totalPages: number, currentPage: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

function buildCompactPageTokens(totalPages: number, currentPage: number): PageToken[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage, "...", totalPages];
}

export function ActivityLogPaginatedTable({ rows }: { rows: ActivityLogRow[] }) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncScreen = () => {
      setIsMobile(mediaQuery.matches);
    };

    syncScreen();
    mediaQuery.addEventListener("change", syncScreen);
    return () => {
      mediaQuery.removeEventListener("change", syncScreen);
    };
  }, []);

  const pageSize = isMobile ? 5 : 10;
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const activePage = Math.min(Math.max(currentPage, 1), totalPages);

  const visibleRows = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [activePage, pageSize, rows]);

  const fromItem = totalItems === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const toItem = totalItems === 0 ? 0 : Math.min(activePage * pageSize, totalItems);
  const pageTokens = isMobile ? buildCompactPageTokens(totalPages, activePage) : buildPageTokens(totalPages, activePage);

  return (
    <div className="space-y-3">
      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th>Waktu</Th>
              <Th>User</Th>
              <Th>Modul</Th>
              <Th>Aksi</Th>
              <Th>Data</Th>
              <Th>Detail</Th>
            </tr>
          </thead>
          <tbody>
            {totalItems === 0 ? (
              <tr>
                <Td colSpan={6} className="text-center text-[#7a573e]">
                  Tidak ada aktivitas yang cocok dengan filter.
                </Td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.id}>
                  <Td>{formatDateTime(row.createdAt)}</Td>
                  <Td>{row.user?.name ?? "System"}</Td>
                  <Td>{normalizeModuleName(row.module)}</Td>
                  <Td>
                    <Badge variant={getActionVariant(row.action)}>{getActionLabel(row.action)}</Badge>
                  </Td>
                  <Td>
                    <p className="font-medium text-[#4d311f]">{row.entity ?? "-"}</p>
                    <p className="mt-1 text-[11px] text-[#8a6547]">{row.entityId ?? "-"}</p>
                  </Td>
                  <Td>{row.details ?? "-"}</Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {totalItems > 0 ? (
        <div className="rounded-2xl border border-[#ecd2ad] bg-[#fffaf2] px-3 py-3 shadow-[0_16px_34px_-30px_rgba(71,43,28,0.45)] sm:px-4">
          <Pagination className="w-full">
            <Pagination.Summary className="text-center text-sm font-medium text-[#5f3f2c] sm:text-left">
              Menampilkan <span className="font-semibold text-[#472b1c]">{fromItem}</span>-
              <span className="font-semibold text-[#472b1c]">{toItem}</span> dari{" "}
              <span className="font-semibold text-[#472b1c]">{totalItems}</span> aktivitas
              <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8d6646]">
                ({isMobile ? "5/item" : "10/item"})
              </span>
            </Pagination.Summary>

            <Pagination.Content className="mt-3 flex w-full flex-nowrap items-center justify-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-end">
              <Pagination.Item className="shrink-0">
                <Pagination.Previous
                  isDisabled={activePage === 1}
                  onPress={() => setCurrentPage(Math.max(1, activePage - 1))}
                  className={`inline-flex h-9 items-center justify-center rounded-lg border border-[#deba8a] bg-[#fff4e2] text-xs font-semibold text-[#734d33] transition hover:bg-[#ffecd0] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 ${
                    isMobile ? "w-9 min-w-9 px-0" : "gap-1 px-3 uppercase tracking-[0.12em]"
                  }`}
                  aria-label="Halaman sebelumnya"
                >
                  <Pagination.PreviousIcon />
                  {!isMobile ? <span>Sebelumnya</span> : null}
                </Pagination.Previous>
              </Pagination.Item>

              {pageTokens.map((token, index) =>
                token === "..." ? (
                  <Pagination.Item key={`dots-${index}`} className="shrink-0">
                    <Pagination.Ellipsis className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg text-xs font-semibold text-[#9c7a5d]" />
                  </Pagination.Item>
                ) : (
                  <Pagination.Item key={token} className="shrink-0">
                    <Pagination.Link
                      isActive={token === activePage}
                      onPress={() => setCurrentPage(token)}
                      className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-[#e2c49e] bg-[#fff5e6] px-2 text-xs font-semibold text-[#6b4932] transition hover:bg-[#ffecd0] data-[active=true]:border-[#c98834] data-[active=true]:bg-[linear-gradient(135deg,#f0b04d_0%,#e596be_100%)] data-[active=true]:text-[#3a2217] data-[active=true]:shadow-[0_12px_24px_-20px_rgba(149,88,32,0.62)]"
                    >
                      {token}
                    </Pagination.Link>
                  </Pagination.Item>
                ),
              )}

              <Pagination.Item className="shrink-0">
                <Pagination.Next
                  isDisabled={activePage === totalPages}
                  onPress={() => setCurrentPage(Math.min(totalPages, activePage + 1))}
                  className={`inline-flex h-9 items-center justify-center rounded-lg border border-[#deba8a] bg-[#fff4e2] text-xs font-semibold text-[#734d33] transition hover:bg-[#ffecd0] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 ${
                    isMobile ? "w-9 min-w-9 px-0" : "gap-1 px-3 uppercase tracking-[0.12em]"
                  }`}
                  aria-label="Halaman berikutnya"
                >
                  {!isMobile ? <span>Berikutnya</span> : null}
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}
