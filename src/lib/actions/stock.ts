"use server";

import { ItemType, StockMovementCategory, StockMovementType, StockOpnameStatus, ValidationStatus } from "@prisma/client";
import { PrismaClientInitializationError, PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { adjustStockLevel, getNextDocumentNumber, logActivity, parseNumber, parseText } from "@/lib/actions/shared";
import { getOrCreateDefaultLocation } from "@/lib/location";
import { convertQuantityBetweenUnits, getUnitDisplayName } from "@/lib/unit-conversion";

function redirectWithStatus(path: string, key: "success" | "error", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

function isRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof PrismaClientKnownRequestError) {
    if (["P1000", "P1001", "P1010"].includes(error.code)) {
      return "Koneksi database sedang bermasalah. Coba lagi beberapa detik lagi.";
    }

    if (error.code === "P2002") {
      return "Data duplikat terdeteksi. Gunakan nilai yang berbeda.";
    }
  }

  if (error instanceof PrismaClientInitializationError) {
    return "Koneksi database gagal diinisialisasi. Cek DATABASE_URL dan restart server.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function handleActionError(path: string, error: unknown, fallback: string): never {
  if (isRedirectError(error)) {
    throw error;
  }

  redirectWithStatus(path, "error", getActionErrorMessage(error, fallback));
}

function parseDate(value: FormDataEntryValue | null) {
  if (!value) return new Date();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function getActiveAdminId() {
  const user = await requireAuthUser();
  return user.id;
}

function normalizePath(path: string, fallback: string) {
  return path.startsWith("/") ? path : fallback;
}

async function ensureStockCanApplyDelta(
  tx: Parameters<typeof adjustStockLevel>[0],
  payload: { itemId: string; locationId: string; delta: number },
) {
  if (payload.delta >= 0) return;

  const current = await tx.stockLevel.findUnique({
    where: { itemId_locationId: { itemId: payload.itemId, locationId: payload.locationId } },
  });

  if (Number(current?.quantity ?? 0) + payload.delta < 0) {
    throw new Error("Stok tidak mencukupi untuk perubahan data.");
  }
}

type ItemWithUnit = {
  id: string;
  unitId: string;
  unit: {
    id: string;
    code: string;
    name: string;
  };
};

async function convertInputQuantityToItemUnit(
  tx: Parameters<typeof adjustStockLevel>[0],
  payload: {
    item: ItemWithUnit;
    inputUnitId: string;
    quantity: number;
  },
) {
  const inputUnit = await tx.unit.findUnique({
    where: { id: payload.inputUnitId },
    select: { id: true, code: true, name: true },
  });

  if (!inputUnit) {
    throw new Error("Satuan input tidak ditemukan.");
  }

  const converted = convertQuantityBetweenUnits(payload.quantity, inputUnit, payload.item.unit);
  if (!converted) {
    throw new Error(
      `Satuan ${getUnitDisplayName(inputUnit)} tidak bisa dikonversi ke ${getUnitDisplayName(payload.item.unit)}.`,
    );
  }

  if (converted.quantity < 0.001) {
    throw new Error(
      `Qty hasil konversi terlalu kecil untuk disimpan pada satuan ${getUnitDisplayName(payload.item.unit)}. Gunakan satuan bahan baku yang lebih kecil (contoh: gram/ml).`,
    );
  }

  return {
    inputUnit,
    convertedQuantity: converted.quantity,
    converted: converted.converted,
  };
}

function revalidateMovementRelatedPaths(path: string) {
  revalidatePath(path);
  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath("/reports/current-stock");
  revalidatePath("/stock-opname/process");
  revalidatePath("/stock-opname/history");
}

export async function createStockInAction(formData: FormData) {
  const path = "/stock-movement/in";

  try {
    const inputById = await getActiveAdminId();
    const itemId = String(formData.get("itemId") ?? "");
    const qty = parseNumber(formData.get("quantity"));
    const defaultLocation = await getOrCreateDefaultLocation();
    const destinationLocationId = String(formData.get("destinationLocationId") ?? "").trim() || defaultLocation.id;
    const unitId = String(formData.get("unitId") ?? "");

    if (!itemId || !destinationLocationId || !unitId || qty <= 0) {
      redirectWithStatus(path, "error", "Data stok masuk belum lengkap.");
    }

    await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
        include: { unit: { select: { id: true, code: true, name: true } } },
      });
      if (!item || item.type !== ItemType.RAW_MATERIAL || !item.isActive) {
        throw new Error("Item stok masuk harus bahan baku aktif.");
      }

      const normalizedQty = await convertInputQuantityToItemUnit(tx, {
        item,
        inputUnitId: unitId,
        quantity: qty,
      });

      const transactionNumber =
        parseText(formData.get("transactionNumber")) ?? (await getNextDocumentNumber(tx, "stock_in", "IN"));

      const movement = await tx.stockMovement.create({
        data: {
          movementDate: parseDate(formData.get("movementDate")),
          movementType: StockMovementType.STOCK_IN,
          category: (String(formData.get("category") ?? "PURCHASE") as StockMovementCategory) ?? "PURCHASE",
          transactionNumber,
          referenceDocument: parseText(formData.get("referenceDocument")),
          itemId,
          quantity: normalizedQty.convertedQuantity,
          unitId: item.unitId,
          destinationLocationId,
          sourceSupplierId: parseText(formData.get("sourceSupplierId")),
          reason: parseText(formData.get("reason")),
          inputById,
          validationStatus: ValidationStatus.VALIDATED,
          validatedById: inputById,
          validatedAt: new Date(),
        },
      });

      await adjustStockLevel(tx, {
        itemId,
        locationId: destinationLocationId,
        delta: normalizedQty.convertedQuantity,
      });

      const expiryDateText = parseText(formData.get("expiryDate"));
      if (expiryDateText) {
        await tx.stockLot.create({
          data: {
            batchCode:
              parseText(formData.get("batchCode")) ??
              `${transactionNumber}-${new Date().toISOString().slice(11, 19).replace(/:/g, "")}`,
            itemId,
            locationId: destinationLocationId,
            receivedAt: parseDate(formData.get("movementDate")),
            expiryDate: new Date(expiryDateText),
            quantity: normalizedQty.convertedQuantity,
          },
        });
      }

      await logActivity(tx, {
        userId: inputById,
        module: "STOCK_IN",
        action: "CREATE",
        entity: "StockMovement",
        entityId: movement.id,
        details: normalizedQty.converted
          ? `Input stok masuk ${transactionNumber} (${qty} ${normalizedQty.inputUnit.name} -> ${normalizedQty.convertedQuantity} ${item.unit.name})`
          : `Input stok masuk ${transactionNumber}`,
      });
    });

    revalidateMovementRelatedPaths(path);
    redirectWithStatus(path, "success", "Stok masuk berhasil dicatat.");
  } catch (error) {
    handleActionError(path, error, "Gagal simpan stok masuk.");
  }
}

export async function createStockOutAction(formData: FormData) {
  const path = "/stock-movement/out";

  try {
    const inputById = await getActiveAdminId();
    const itemId = String(formData.get("itemId") ?? "");
    const qty = parseNumber(formData.get("quantity"));
    const defaultLocation = await getOrCreateDefaultLocation();
    const sourceLocationId = String(formData.get("sourceLocationId") ?? "").trim() || defaultLocation.id;
    const unitId = String(formData.get("unitId") ?? "");

    if (!itemId || !sourceLocationId || !unitId || qty <= 0) {
      redirectWithStatus(path, "error", "Data stok keluar belum lengkap.");
    }

    await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
        include: { unit: { select: { id: true, code: true, name: true } } },
      });
      if (!item || item.type !== ItemType.RAW_MATERIAL || !item.isActive) {
        throw new Error("Item stok keluar harus bahan baku aktif.");
      }

      const normalizedQty = await convertInputQuantityToItemUnit(tx, {
        item,
        inputUnitId: unitId,
        quantity: qty,
      });

      const current = await tx.stockLevel.findUnique({
        where: { itemId_locationId: { itemId, locationId: sourceLocationId } },
      });

      if (Number(current?.quantity ?? 0) < normalizedQty.convertedQuantity) {
        throw new Error("Stok tidak mencukupi untuk transaksi keluar.");
      }

      const transactionNumber =
        parseText(formData.get("transactionNumber")) ?? (await getNextDocumentNumber(tx, "stock_out", "OUT"));

      const movement = await tx.stockMovement.create({
        data: {
          movementDate: parseDate(formData.get("movementDate")),
          movementType: StockMovementType.STOCK_OUT,
          category: (String(formData.get("category") ?? "PRODUCTION") as StockMovementCategory) ?? "PRODUCTION",
          transactionNumber,
          referenceDocument: parseText(formData.get("referenceDocument")),
          itemId,
          quantity: normalizedQty.convertedQuantity,
          unitId: item.unitId,
          sourceLocationId,
          destinationLocationId: parseText(formData.get("destinationLocationId")),
          reason: parseText(formData.get("reason")),
          inputById,
          validationStatus: ValidationStatus.VALIDATED,
          validatedById: inputById,
          validatedAt: new Date(),
        },
      });

      await adjustStockLevel(tx, {
        itemId,
        locationId: sourceLocationId,
        delta: -normalizedQty.convertedQuantity,
      });

      await logActivity(tx, {
        userId: inputById,
        module: "STOCK_OUT",
        action: "CREATE",
        entity: "StockMovement",
        entityId: movement.id,
        details: normalizedQty.converted
          ? `Input stok keluar ${transactionNumber} (${qty} ${normalizedQty.inputUnit.name} -> ${normalizedQty.convertedQuantity} ${item.unit.name})`
          : `Input stok keluar ${transactionNumber}`,
      });
    });

    revalidateMovementRelatedPaths(path);
    redirectWithStatus(path, "success", "Stok keluar berhasil dicatat.");
  } catch (error) {
    handleActionError(path, error, "Gagal simpan stok keluar.");
  }
}

export async function updateStockInAction(formData: FormData) {
  const path = normalizePath(String(formData.get("redirectPath") ?? "/stock-movement/in"), "/stock-movement/in");

  try {
    const actorId = await getActiveAdminId();
    const movementId = String(formData.get("movementId") ?? "").trim();
    const quantity = parseNumber(formData.get("quantity"));
    const category = String(formData.get("category") ?? "PURCHASE") as StockMovementCategory;
    const reason = parseText(formData.get("reason"));
    const transactionNumber = parseText(formData.get("transactionNumber"));

    if (!movementId || quantity <= 0) {
      redirectWithStatus(path, "error", "Data stok masuk belum lengkap.");
    }

    await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.findUnique({ where: { id: movementId } });
      if (!movement || movement.movementType !== StockMovementType.STOCK_IN) {
        throw new Error("Transaksi stok masuk tidak ditemukan.");
      }

      const locationId = movement.destinationLocationId;
      if (!locationId) {
        throw new Error("Lokasi tujuan stok masuk tidak valid.");
      }

      const qtyDiff = quantity - Number(movement.quantity);
      await ensureStockCanApplyDelta(tx, { itemId: movement.itemId, locationId, delta: qtyDiff });

      await tx.stockMovement.update({
        where: { id: movement.id },
        data: {
          movementDate: parseDate(formData.get("movementDate")),
          quantity,
          category,
          reason,
          transactionNumber: transactionNumber ?? movement.transactionNumber,
        },
      });

      await adjustStockLevel(tx, { itemId: movement.itemId, locationId, delta: qtyDiff });

      await logActivity(tx, {
        userId: actorId,
        module: "STOCK_IN",
        action: "UPDATE",
        entity: "StockMovement",
        entityId: movement.id,
        details: `Mengubah stok masuk ${movement.transactionNumber}`,
      });
    });

    revalidateMovementRelatedPaths(path);
    redirectWithStatus(path, "success", "Transaksi stok masuk berhasil diperbarui.");
  } catch (error) {
    handleActionError(path, error, "Gagal memperbarui stok masuk.");
  }
}

export async function deleteStockInAction(formData: FormData) {
  const path = normalizePath(String(formData.get("redirectPath") ?? "/stock-movement/in"), "/stock-movement/in");

  try {
    const actorId = await getActiveAdminId();
    const movementId = String(formData.get("movementId") ?? "").trim();
    if (!movementId) {
      redirectWithStatus(path, "error", "Transaksi stok masuk tidak valid.");
    }

    await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.findUnique({ where: { id: movementId } });
      if (!movement || movement.movementType !== StockMovementType.STOCK_IN) {
        throw new Error("Transaksi stok masuk tidak ditemukan.");
      }

      const locationId = movement.destinationLocationId;
      if (!locationId) {
        throw new Error("Lokasi tujuan stok masuk tidak valid.");
      }

      const reverseDelta = -Number(movement.quantity);
      await ensureStockCanApplyDelta(tx, { itemId: movement.itemId, locationId, delta: reverseDelta });

      await adjustStockLevel(tx, { itemId: movement.itemId, locationId, delta: reverseDelta });
      await tx.stockMovement.delete({ where: { id: movement.id } });

      await logActivity(tx, {
        userId: actorId,
        module: "STOCK_IN",
        action: "DELETE",
        entity: "StockMovement",
        entityId: movement.id,
        details: `Menghapus stok masuk ${movement.transactionNumber}`,
      });
    });

    revalidateMovementRelatedPaths(path);
    redirectWithStatus(path, "success", "Transaksi stok masuk berhasil dihapus.");
  } catch (error) {
    handleActionError(path, error, "Gagal menghapus stok masuk.");
  }
}

export async function updateStockOutAction(formData: FormData) {
  const path = normalizePath(String(formData.get("redirectPath") ?? "/stock-movement/out"), "/stock-movement/out");

  try {
    const actorId = await getActiveAdminId();
    const movementId = String(formData.get("movementId") ?? "").trim();
    const quantity = parseNumber(formData.get("quantity"));
    const category = String(formData.get("category") ?? "PRODUCTION") as StockMovementCategory;
    const reason = parseText(formData.get("reason"));
    const transactionNumber = parseText(formData.get("transactionNumber"));

    if (!movementId || quantity <= 0) {
      redirectWithStatus(path, "error", "Data stok keluar belum lengkap.");
    }

    await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.findUnique({ where: { id: movementId } });
      if (!movement || movement.movementType !== StockMovementType.STOCK_OUT) {
        throw new Error("Transaksi stok keluar tidak ditemukan.");
      }

      const locationId = movement.sourceLocationId;
      if (!locationId) {
        throw new Error("Lokasi asal stok keluar tidak valid.");
      }

      const delta = Number(movement.quantity) - quantity;
      await ensureStockCanApplyDelta(tx, { itemId: movement.itemId, locationId, delta });

      await tx.stockMovement.update({
        where: { id: movement.id },
        data: {
          movementDate: parseDate(formData.get("movementDate")),
          quantity,
          category,
          reason,
          transactionNumber: transactionNumber ?? movement.transactionNumber,
        },
      });

      await adjustStockLevel(tx, { itemId: movement.itemId, locationId, delta });

      await logActivity(tx, {
        userId: actorId,
        module: "STOCK_OUT",
        action: "UPDATE",
        entity: "StockMovement",
        entityId: movement.id,
        details: `Mengubah stok keluar ${movement.transactionNumber}`,
      });
    });

    revalidateMovementRelatedPaths(path);
    redirectWithStatus(path, "success", "Transaksi stok keluar berhasil diperbarui.");
  } catch (error) {
    handleActionError(path, error, "Gagal memperbarui stok keluar.");
  }
}

export async function deleteStockOutAction(formData: FormData) {
  const path = normalizePath(String(formData.get("redirectPath") ?? "/stock-movement/out"), "/stock-movement/out");

  try {
    const actorId = await getActiveAdminId();
    const movementId = String(formData.get("movementId") ?? "").trim();
    if (!movementId) {
      redirectWithStatus(path, "error", "Transaksi stok keluar tidak valid.");
    }

    await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.findUnique({ where: { id: movementId } });
      if (!movement || movement.movementType !== StockMovementType.STOCK_OUT) {
        throw new Error("Transaksi stok keluar tidak ditemukan.");
      }

      const locationId = movement.sourceLocationId;
      if (!locationId) {
        throw new Error("Lokasi asal stok keluar tidak valid.");
      }

      await adjustStockLevel(tx, { itemId: movement.itemId, locationId, delta: Number(movement.quantity) });
      await tx.stockMovement.delete({ where: { id: movement.id } });

      await logActivity(tx, {
        userId: actorId,
        module: "STOCK_OUT",
        action: "DELETE",
        entity: "StockMovement",
        entityId: movement.id,
        details: `Menghapus stok keluar ${movement.transactionNumber}`,
      });
    });

    revalidateMovementRelatedPaths(path);
    redirectWithStatus(path, "success", "Transaksi stok keluar berhasil dihapus.");
  } catch (error) {
    handleActionError(path, error, "Gagal menghapus stok keluar.");
  }
}

export async function updateAdjustmentAction(formData: FormData) {
  const path = normalizePath(
    String(formData.get("redirectPath") ?? "/stock-movement/adjustments"),
    "/stock-movement/adjustments",
  );

  try {
    const actorId = await getActiveAdminId();
    const movementId = String(formData.get("movementId") ?? "").trim();
    const quantity = parseNumber(formData.get("quantity"));
    const direction = String(formData.get("direction") ?? "PLUS");
    const category = String(formData.get("category") ?? "ADJUSTMENT") as StockMovementCategory;
    const reason = parseText(formData.get("reason"));
    const transactionNumber = parseText(formData.get("transactionNumber"));

    if (!movementId || quantity <= 0) {
      redirectWithStatus(path, "error", "Data adjustment belum lengkap.");
    }

    await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.findUnique({ where: { id: movementId } });
      if (
        !movement ||
        (movement.movementType !== StockMovementType.ADJUSTMENT_PLUS &&
          movement.movementType !== StockMovementType.ADJUSTMENT_MINUS)
      ) {
        throw new Error("Transaksi adjustment tidak ditemukan.");
      }

      const locationId = movement.sourceLocationId ?? movement.destinationLocationId;
      if (!locationId) {
        throw new Error("Lokasi adjustment tidak valid.");
      }

      const oldDelta =
        movement.movementType === StockMovementType.ADJUSTMENT_PLUS ? Number(movement.quantity) : -Number(movement.quantity);
      const newDelta = direction === "PLUS" ? quantity : -quantity;
      const deltaChange = newDelta - oldDelta;

      await ensureStockCanApplyDelta(tx, { itemId: movement.itemId, locationId, delta: deltaChange });

      await tx.stockMovement.update({
        where: { id: movement.id },
        data: {
          movementDate: parseDate(formData.get("movementDate")),
          quantity,
          movementType: direction === "PLUS" ? StockMovementType.ADJUSTMENT_PLUS : StockMovementType.ADJUSTMENT_MINUS,
          category,
          reason,
          transactionNumber: transactionNumber ?? movement.transactionNumber,
        },
      });

      await adjustStockLevel(tx, { itemId: movement.itemId, locationId, delta: deltaChange });

      await logActivity(tx, {
        userId: actorId,
        module: "STOCK_ADJUSTMENT",
        action: "UPDATE",
        entity: "StockMovement",
        entityId: movement.id,
        details: `Mengubah adjustment ${movement.transactionNumber}`,
      });
    });

    revalidateMovementRelatedPaths(path);
    redirectWithStatus(path, "success", "Adjustment berhasil diperbarui.");
  } catch (error) {
    handleActionError(path, error, "Gagal memperbarui adjustment.");
  }
}

export async function deleteAdjustmentAction(formData: FormData) {
  const path = normalizePath(
    String(formData.get("redirectPath") ?? "/stock-movement/adjustments"),
    "/stock-movement/adjustments",
  );

  try {
    const actorId = await getActiveAdminId();
    const movementId = String(formData.get("movementId") ?? "").trim();
    if (!movementId) {
      redirectWithStatus(path, "error", "Transaksi adjustment tidak valid.");
    }

    await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.findUnique({ where: { id: movementId } });
      if (
        !movement ||
        (movement.movementType !== StockMovementType.ADJUSTMENT_PLUS &&
          movement.movementType !== StockMovementType.ADJUSTMENT_MINUS)
      ) {
        throw new Error("Transaksi adjustment tidak ditemukan.");
      }

      const locationId = movement.sourceLocationId ?? movement.destinationLocationId;
      if (!locationId) {
        throw new Error("Lokasi adjustment tidak valid.");
      }

      const oldDelta =
        movement.movementType === StockMovementType.ADJUSTMENT_PLUS ? Number(movement.quantity) : -Number(movement.quantity);
      const reverseDelta = -oldDelta;

      await ensureStockCanApplyDelta(tx, { itemId: movement.itemId, locationId, delta: reverseDelta });
      await adjustStockLevel(tx, { itemId: movement.itemId, locationId, delta: reverseDelta });
      await tx.stockMovement.delete({ where: { id: movement.id } });

      await logActivity(tx, {
        userId: actorId,
        module: "STOCK_ADJUSTMENT",
        action: "DELETE",
        entity: "StockMovement",
        entityId: movement.id,
        details: `Menghapus adjustment ${movement.transactionNumber}`,
      });
    });

    revalidateMovementRelatedPaths(path);
    redirectWithStatus(path, "success", "Adjustment berhasil dihapus.");
  } catch (error) {
    handleActionError(path, error, "Gagal menghapus adjustment.");
  }
}

export async function createTransferAction() {
  const path = "/stock-movement/transfers";

  try {
    await getActiveAdminId();
    redirectWithStatus(path, "error", "Fitur transfer dinonaktifkan karena sistem memakai satu toko (tanpa cabang).");
  } catch (error) {
    handleActionError(path, error, "Gagal membuat transfer.");
  }
}

export async function receiveTransferAction() {
  const path = "/stock-movement/transfers";

  try {
    await getActiveAdminId();
    redirectWithStatus(path, "error", "Fitur transfer dinonaktifkan karena sistem memakai satu toko (tanpa cabang).");
  } catch (error) {
    handleActionError(path, error, "Gagal menerima transfer.");
  }
}

export async function createAdjustmentAction(formData: FormData) {
  const path = "/stock-movement/adjustments";

  try {
    const inputById = await getActiveAdminId();
    const itemId = String(formData.get("itemId") ?? "");
    const defaultLocation = await getOrCreateDefaultLocation();
    const locationId = String(formData.get("locationId") ?? "").trim() || defaultLocation.id;
    const unitId = String(formData.get("unitId") ?? "");
    const quantity = parseNumber(formData.get("quantity"));
    const direction = String(formData.get("direction") ?? "PLUS");

    if (!itemId || !locationId || !unitId || quantity <= 0) {
      redirectWithStatus(path, "error", "Data penyesuaian belum lengkap.");
    }

    await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
        include: { unit: { select: { id: true, code: true, name: true } } },
      });
      if (!item || item.type !== ItemType.RAW_MATERIAL) {
        throw new Error("Penyesuaian hanya untuk bahan baku.");
      }

      const normalizedQty = await convertInputQuantityToItemUnit(tx, {
        item,
        inputUnitId: unitId,
        quantity,
      });

      if (direction === "MINUS") {
        const current = await tx.stockLevel.findUnique({
          where: { itemId_locationId: { itemId, locationId } },
        });
        if (Number(current?.quantity ?? 0) < normalizedQty.convertedQuantity) {
          throw new Error("Stok tidak cukup untuk penyesuaian kurang.");
        }
      }

      const transactionNumber =
        parseText(formData.get("transactionNumber")) ??
        (await getNextDocumentNumber(tx, "adjustment_stock", "ADJ"));

      const movementType = direction === "PLUS" ? StockMovementType.ADJUSTMENT_PLUS : StockMovementType.ADJUSTMENT_MINUS;

      const movement = await tx.stockMovement.create({
        data: {
          movementDate: parseDate(formData.get("movementDate")),
          movementType,
          category: (String(formData.get("category") ?? "ADJUSTMENT") as StockMovementCategory) ??
            StockMovementCategory.ADJUSTMENT,
          transactionNumber,
          referenceDocument: parseText(formData.get("referenceDocument")),
          itemId,
          quantity: normalizedQty.convertedQuantity,
          unitId: item.unitId,
          sourceLocationId: locationId,
          destinationLocationId: locationId,
          reason: parseText(formData.get("reason")) ?? "Penyesuaian manual",
          inputById,
          validationStatus: ValidationStatus.VALIDATED,
          validatedById: inputById,
          validatedAt: new Date(),
        },
      });

      await adjustStockLevel(tx, {
        itemId,
        locationId,
        delta: direction === "PLUS" ? normalizedQty.convertedQuantity : -normalizedQty.convertedQuantity,
      });

      await logActivity(tx, {
        userId: inputById,
        module: "STOCK_ADJUSTMENT",
        action: "CREATE",
        entity: "StockMovement",
        entityId: movement.id,
        details: normalizedQty.converted
          ? `Penyesuaian ${direction === "PLUS" ? "tambah" : "kurang"} ${transactionNumber} (${quantity} ${normalizedQty.inputUnit.name} -> ${normalizedQty.convertedQuantity} ${item.unit.name})`
          : `Penyesuaian ${direction === "PLUS" ? "tambah" : "kurang"} ${transactionNumber}`,
      });
    });

    revalidateMovementRelatedPaths(path);
    redirectWithStatus(path, "success", "Penyesuaian stok berhasil disimpan.");
  } catch (error) {
    handleActionError(path, error, "Gagal simpan penyesuaian.");
  }
}

export async function createOpnameAction(formData: FormData) {
  const path = "/stock-opname/create";

  try {
    const officerId = await getActiveAdminId();
    const defaultLocation = await getOrCreateDefaultLocation();
    const locationId = defaultLocation.id;

    await prisma.$transaction(async (tx) => {
      const documentNumber =
        parseText(formData.get("documentNumber")) ?? (await getNextDocumentNumber(tx, "stock_opname", "OPN"));

      const opname = await tx.stockOpname.create({
        data: {
          documentNumber,
          opnameDate: parseDate(formData.get("opnameDate")),
          locationId,
          officerId,
          notes: parseText(formData.get("notes")),
          status: StockOpnameStatus.DRAFT,
        },
      });

      await logActivity(tx, {
        userId: officerId,
        module: "STOCK_OPNAME",
        action: "CREATE",
        entity: "StockOpname",
        entityId: opname.id,
        details: `Membuat dokumen opname ${opname.documentNumber}`,
      });
    });

    revalidatePath(path);
    revalidatePath("/stock-opname/process");
    revalidatePath("/onboarding");
    redirectWithStatus(path, "success", "Dokumen stock opname berhasil dibuat.");
  } catch (error) {
    handleActionError(path, error, "Gagal membuat opname.");
  }
}

export async function updateOpnameAction(formData: FormData) {
  const path = normalizePath(String(formData.get("redirectPath") ?? "/stock-opname/create"), "/stock-opname/create");

  try {
    const actorId = await getActiveAdminId();
    const opnameId = String(formData.get("opnameId") ?? "").trim();
    const documentNumber = String(formData.get("documentNumber") ?? "").trim();

    if (!opnameId || documentNumber.length < 3) {
      redirectWithStatus(path, "error", "Data dokumen opname belum lengkap.");
    }

    await prisma.$transaction(async (tx) => {
      const opname = await tx.stockOpname.findUnique({ where: { id: opnameId } });
      if (!opname) {
        throw new Error("Dokumen opname tidak ditemukan.");
      }

      if (opname.status !== StockOpnameStatus.DRAFT) {
        throw new Error("Hanya dokumen draft yang bisa diedit.");
      }

      const exists = await tx.stockOpname.findFirst({
        where: {
          id: { not: opnameId },
          documentNumber,
        },
      });

      if (exists) {
        throw new Error("Nomor dokumen sudah dipakai.");
      }

      const updated = await tx.stockOpname.update({
        where: { id: opnameId },
        data: {
          documentNumber,
          opnameDate: parseDate(formData.get("opnameDate")),
          notes: parseText(formData.get("notes")),
        },
      });

      await logActivity(tx, {
        userId: actorId,
        module: "STOCK_OPNAME",
        action: "UPDATE",
        entity: "StockOpname",
        entityId: updated.id,
        details: `Mengubah dokumen opname ${updated.documentNumber}`,
      });
    });

    revalidatePath("/stock-opname/create");
    revalidatePath("/stock-opname/process");
    revalidatePath("/onboarding");
    redirectWithStatus(path, "success", "Dokumen opname berhasil diperbarui.");
  } catch (error) {
    handleActionError(path, error, "Gagal memperbarui dokumen opname.");
  }
}

export async function deleteOpnameAction(formData: FormData) {
  const path = normalizePath(String(formData.get("redirectPath") ?? "/stock-opname/create"), "/stock-opname/create");

  try {
    const actorId = await getActiveAdminId();
    const opnameId = String(formData.get("opnameId") ?? "").trim();

    if (!opnameId) {
      redirectWithStatus(path, "error", "Dokumen opname tidak valid.");
    }

    await prisma.$transaction(async (tx) => {
      const opname = await tx.stockOpname.findUnique({ where: { id: opnameId } });
      if (!opname) {
        throw new Error("Dokumen opname tidak ditemukan.");
      }

      if (opname.status !== StockOpnameStatus.DRAFT) {
        throw new Error("Hanya dokumen draft yang bisa dihapus.");
      }

      await tx.stockOpname.delete({ where: { id: opnameId } });

      await logActivity(tx, {
        userId: actorId,
        module: "STOCK_OPNAME",
        action: "DELETE",
        entity: "StockOpname",
        entityId: opname.id,
        details: `Menghapus dokumen opname ${opname.documentNumber}`,
      });
    });

    revalidatePath("/stock-opname/create");
    revalidatePath("/stock-opname/process");
    revalidatePath("/onboarding");
    redirectWithStatus(path, "success", "Dokumen opname berhasil dihapus.");
  } catch (error) {
    handleActionError(path, error, "Gagal menghapus dokumen opname.");
  }
}

export async function upsertOpnameItemAction(formData: FormData) {
  const opnameId = String(formData.get("opnameId") ?? "");
  const path = `/stock-opname/process?id=${opnameId}`;

  try {
    await getActiveAdminId();
    const itemId = String(formData.get("itemId") ?? "");
    const physicalStock = parseNumber(formData.get("physicalStock"));

    if (!opnameId || !itemId || physicalStock < 0) {
      redirectWithStatus(path, "error", "Data item opname belum lengkap.");
    }

    await prisma.$transaction(async (tx) => {
      const opname = await tx.stockOpname.findUnique({ where: { id: opnameId } });
      if (!opname) {
        throw new Error("Dokumen opname tidak ditemukan.");
      }

      if (opname.status !== StockOpnameStatus.DRAFT) {
        throw new Error("Hanya dokumen draft yang bisa diedit.");
      }

      const item = await tx.item.findUnique({ where: { id: itemId } });
      if (!item || item.type !== ItemType.RAW_MATERIAL) {
        throw new Error("Item opname harus bahan baku.");
      }

      const currentStock = await tx.stockLevel.findUnique({
        where: {
          itemId_locationId: {
            itemId,
            locationId: opname.locationId,
          },
        },
      });

      const systemStock = Number(currentStock?.quantity ?? 0);
      const difference = physicalStock - systemStock;

      const opnameItem = await tx.stockOpnameItem.upsert({
        where: {
          stockOpnameId_itemId: {
            stockOpnameId: opnameId,
            itemId,
          },
        },
        update: {
          systemStock,
          physicalStock,
          difference,
          note: parseText(formData.get("note")),
        },
        create: {
          stockOpnameId: opnameId,
          itemId,
          systemStock,
          physicalStock,
          difference,
          note: parseText(formData.get("note")),
        },
      });

      await logActivity(tx, {
        userId: opname.officerId,
        module: "STOCK_OPNAME",
        action: "INPUT_ITEM",
        entity: "StockOpnameItem",
        entityId: opnameItem.id,
        details: `Input item opname (${opnameItem.itemId})`,
      });
    });

    revalidatePath("/stock-opname/process");
    revalidatePath(path);
    revalidatePath("/onboarding");
    redirectWithStatus(path, "success", "Item opname berhasil disimpan.");
  } catch (error) {
    handleActionError(path, error, "Gagal simpan item opname.");
  }
}

export async function updateOpnameItemAction(formData: FormData) {
  const fallbackPath = "/stock-opname/process";
  const path = normalizePath(String(formData.get("redirectPath") ?? fallbackPath), fallbackPath);

  try {
    const actorId = await getActiveAdminId();
    const opnameItemId = String(formData.get("opnameItemId") ?? "").trim();
    const physicalStock = parseNumber(formData.get("physicalStock"));

    if (!opnameItemId || physicalStock < 0) {
      redirectWithStatus(path, "error", "Data item opname belum lengkap.");
    }

    await prisma.$transaction(async (tx) => {
      const opnameItem = await tx.stockOpnameItem.findUnique({
        where: { id: opnameItemId },
        include: {
          stockOpname: true,
          item: true,
        },
      });

      if (!opnameItem) {
        throw new Error("Item opname tidak ditemukan.");
      }

      if (opnameItem.stockOpname.status !== StockOpnameStatus.DRAFT) {
        throw new Error("Hanya item dari dokumen draft yang bisa diedit.");
      }

      const currentStock = await tx.stockLevel.findUnique({
        where: {
          itemId_locationId: {
            itemId: opnameItem.itemId,
            locationId: opnameItem.stockOpname.locationId,
          },
        },
      });

      const systemStock = Number(currentStock?.quantity ?? 0);
      const difference = physicalStock - systemStock;

      await tx.stockOpnameItem.update({
        where: { id: opnameItem.id },
        data: {
          systemStock,
          physicalStock,
          difference,
          note: parseText(formData.get("note")),
        },
      });

      await logActivity(tx, {
        userId: actorId,
        module: "STOCK_OPNAME",
        action: "UPDATE_ITEM",
        entity: "StockOpnameItem",
        entityId: opnameItem.id,
        details: `Mengubah item opname ${opnameItem.item.name}`,
      });
    });

    revalidatePath("/stock-opname/process");
    revalidatePath(path);
    revalidatePath("/onboarding");
    redirectWithStatus(path, "success", "Item opname berhasil diperbarui.");
  } catch (error) {
    handleActionError(path, error, "Gagal memperbarui item opname.");
  }
}

export async function deleteOpnameItemAction(formData: FormData) {
  const fallbackPath = "/stock-opname/process";
  const path = normalizePath(String(formData.get("redirectPath") ?? fallbackPath), fallbackPath);

  try {
    const actorId = await getActiveAdminId();
    const opnameItemId = String(formData.get("opnameItemId") ?? "").trim();

    if (!opnameItemId) {
      redirectWithStatus(path, "error", "Item opname tidak valid.");
    }

    await prisma.$transaction(async (tx) => {
      const opnameItem = await tx.stockOpnameItem.findUnique({
        where: { id: opnameItemId },
        include: {
          stockOpname: true,
          item: true,
        },
      });

      if (!opnameItem) {
        throw new Error("Item opname tidak ditemukan.");
      }

      if (opnameItem.stockOpname.status !== StockOpnameStatus.DRAFT) {
        throw new Error("Hanya item dari dokumen draft yang bisa dihapus.");
      }

      await tx.stockOpnameItem.delete({ where: { id: opnameItem.id } });

      await logActivity(tx, {
        userId: actorId,
        module: "STOCK_OPNAME",
        action: "DELETE_ITEM",
        entity: "StockOpnameItem",
        entityId: opnameItem.id,
        details: `Menghapus item opname ${opnameItem.item.name}`,
      });
    });

    revalidatePath("/stock-opname/process");
    revalidatePath(path);
    revalidatePath("/onboarding");
    redirectWithStatus(path, "success", "Item opname berhasil dihapus.");
  } catch (error) {
    handleActionError(path, error, "Gagal menghapus item opname.");
  }
}

export async function submitOpnameAction(formData: FormData) {
  const opnameId = String(formData.get("opnameId") ?? "");
  const path = `/stock-opname/process?id=${opnameId}`;

  try {
    const actorId = await getActiveAdminId();

    if (!opnameId) {
      redirectWithStatus("/stock-opname/process", "error", "Dokumen opname tidak valid.");
    }

    await prisma.$transaction(async (tx) => {
      const opname = await tx.stockOpname.findUnique({
        where: { id: opnameId },
        include: { items: { include: { item: true } } },
      });

      if (!opname) {
        throw new Error("Dokumen opname tidak ditemukan.");
      }

      if (opname.items.length === 0) {
        throw new Error("Isi minimal 1 item sebelum submit.");
      }

      if (opname.status !== StockOpnameStatus.DRAFT) {
        throw new Error("Dokumen ini sudah diproses.");
      }

      const adjustmentNumber = await getNextDocumentNumber(tx, "opname_adjustment", "OPA");

      for (const item of opname.items) {
        if (item.item.type !== ItemType.RAW_MATERIAL) continue;

        const difference = Number(item.difference);
        if (difference !== 0) {
          await tx.stockMovement.create({
            data: {
              movementDate: new Date(),
              movementType: difference > 0 ? StockMovementType.ADJUSTMENT_PLUS : StockMovementType.ADJUSTMENT_MINUS,
              category: StockMovementCategory.OPNAME,
              transactionNumber: adjustmentNumber,
              referenceDocument: opname.documentNumber,
              itemId: item.itemId,
              quantity: Math.abs(difference),
              unitId: item.item.unitId,
              sourceLocationId: opname.locationId,
              destinationLocationId: opname.locationId,
              reason: "Penyesuaian otomatis dari stock opname",
              inputById: actorId,
              validationStatus: ValidationStatus.VALIDATED,
              validatedById: actorId,
              validatedAt: new Date(),
              stockOpnameId: opname.id,
            },
          });
        }

        await adjustStockLevel(tx, {
          itemId: item.itemId,
          locationId: opname.locationId,
          delta: difference,
          setLastOpnameAt: true,
        });
      }

      await tx.stockOpname.update({
        where: { id: opname.id },
        data: {
          status: StockOpnameStatus.APPROVED,
          submittedAt: new Date(),
          approvedAt: new Date(),
          approvedById: actorId,
        },
      });

      await logActivity(tx, {
        userId: actorId,
        module: "STOCK_OPNAME",
        action: "SUBMIT_AUTO_APPROVE",
        entity: "StockOpname",
        entityId: opname.id,
        details: `Submit dan auto-approve dokumen ${opname.documentNumber}`,
      });
    });

    revalidatePath("/stock-opname/process");
    revalidatePath("/stock-opname/history");
    revalidatePath("/onboarding");
    revalidatePath("/dashboard");
    revalidatePath("/reports/opname");
    redirectWithStatus("/stock-opname/history", "success", "Dokumen opname berhasil diproses dan stok diperbarui.");
  } catch (error) {
    handleActionError(path, error, "Gagal submit opname.");
  }
}
