import { ItemType, StockMovementType, StockOpnameStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getOrCreateDefaultLocation } from "@/lib/location";

export async function getStockMovementPageData(section: string) {
  const [units, suppliers, items, defaultLocation] = await Promise.all([
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.item.findMany({
      where: { isActive: true, type: ItemType.RAW_MATERIAL },
      include: { unit: true },
      orderBy: { name: "asc" },
    }),
    getOrCreateDefaultLocation(),
  ]);

  if (section === "in") {
    const movements = await prisma.stockMovement.findMany({
      where: { movementType: StockMovementType.STOCK_IN, item: { type: ItemType.RAW_MATERIAL } },
      include: {
        item: { include: { unit: true } },
        destinationLocation: true,
        sourceSupplier: true,
        inputBy: true,
      },
      orderBy: { movementDate: "desc" },
      take: 100,
    });

    return { units, suppliers, items, movements, defaultLocation };
  }

  if (section === "out") {
    const movements = await prisma.stockMovement.findMany({
      where: { movementType: StockMovementType.STOCK_OUT, item: { type: ItemType.RAW_MATERIAL } },
      include: {
        item: { include: { unit: true } },
        sourceLocation: true,
        destinationLocation: true,
        inputBy: true,
      },
      orderBy: { movementDate: "desc" },
      take: 100,
    });

    return { units, suppliers, items, movements, defaultLocation };
  }

  if (section === "adjustments") {
    const movements = await prisma.stockMovement.findMany({
      where: {
        movementType: {
          in: [StockMovementType.ADJUSTMENT_PLUS, StockMovementType.ADJUSTMENT_MINUS],
        },
        item: { type: ItemType.RAW_MATERIAL },
      },
      include: {
        item: { include: { unit: true } },
        sourceLocation: true,
        destinationLocation: true,
        inputBy: true,
      },
      orderBy: { movementDate: "desc" },
      take: 100,
    });

    return { units, items, movements, defaultLocation };
  }

  return null;
}

export async function getStockOpnamePageData(section: string, opnameId?: string) {
  const [items, defaultLocation] = await Promise.all([
    prisma.item.findMany({
      where: { isActive: true, type: ItemType.RAW_MATERIAL },
      include: { unit: true },
      orderBy: { name: "asc" },
    }),
    getOrCreateDefaultLocation(),
  ]);

  if (section === "create") {
    const draftOpnames = await prisma.stockOpname.findMany({
      where: { status: StockOpnameStatus.DRAFT },
      include: {
        location: true,
        officer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { draftOpnames, defaultLocation };
  }

  if (section === "process") {
    const draftOpnames = await prisma.stockOpname.findMany({
      where: { status: StockOpnameStatus.DRAFT },
      include: {
        location: true,
        officer: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const selectedOpname =
      opnameId && draftOpnames.some((entry) => entry.id === opnameId)
        ? await prisma.stockOpname.findUnique({
            where: { id: opnameId },
            include: {
              location: true,
              officer: true,
              items: {
                include: {
                  item: { include: { unit: true } },
                },
                orderBy: { createdAt: "desc" },
              },
            },
          })
        : null;

    return { items, draftOpnames, selectedOpname, defaultLocation };
  }

  if (section === "history") {
    const opnames = await getStockOpnameHistoryData();

    return { opnames };
  }

  return null;
}

export async function getStockOpnameHistoryData(take = 200) {
  return prisma.stockOpname.findMany({
    include: {
      location: true,
      officer: true,
      approvedBy: true,
      items: {
        include: {
          item: { include: { unit: true } },
        },
        where: {
          item: { type: ItemType.RAW_MATERIAL },
        },
      },
    },
    orderBy: { opnameDate: "desc" },
    take,
  });
}
