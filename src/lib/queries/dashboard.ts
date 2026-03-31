import { ItemType, StockMovementType, StockOpnameStatus } from "@prisma/client";
import { addDays, differenceInCalendarDays, endOfDay, format, isValid, parseISO, startOfDay, subDays } from "date-fns";

import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/format";

type DashboardDateRangeInput = {
  startDate?: string;
  endDate?: string;
};

function parseDateOnly(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = parseISO(value);
  if (!isValid(parsed)) return null;
  return parsed;
}

function resolveMovementRange(input?: DashboardDateRangeInput) {
  const today = startOfDay(new Date());
  const defaultEnd = today;
  const defaultStart = subDays(defaultEnd, 6);

  const parsedStart = parseDateOnly(input?.startDate);
  const parsedEnd = parseDateOnly(input?.endDate);

  let start = defaultStart;
  let end = defaultEnd;
  let isCustom = false;

  if (parsedStart && parsedEnd) {
    const normalizedStart = startOfDay(parsedStart);
    const normalizedEnd = startOfDay(parsedEnd);

    if (normalizedStart <= normalizedEnd) {
      start = normalizedStart;
      end = normalizedEnd;
    } else {
      start = normalizedEnd;
      end = normalizedStart;
    }

    isCustom = true;
  }

  const maxDays = 120;
  const totalDays = differenceInCalendarDays(end, start) + 1;
  if (totalDays > maxDays) {
    start = subDays(end, maxDays - 1);
  }

  return {
    startDay: start,
    endDay: end,
    startTimestamp: startOfDay(start),
    endTimestamp: endOfDay(end),
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
    days: differenceInCalendarDays(end, start) + 1,
    isCustom,
  };
}

export async function getDashboardData(rangeInput?: DashboardDateRangeInput) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const movementRange = resolveMovementRange(rangeInput);
  const nearExpiryDate = addDays(now, 7);

  const [
    rawStockAggregate,
    stockLevels,
    expiringLots,
    latestOpname,
    recentOpnameItems,
    incomingToday,
    outgoingToday,
    activities,
    movementHistory,
    pendingOpnames,
  ] = await Promise.all([
    prisma.stockLevel.aggregate({
      _sum: { quantity: true },
      where: { item: { type: ItemType.RAW_MATERIAL } },
    }),
    prisma.stockLevel.findMany({
      where: { item: { type: ItemType.RAW_MATERIAL } },
      include: {
        item: { include: { unit: true } },
        location: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.stockLot.findMany({
      where: {
        quantity: { gt: 0 },
        expiryDate: { lte: nearExpiryDate },
        item: { type: ItemType.RAW_MATERIAL },
      },
      include: {
        item: true,
        location: true,
      },
      orderBy: { expiryDate: "asc" },
      take: 12,
    }),
    prisma.stockOpname.findFirst({
      where: { status: StockOpnameStatus.APPROVED },
      include: {
        location: true,
        officer: true,
        approvedBy: true,
        items: true,
      },
      orderBy: { approvedAt: "desc" },
    }),
    prisma.stockOpnameItem.findMany({
      where: { item: { type: ItemType.RAW_MATERIAL } },
      include: {
        item: true,
        stockOpname: { include: { location: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    prisma.stockMovement.aggregate({
      _sum: { quantity: true },
      where: {
        movementDate: { gte: todayStart, lte: todayEnd },
        item: { type: ItemType.RAW_MATERIAL },
        movementType: {
          in: [StockMovementType.STOCK_IN, StockMovementType.TRANSFER_IN, StockMovementType.ADJUSTMENT_PLUS],
        },
      },
    }),
    prisma.stockMovement.aggregate({
      _sum: { quantity: true },
      where: {
        movementDate: { gte: todayStart, lte: todayEnd },
        item: { type: ItemType.RAW_MATERIAL },
        movementType: {
          in: [StockMovementType.STOCK_OUT, StockMovementType.TRANSFER_OUT, StockMovementType.ADJUSTMENT_MINUS],
        },
      },
    }),
    prisma.activityLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.stockMovement.findMany({
      where: {
        movementDate: { gte: movementRange.startTimestamp, lte: movementRange.endTimestamp },
        item: { type: ItemType.RAW_MATERIAL },
      },
      select: { movementDate: true, movementType: true, quantity: true },
      orderBy: { movementDate: "asc" },
    }),
    prisma.stockOpname.count({
      where: { status: StockOpnameStatus.DRAFT },
    }),
  ]);

  const lowStockItems = stockLevels
    .filter((level) => toNumber(level.item.minStock) > 0 && toNumber(level.quantity) <= toNumber(level.item.minStock))
    .sort((a, b) => toNumber(a.quantity) - toNumber(b.quantity))
    .slice(0, 12);

  const expiredLots = expiringLots.filter((lot) => lot.expiryDate && lot.expiryDate < now);
  const nearExpiredLots = expiringLots.filter((lot) => lot.expiryDate && lot.expiryDate >= now);

  const biggestVariance = recentOpnameItems
    .map((entry) => ({
      ...entry,
      absDifference: Math.abs(toNumber(entry.difference)),
    }))
    .sort((a, b) => b.absDifference - a.absDifference)[0];

  const movementMap = new Map<string, { date: string; incoming: number; outgoing: number }>();
  const incomingTypes = new Set<StockMovementType>([
    StockMovementType.STOCK_IN,
    StockMovementType.TRANSFER_IN,
    StockMovementType.ADJUSTMENT_PLUS,
  ]);

  for (let i = 0; i < movementRange.days; i += 1) {
    const key = format(addDays(movementRange.startDay, i), "yyyy-MM-dd");
    movementMap.set(key, { date: key, incoming: 0, outgoing: 0 });
  }

  for (const movement of movementHistory) {
    const key = format(movement.movementDate, "yyyy-MM-dd");
    const current = movementMap.get(key);
    if (!current) continue;
    const qty = toNumber(movement.quantity);

    if (incomingTypes.has(movement.movementType)) {
      current.incoming += qty;
    } else {
      current.outgoing += qty;
    }
  }

  const movementChart = Array.from(movementMap.values()).map((entry) => ({
    ...entry,
    label: format(new Date(entry.date), "dd/MM"),
  }));

  return {
    totals: {
      rawStock: toNumber(rawStockAggregate._sum.quantity),
      lowStockItems: lowStockItems.length,
      expiringItems: expiringLots.length,
      expiredItems: expiredLots.length,
      pendingOpnames,
      incomingToday: toNumber(incomingToday._sum.quantity),
      outgoingToday: toNumber(outgoingToday._sum.quantity),
    },
    latestOpname,
    biggestVariance,
    lowStockItems,
    expiringLots: nearExpiredLots,
    expiredLots,
    recentActivities: activities,
    movementChart,
    movementRange,
  };
}
