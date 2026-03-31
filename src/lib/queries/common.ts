import { ItemType, StockOpnameStatus, TransferStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function getReferenceData() {
  const [units, suppliers, locations, users, items] = await Promise.all([
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.appUser.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.item.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, include: { unit: true } }),
  ]);

  return { units, suppliers, locations, users, items };
}

export async function getProductItems(type: ItemType) {
  return prisma.item.findMany({
    where: { type },
    include: {
      unit: true,
      supplier: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStockOpnameByStatus(status: StockOpnameStatus) {
  return prisma.stockOpname.findMany({
    where: { status },
    include: {
      location: true,
      officer: true,
      approvedBy: true,
      items: {
        include: { item: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTransfersByStatus(status?: TransferStatus) {
  return prisma.stockTransfer.findMany({
    where: status ? { status } : undefined,
    include: {
      sourceLocation: true,
      destinationLocation: true,
      createdBy: true,
      receivedBy: true,
      items: {
        include: {
          item: {
            include: { unit: true },
          },
        },
      },
    },
    orderBy: { transferDate: "desc" },
  });
}

