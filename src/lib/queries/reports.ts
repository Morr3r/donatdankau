import { ItemType, StockMovementCategory, StockMovementType } from "@prisma/client";
import { endOfDay, startOfDay, subDays } from "date-fns";

import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/format";

export async function getCurrentStockReport() {
  const stock = await prisma.stockLevel.findMany({
    where: { item: { type: ItemType.RAW_MATERIAL } },
    include: {
      item: { include: { unit: true } },
      location: true,
    },
    orderBy: [{ location: { name: "asc" } }, { item: { name: "asc" } }],
  });

  return {
    rows: stock,
    totals: {
      rawQty: stock.reduce((acc, row) => acc + toNumber(row.quantity), 0),
      itemCount: stock.length,
      locationCount: new Set(stock.map((row) => row.locationId)).size,
      estimatedValue: stock.reduce((acc, row) => acc + toNumber(row.quantity) * toNumber(row.item.standardCost), 0),
    },
  };
}

export async function getStockCardReport(itemId?: string) {
  const where = itemId
    ? { itemId, item: { type: ItemType.RAW_MATERIAL } }
    : { item: { type: ItemType.RAW_MATERIAL } };

  const [items, movements] = await Promise.all([
    prisma.item.findMany({ where: { type: ItemType.RAW_MATERIAL }, include: { unit: true }, orderBy: { name: "asc" } }),
    prisma.stockMovement.findMany({
      where,
      include: {
        item: { include: { unit: true } },
        sourceLocation: true,
        destinationLocation: true,
        inputBy: true,
      },
      orderBy: { movementDate: "asc" },
      take: 500,
    }),
  ]);

  const incomingTypes = new Set<StockMovementType>([
    StockMovementType.STOCK_IN,
    StockMovementType.TRANSFER_IN,
    StockMovementType.ADJUSTMENT_PLUS,
  ]);

  let runningBalance = 0;
  const rows = movements.map((movement) => {
    const qty = toNumber(movement.quantity);
    const isIn = incomingTypes.has(movement.movementType);

    runningBalance += isIn ? qty : -qty;

    return {
      ...movement,
      masuk: isIn ? qty : 0,
      keluar: isIn ? 0 : qty,
      saldoAkhir: runningBalance,
    };
  });

  return { items, rows };
}

export async function getOpnameReport() {
  const opnames = await prisma.stockOpname.findMany({
    include: {
      location: true,
      officer: true,
      approvedBy: true,
      items: {
        where: { item: { type: ItemType.RAW_MATERIAL } },
        include: { item: true },
      },
    },
    orderBy: { opnameDate: "desc" },
    take: 100,
  });

  const locationDiff = new Map<string, { location: string; totalDiff: number }>();

  for (const opname of opnames) {
    const totalDiff = opname.items.reduce((acc, row) => acc + Math.abs(toNumber(row.difference)), 0);
    const current = locationDiff.get(opname.locationId) ?? { location: opname.location.name, totalDiff: 0 };
    current.totalDiff += totalDiff;
    locationDiff.set(opname.locationId, current);
  }

  const topDiffLocation = Array.from(locationDiff.values()).sort((a, b) => b.totalDiff - a.totalDiff)[0];

  return {
    rows: opnames,
    summary: {
      totalDocuments: opnames.length,
      totalDifference: opnames.reduce(
        (acc, opname) =>
          acc + opname.items.reduce((inner, detail) => inner + Math.abs(toNumber(detail.difference)), 0),
        0,
      ),
      topDiffLocation,
    },
  };
}

export async function getInboundReport() {
  const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));
  const todayEnd = endOfDay(new Date());

  const rows = await prisma.stockMovement.findMany({
    where: {
      movementDate: { gte: thirtyDaysAgo, lte: todayEnd },
      item: { type: ItemType.RAW_MATERIAL },
      movementType: {
        in: [StockMovementType.STOCK_IN, StockMovementType.TRANSFER_IN, StockMovementType.ADJUSTMENT_PLUS],
      },
    },
    include: {
      item: { include: { unit: true } },
      destinationLocation: true,
      sourceSupplier: true,
      inputBy: true,
    },
    orderBy: { movementDate: "desc" },
    take: 300,
  });

  const supplierSummary = new Map<string, number>();
  for (const row of rows) {
    const key = row.sourceSupplier?.name ?? "Non Supplier";
    supplierSummary.set(key, (supplierSummary.get(key) ?? 0) + toNumber(row.quantity));
  }

  return {
    rows,
    supplierSummary: Array.from(supplierSummary.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty),
  };
}

export async function getOutboundReport() {
  const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));
  const todayEnd = endOfDay(new Date());

  const rows = await prisma.stockMovement.findMany({
    where: {
      movementDate: { gte: thirtyDaysAgo, lte: todayEnd },
      item: { type: ItemType.RAW_MATERIAL },
      movementType: {
        in: [StockMovementType.STOCK_OUT, StockMovementType.TRANSFER_OUT, StockMovementType.ADJUSTMENT_MINUS],
      },
    },
    include: {
      item: { include: { unit: true } },
      sourceLocation: true,
      destinationLocation: true,
      inputBy: true,
    },
    orderBy: { movementDate: "desc" },
    take: 300,
  });

  return { rows };
}

export async function getWasteVarianceReport() {
  const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));

  const rows = await prisma.stockMovement.findMany({
    where: {
      movementDate: { gte: thirtyDaysAgo },
      item: { type: ItemType.RAW_MATERIAL },
      category: {
        in: [StockMovementCategory.DAMAGED, StockMovementCategory.EXPIRED, StockMovementCategory.OPNAME],
      },
    },
    include: {
      item: { include: { unit: true } },
      sourceLocation: true,
      inputBy: true,
    },
    orderBy: { movementDate: "desc" },
    take: 300,
  });

  const totalExpired = rows
    .filter((row) => row.category === StockMovementCategory.EXPIRED)
    .reduce((acc, row) => acc + toNumber(row.quantity), 0);

  const totalDamaged = rows
    .filter((row) => row.category === StockMovementCategory.DAMAGED)
    .reduce((acc, row) => acc + toNumber(row.quantity), 0);

  const totalVariance = rows
    .filter((row) => row.category === StockMovementCategory.OPNAME)
    .reduce((acc, row) => acc + toNumber(row.quantity), 0);

  const itemVarianceMap = new Map<string, { item: string; total: number }>();

  for (const row of rows) {
    const key = row.itemId;
    const current = itemVarianceMap.get(key) ?? { item: row.item.name, total: 0 };
    current.total += toNumber(row.quantity);
    itemVarianceMap.set(key, current);
  }

  const frequentVarianceItems = Array.from(itemVarianceMap.values()).sort((a, b) => b.total - a.total).slice(0, 10);

  return {
    rows,
    summary: {
      totalExpired,
      totalDamaged,
      totalVariance,
      frequentVarianceItems,
    },
  };
}

export async function getUserActivityReport() {
  const rows = await prisma.activityLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const activityByUser = new Map<string, { name: string; total: number }>();
  for (const row of rows) {
    const key = row.userId ?? "system";
    const name = row.user?.name ?? "System";
    const current = activityByUser.get(key) ?? { name, total: 0 };
    current.total += 1;
    activityByUser.set(key, current);
  }

  return {
    rows,
    summary: Array.from(activityByUser.values()).sort((a, b) => b.total - a.total),
  };
}
