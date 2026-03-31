import { format } from "date-fns";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

import { toNumber } from "@/lib/format";
import { getAuthUser } from "@/lib/auth/session";
import { getStockOpnameHistoryData } from "@/lib/queries/stock";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type ExportItemRow = {
  itemCode: string;
  category: string;
  itemName: string;
  unitName: string;
  systemStock: number;
  physicalStock: number;
  differenceQty: number;
  unitCost: number;
  differenceValue: number;
  note: string;
};

type CategorySummaryRow = {
  category: string;
  totalItems: number;
  totalDifferenceQty: number;
  totalDifferenceValue: number;
  itemOver: number;
  itemUnder: number;
};

const CATEGORY_ORDER = ["Bahan Baku", "Topping", "Kemasan", "Barang Jadi", "Bahan Pendukung", "Lainnya"] as const;

const COLORS = {
  navy: "FF1F4E78",
  lightBlue: "FFC7D2DD",
  paleBlue: "FFE8EEF5",
  paleGray: "FFD9D9D9",
  paleRed: "FFEAD4D4",
  paleGreen: "FFDCE6D1",
  white: "FFFFFFFF",
  black: "FF000000",
  red: "FFFF0000",
  border: "FFB7B7B7",
};

function normalizeCategory(rawCategory: string | null | undefined) {
  const normalized = String(rawCategory ?? "")
    .trim()
    .toLowerCase();

  if (!normalized) return "Lainnya";
  if (normalized.includes("bahan baku")) return "Bahan Baku";
  if (normalized.includes("topping")) return "Topping";
  if (normalized.includes("kemasan")) return "Kemasan";
  if (normalized.includes("barang jadi")) return "Barang Jadi";
  if (normalized.includes("pendukung")) return "Bahan Pendukung";
  return "Lainnya";
}

function getCategoryOrderIndex(category: string) {
  const index = CATEGORY_ORDER.indexOf(category as (typeof CATEGORY_ORDER)[number]);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

function createThinBorder() {
  return {
    top: { style: "thin" as const, color: { argb: COLORS.border } },
    right: { style: "thin" as const, color: { argb: COLORS.border } },
    bottom: { style: "thin" as const, color: { argb: COLORS.border } },
    left: { style: "thin" as const, color: { argb: COLORS.border } },
  };
}

function styleCell(
  cell: ExcelJS.Cell,
  config: {
    fillColor?: string;
    bold?: boolean;
    fontColor?: string;
    align?: "left" | "center" | "right";
    valign?: "top" | "middle" | "bottom";
    wrapText?: boolean;
    numFmt?: string;
  },
) {
  if (config.fillColor) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: config.fillColor },
    };
  }

  cell.font = {
    bold: config.bold ?? false,
    color: { argb: config.fontColor ?? COLORS.black },
    name: "Calibri",
    size: 12,
  };

  cell.alignment = {
    horizontal: config.align ?? "left",
    vertical: config.valign ?? "middle",
    wrapText: config.wrapText ?? false,
  };

  if (config.numFmt) {
    cell.numFmt = config.numFmt;
  }

  cell.border = createThinBorder();
}

function toExportRows(opnames: Awaited<ReturnType<typeof getStockOpnameHistoryData>>): ExportItemRow[] {
  const rows = opnames.flatMap((opname) =>
    opname.items.map((row) => {
      const differenceQty = toNumber(row.difference);
      const unitCost = toNumber(row.item.standardCost);
      const differenceValue = differenceQty * unitCost;

      return {
        itemCode: row.item.code ?? "-",
        category: normalizeCategory(row.item.category),
        itemName: row.item.name,
        unitName: row.item.unit.code?.trim() || row.item.unit.name?.trim() || "-",
        systemStock: toNumber(row.systemStock),
        physicalStock: toNumber(row.physicalStock),
        differenceQty,
        unitCost,
        differenceValue,
        note: row.note?.trim() ?? "",
      } satisfies ExportItemRow;
    }),
  );

  rows.sort((a, b) => {
    const byCategory = getCategoryOrderIndex(a.category) - getCategoryOrderIndex(b.category);
    if (byCategory !== 0) return byCategory;

    const byCode = a.itemCode.localeCompare(b.itemCode);
    if (byCode !== 0) return byCode;

    return a.itemName.localeCompare(b.itemName);
  });

  return rows;
}

function summarizeByCategory(rows: ExportItemRow[]): CategorySummaryRow[] {
  return CATEGORY_ORDER.map((category) => {
    const bucket = rows.filter((row) => row.category === category);
    return {
      category,
      totalItems: bucket.length,
      totalDifferenceQty: bucket.reduce((acc, row) => acc + row.differenceQty, 0),
      totalDifferenceValue: bucket.reduce((acc, row) => acc + row.differenceValue, 0),
      itemOver: bucket.filter((row) => row.differenceQty > 0).length,
      itemUnder: bucket.filter((row) => row.differenceQty < 0).length,
    };
  });
}

function buildWorkbook(rows: ExportItemRow[]) {
  const summaryRows = summarizeByCategory(rows);

  const total = summaryRows.reduce(
    (acc, row) => ({
      totalItems: acc.totalItems + row.totalItems,
      totalDifferenceQty: acc.totalDifferenceQty + row.totalDifferenceQty,
      totalDifferenceValue: acc.totalDifferenceValue + row.totalDifferenceValue,
      itemOver: acc.itemOver + row.itemOver,
      itemUnder: acc.itemUnder + row.itemUnder,
    }),
    { totalItems: 0, totalDifferenceQty: 0, totalDifferenceValue: 0, itemOver: 0, itemUnder: 0 },
  );

  const qtyAbsolute = rows.reduce((acc, row) => acc + Math.abs(row.differenceQty), 0);
  const incompleteRows = rows.filter((row) => row.note.trim().length === 0).length;
  const exactRows = rows.filter((row) => Math.abs(row.differenceQty) < 0.000_001).length;
  const accuracyRatio = rows.length === 0 ? 0 : exactRows / rows.length;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Donat Dankau";
  workbook.lastModifiedBy = "Donat Dankau";
  workbook.created = new Date();
  workbook.modified = new Date();

  const ws = workbook.addWorksheet("Ringkasan Opname", {
    views: [{ state: "frozen", ySplit: 14 }],
  });

  ws.properties.defaultRowHeight = 24;
  ws.columns = [
    { width: 18 },
    { width: 20 },
    { width: 38 },
    { width: 12 },
    { width: 16 },
    { width: 16 },
    { width: 15 },
    { width: 18 },
    { width: 18 },
    { width: 34 },
  ];

  ws.mergeCells("A1:F1");
  ws.getCell("A1").value = "RINGKASAN STOCK OPNAME";
  styleCell(ws.getCell("A1"), { fillColor: COLORS.navy, fontColor: COLORS.white, bold: true, align: "center" });
  ws.getCell("A1").font = { ...ws.getCell("A1").font, size: 18 };

  ws.mergeCells("H1:I1");
  ws.getCell("H1").value = "Kontrol & Temuan";
  styleCell(ws.getCell("H1"), { fillColor: COLORS.navy, fontColor: COLORS.white, bold: true, align: "center" });
  ws.getCell("I1").border = createThinBorder();
  ws.getCell("I1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.navy },
  };

  const summaryHeaderRow = 3;
  const summaryHeaders = ["Kategori", "Total Item", "Total Selisih Qty", "Nilai Selisih", "Item Lebih", "Item Kurang"];
  summaryHeaders.forEach((header, idx) => {
    const cell = ws.getCell(summaryHeaderRow, idx + 1);
    cell.value = header;
    styleCell(cell, { fillColor: COLORS.navy, fontColor: COLORS.white, bold: true, align: "center" });
  });

  const summaryStartRow = 4;
  summaryRows.forEach((row, index) => {
    const rowNumber = summaryStartRow + index;
    ws.getCell(rowNumber, 1).value = row.category;
    ws.getCell(rowNumber, 2).value = row.totalItems;
    ws.getCell(rowNumber, 3).value = row.totalDifferenceQty;
    ws.getCell(rowNumber, 4).value = row.totalDifferenceValue;
    ws.getCell(rowNumber, 5).value = row.itemOver;
    ws.getCell(rowNumber, 6).value = row.itemUnder;

    styleCell(ws.getCell(rowNumber, 1), { fillColor: COLORS.lightBlue, fontColor: "FF0000EE", align: "left" });
    styleCell(ws.getCell(rowNumber, 2), { fillColor: COLORS.paleGray, bold: false, align: "right" });
    styleCell(ws.getCell(rowNumber, 3), {
      fillColor: COLORS.paleGray,
      align: "right",
      numFmt: "#,##0.00;[Red](#,##0.00);-",
    });
    styleCell(ws.getCell(rowNumber, 4), {
      fillColor: COLORS.paleGray,
      align: "right",
      numFmt: "Rp #,##0;[Red](Rp #,##0);-",
    });
    styleCell(ws.getCell(rowNumber, 5), { fillColor: COLORS.paleGray, align: "right" });
    styleCell(ws.getCell(rowNumber, 6), { fillColor: COLORS.paleGray, align: "right" });
  });

  const summaryTotalRow = summaryStartRow + summaryRows.length + 1;
  ws.getCell(summaryTotalRow, 1).value = "TOTAL";
  ws.getCell(summaryTotalRow, 2).value = total.totalItems;
  ws.getCell(summaryTotalRow, 3).value = total.totalDifferenceQty;
  ws.getCell(summaryTotalRow, 4).value = total.totalDifferenceValue;
  ws.getCell(summaryTotalRow, 5).value = total.itemOver;
  ws.getCell(summaryTotalRow, 6).value = total.itemUnder;

  for (let col = 1; col <= 6; col += 1) {
    const cell = ws.getCell(summaryTotalRow, col);
    styleCell(cell, { fillColor: COLORS.paleGray, bold: true, align: col === 1 ? "left" : "right" });
  }
  ws.getCell(summaryTotalRow, 3).numFmt = "#,##0.00;[Red](#,##0.00);-";
  ws.getCell(summaryTotalRow, 4).numFmt = "Rp #,##0;[Red](Rp #,##0);-";

  const controlRows = [
    { label: "Total nilai selisih", value: total.totalDifferenceValue, numFmt: "Rp #,##0;[Red](Rp #,##0);-" },
    { label: "Qty selisih absolut", value: qtyAbsolute, numFmt: "#,##0.00" },
    { label: "Baris belum lengkap", value: incompleteRows, numFmt: "#,##0" },
    { label: "Akurasi item", value: accuracyRatio, numFmt: "0.0%" },
  ];

  controlRows.forEach((row, index) => {
    const line = 2 + index;
    ws.getCell(line, 8).value = row.label;
    ws.getCell(line, 9).value = row.value;

    styleCell(ws.getCell(line, 8), { fillColor: COLORS.paleGray, bold: true, fontColor: "FF666666", align: "left" });
    styleCell(ws.getCell(line, 9), { fillColor: "FFC7D8D9", bold: true, align: "right", numFmt: row.numFmt });

    if (index === 0 && total.totalDifferenceValue < 0) {
      ws.getCell(line, 9).font = {
        ...ws.getCell(line, 9).font,
        color: { argb: COLORS.red },
      };
    }
  });

  const detailHeaderRow = 14;
  const detailHeaders = [
    "Kode Item",
    "Kategori",
    "Nama Barang",
    "Satuan",
    "Stok Sistem",
    "Stok Fisik",
    "Selisih",
    "Harga Pokok / Unit",
    "Nilai Selisih",
    "Catatan",
  ];

  detailHeaders.forEach((header, idx) => {
    const cell = ws.getCell(detailHeaderRow, idx + 1);
    cell.value = header;
    styleCell(cell, { fillColor: COLORS.navy, fontColor: COLORS.white, bold: true, align: "center" });
  });

  const detailStartRow = detailHeaderRow + 1;
  rows.forEach((row, index) => {
    const line = detailStartRow + index;
    ws.getCell(line, 1).value = row.itemCode;
    ws.getCell(line, 2).value = row.category;
    ws.getCell(line, 3).value = row.itemName;
    ws.getCell(line, 4).value = row.unitName;
    ws.getCell(line, 5).value = row.systemStock;
    ws.getCell(line, 6).value = row.physicalStock;
    ws.getCell(line, 7).value = row.differenceQty === 0 ? "-" : row.differenceQty;
    ws.getCell(line, 8).value = row.unitCost;
    ws.getCell(line, 9).value = row.differenceValue === 0 ? "-" : row.differenceValue;
    ws.getCell(line, 10).value = row.note;

    for (let col = 1; col <= 10; col += 1) {
      styleCell(ws.getCell(line, col), {
        fillColor: COLORS.lightBlue,
        align: col >= 5 && col <= 9 ? "right" : "left",
      });
    }

    ws.getCell(line, 5).numFmt = "#,##0.00";
    ws.getCell(line, 6).numFmt = "#,##0.00";
    ws.getCell(line, 8).numFmt = "Rp #,##0";

    if (row.differenceQty === 0) {
      ws.getCell(line, 7).alignment = { horizontal: "center", vertical: "middle" };
    } else {
      ws.getCell(line, 7).numFmt = "#,##0.00;[Red](#,##0.00);-";
      ws.getCell(line, 7).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: row.differenceQty < 0 ? COLORS.paleRed : COLORS.paleGreen },
      };
    }

    if (row.differenceValue === 0) {
      ws.getCell(line, 9).alignment = { horizontal: "center", vertical: "middle" };
    } else {
      ws.getCell(line, 9).numFmt = "Rp #,##0;[Red](Rp #,##0);-";
      ws.getCell(line, 9).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: row.differenceValue < 0 ? COLORS.paleRed : COLORS.white },
      };
    }

    if (!row.note) {
      ws.getCell(line, 10).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: COLORS.paleGray },
      };
    }
  });

  ws.autoFilter = {
    from: { row: detailHeaderRow, column: 1 },
    to: { row: detailHeaderRow, column: 10 },
  };

  ws.getColumn(10).alignment = { wrapText: true, vertical: "top" };
  ws.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
  };

  return workbook;
}

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const opnames = await getStockOpnameHistoryData(500);
  const exportRows = toExportRows(opnames);
  const workbook = buildWorkbook(exportRows);

  const buffer = await workbook.xlsx.writeBuffer();
  const fileBuffer = Buffer.from(buffer);
  const todayLabel = format(new Date(), "yyyy-MM-dd");
  const fileName = `rekap-stock-opname-${todayLabel}.xlsx`;

  try {
    await prisma.activityLog.create({
      data: {
        userId: authUser.id,
        module: "Stock Opname",
        action: "EXPORT",
        entity: "StockOpname",
        details: `Export rekap stock opname (${opnames.length} dokumen)`,
        metadata: {
          fileName,
          totalDocuments: opnames.length,
          totalRows: exportRows.length,
        },
      },
    });
  } catch (error) {
    console.error("Failed to write export activity log:", error);
  }

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=\"${fileName}\"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
