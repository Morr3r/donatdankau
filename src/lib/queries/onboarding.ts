import { ItemType, StockMovementType, StockOpnameStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

async function getPricedMaterialCountFallbackSafe() {
  try {
    return await prisma.item.count({
      where: { type: ItemType.RAW_MATERIAL, isActive: true, standardCost: { gt: 0 } } as never,
    });
  } catch {
    return 0;
  }
}

export async function getOnboardingChecklistData() {
  const pricedMaterialCountPromise = getPricedMaterialCountFallbackSafe();

  const [
    unitCount,
    materialCount,
    pricedMaterialCount,
    stockInCount,
    stockOutCount,
    adjustmentCount,
    draftOpnameCount,
    draftOpnameItemCount,
    approvedOpnameCount,
  ] = await Promise.all([
    prisma.unit.count(),
    prisma.item.count({ where: { type: ItemType.RAW_MATERIAL, isActive: true } }),
    pricedMaterialCountPromise,
    prisma.stockMovement.count({
      where: {
        movementType: StockMovementType.STOCK_IN,
        item: { type: ItemType.RAW_MATERIAL },
      },
    }),
    prisma.stockMovement.count({
      where: {
        movementType: StockMovementType.STOCK_OUT,
        item: { type: ItemType.RAW_MATERIAL },
      },
    }),
    prisma.stockMovement.count({
      where: {
        movementType: { in: [StockMovementType.ADJUSTMENT_PLUS, StockMovementType.ADJUSTMENT_MINUS] },
        item: { type: ItemType.RAW_MATERIAL },
      },
    }),
    prisma.stockOpname.count({ where: { status: StockOpnameStatus.DRAFT } }),
    prisma.stockOpnameItem.count({ where: { stockOpname: { status: StockOpnameStatus.DRAFT } } }),
    prisma.stockOpname.count({ where: { status: StockOpnameStatus.APPROVED } }),
  ]);

  const setup = {
    unitDone: unitCount > 0,
    materialDone: materialCount > 0,
    priceDone: materialCount > 0 && pricedMaterialCount === materialCount,
    initialStockDone: stockInCount > 0,
  };

  const daily = {
    stockInDone: stockInCount > 0,
    stockOutDone: stockOutCount > 0,
    adjustmentDone: adjustmentCount > 0,
  };

  const closing = {
    createDone: draftOpnameCount > 0,
    countDone: draftOpnameItemCount > 0,
    recapDone: approvedOpnameCount > 0,
  };

  const setupDone = setup.unitDone && setup.materialDone && setup.priceDone && setup.initialStockDone;
  const dailyDone = daily.stockInDone && daily.stockOutDone;
  const closingDone = closing.createDone && closing.countDone && closing.recapDone;

  const stageDone = [setupDone, dailyDone, closingDone].filter(Boolean).length;

  const nextStep = !setupDone
    ? { href: "/master/units", label: "Mulai Setup Awal" }
    : !dailyDone
      ? { href: "/stock-movement/in", label: "Mulai Operasional Harian" }
      : !closingDone
        ? { href: "/stock-opname/create", label: "Mulai Tutup Bulan" }
        : null;

  return {
    setup,
    daily,
    closing,
    setupDone,
    dailyDone,
    closingDone,
    stageDone,
    nextStep,
  };
}
