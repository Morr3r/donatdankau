"use server";

import { ItemType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logActivity, parseNumber, parseText } from "@/lib/actions/shared";

function redirectWithStatus(path: string, key: "success" | "error", message: string): never {
  const target = `${path}?${key}=${encodeURIComponent(message)}`;
  redirect(target);
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
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (["P1000", "P1001", "P1010"].includes(error.code)) {
      return "Koneksi database sedang bermasalah. Coba lagi beberapa detik lagi.";
    }

    if (error.code === "P2002") {
      return "Data duplikat terdeteksi. Gunakan nilai yang berbeda.";
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "Koneksi database gagal diinisialisasi. Cek DATABASE_URL dan restart server.";
  }

  return fallback;
}

function handleActionError(path: string, error: unknown, fallback: string): never {
  if (isRedirectError(error)) {
    throw error;
  }

  redirectWithStatus(path, "error", getActionErrorMessage(error, fallback));
}

function revalidateOnboardingChecklist() {
  revalidatePath("/onboarding");
}

async function getActorId() {
  const authUser = await getAuthUser();
  if (!authUser) {
    redirect("/auth/login");
  }
  return authUser.id;
}

export async function createUnitAction(formData: FormData) {
  const requestedPath = parseText(formData.get("redirectPath"));
  const path = requestedPath && requestedPath.startsWith("/") ? requestedPath : "/master/units";
  try {
    const userId = await getActorId();
    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    const name = String(formData.get("name") ?? "").trim();

    if (code.length < 1 || name.length < 1) {
      redirectWithStatus(path, "error", "Kode dan nama satuan minimal 1 karakter.");
    }

    await prisma.$transaction(async (tx) => {
      const exists = await tx.unit.findFirst({ where: { OR: [{ code }, { name }] } });
      if (exists) {
        throw new Error("Kode atau nama satuan sudah dipakai.");
      }

      const unit = await tx.unit.create({ data: { code, name } });
      await logActivity(tx, {
        userId,
        module: "MASTER_UNIT",
        action: "CREATE",
        entity: "Unit",
        entityId: unit.id,
        details: `Menambah satuan ${unit.name}`,
      });
    });

    revalidatePath(path);
    revalidatePath("/master/units");
    revalidateOnboardingChecklist();
    redirectWithStatus(path, "success", "Satuan berhasil ditambahkan.");
  } catch (error) {
    handleActionError(path, error, "Gagal menambah satuan.");
  }
}

export async function updateUnitAction(formData: FormData) {
  const requestedPath = parseText(formData.get("redirectPath"));
  const path = requestedPath && requestedPath.startsWith("/") ? requestedPath : "/master/units";

  try {
    const userId = await getActorId();
    const unitId = String(formData.get("unitId") ?? "").trim();
    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    const name = String(formData.get("name") ?? "").trim();

    if (!unitId || code.length < 1 || name.length < 1) {
      redirectWithStatus(path, "error", "Data satuan belum lengkap.");
    }

    await prisma.$transaction(async (tx) => {
      const unit = await tx.unit.findUnique({ where: { id: unitId } });
      if (!unit) {
        throw new Error("Satuan tidak ditemukan.");
      }

      const exists = await tx.unit.findFirst({
        where: {
          id: { not: unitId },
          OR: [{ code }, { name }],
        },
      });

      if (exists) {
        throw new Error("Kode atau nama satuan sudah dipakai.");
      }

      const updated = await tx.unit.update({
        where: { id: unitId },
        data: { code, name },
      });

      await logActivity(tx, {
        userId,
        module: "MASTER_UNIT",
        action: "UPDATE",
        entity: "Unit",
        entityId: updated.id,
        details: `Mengubah satuan ${updated.name}`,
      });
    });

    revalidatePath(path);
    revalidatePath("/master/units");
    revalidatePath("/master/raw-materials");
    revalidateOnboardingChecklist();
    redirectWithStatus(path, "success", "Satuan berhasil diperbarui.");
  } catch (error) {
    handleActionError(path, error, "Gagal memperbarui satuan.");
  }
}

export async function deleteUnitAction(formData: FormData) {
  const requestedPath = parseText(formData.get("redirectPath"));
  const path = requestedPath && requestedPath.startsWith("/") ? requestedPath : "/master/units";

  try {
    const userId = await getActorId();
    const unitId = String(formData.get("unitId") ?? "").trim();

    if (!unitId) {
      redirectWithStatus(path, "error", "Satuan tidak valid.");
    }

    await prisma.$transaction(async (tx) => {
      const unit = await tx.unit.findUnique({
        where: { id: unitId },
        include: { _count: { select: { items: true, stockMovement: true } } },
      });

      if (!unit) {
        throw new Error("Satuan tidak ditemukan.");
      }

      if (unit._count.items > 0 || unit._count.stockMovement > 0) {
        throw new Error("Satuan masih dipakai data lain dan tidak bisa dihapus.");
      }

      await tx.unit.delete({ where: { id: unitId } });

      await logActivity(tx, {
        userId,
        module: "MASTER_UNIT",
        action: "DELETE",
        entity: "Unit",
        entityId: unitId,
        details: `Menghapus satuan ${unit.name}`,
      });
    });

    revalidatePath(path);
    revalidatePath("/master/units");
    revalidatePath("/master/raw-materials");
    revalidateOnboardingChecklist();
    redirectWithStatus(path, "success", "Satuan berhasil dihapus.");
  } catch (error) {
    handleActionError(path, error, "Gagal menghapus satuan.");
  }
}

export async function createSupplierAction(formData: FormData) {
  const path = "/master/suppliers";
  try {
    const userId = await getActorId();
    const name = String(formData.get("name") ?? "").trim();

    if (name.length < 3) {
      redirectWithStatus(path, "error", "Nama supplier minimal 3 karakter.");
    }

    await prisma.$transaction(async (tx) => {
      const exists = await tx.supplier.findFirst({ where: { name } });
      if (exists) {
        throw new Error("Nama supplier sudah dipakai.");
      }

      const supplier = await tx.supplier.create({
        data: {
          name,
          contact: parseText(formData.get("contact")),
          address: parseText(formData.get("address")),
          suppliedProduct: parseText(formData.get("suppliedProduct")),
          isActive: String(formData.get("isActive") ?? "on") === "on",
        },
      });

      await logActivity(tx, {
        userId,
        module: "MASTER_SUPPLIER",
        action: "CREATE",
        entity: "Supplier",
        entityId: supplier.id,
        details: `Menambah supplier ${supplier.name}`,
      });
    });

    revalidatePath(path);
    revalidateOnboardingChecklist();
    redirectWithStatus(path, "success", "Supplier berhasil ditambahkan.");
  } catch (error) {
    handleActionError(path, error, "Gagal menambah supplier.");
  }
}

export async function updateSupplierAction(formData: FormData) {
  const requestedPath = parseText(formData.get("redirectPath"));
  const path = requestedPath && requestedPath.startsWith("/") ? requestedPath : "/master/suppliers";

  try {
    const userId = await getActorId();
    const supplierId = String(formData.get("supplierId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();

    if (!supplierId || name.length < 3) {
      redirectWithStatus(path, "error", "Data supplier belum lengkap.");
    }

    await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier) {
        throw new Error("Supplier tidak ditemukan.");
      }

      const exists = await tx.supplier.findFirst({
        where: {
          id: { not: supplierId },
          name,
        },
      });

      if (exists) {
        throw new Error("Nama supplier sudah dipakai.");
      }

      const updated = await tx.supplier.update({
        where: { id: supplierId },
        data: {
          name,
          contact: parseText(formData.get("contact")),
          address: parseText(formData.get("address")),
          suppliedProduct: parseText(formData.get("suppliedProduct")),
          isActive: String(formData.get("isActive") ?? "on") === "on",
        },
      });

      await logActivity(tx, {
        userId,
        module: "MASTER_SUPPLIER",
        action: "UPDATE",
        entity: "Supplier",
        entityId: updated.id,
        details: `Mengubah supplier ${updated.name}`,
      });
    });

    revalidatePath(path);
    revalidatePath("/master/suppliers");
    revalidatePath("/stock-movement/in");
    revalidateOnboardingChecklist();
    redirectWithStatus(path, "success", "Supplier berhasil diperbarui.");
  } catch (error) {
    handleActionError(path, error, "Gagal memperbarui supplier.");
  }
}

export async function deleteSupplierAction(formData: FormData) {
  const requestedPath = parseText(formData.get("redirectPath"));
  const path = requestedPath && requestedPath.startsWith("/") ? requestedPath : "/master/suppliers";

  try {
    const userId = await getActorId();
    const supplierId = String(formData.get("supplierId") ?? "").trim();

    if (!supplierId) {
      redirectWithStatus(path, "error", "Supplier tidak valid.");
    }

    await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
      if (!supplier) {
        throw new Error("Supplier tidak ditemukan.");
      }

      await tx.supplier.update({
        where: { id: supplierId },
        data: { isActive: false },
      });

      await logActivity(tx, {
        userId,
        module: "MASTER_SUPPLIER",
        action: "DELETE",
        entity: "Supplier",
        entityId: supplierId,
        details: `Menonaktifkan supplier ${supplier.name}`,
      });
    });

    revalidatePath(path);
    revalidatePath("/master/suppliers");
    revalidatePath("/stock-movement/in");
    revalidateOnboardingChecklist();
    redirectWithStatus(path, "success", "Supplier berhasil dihapus.");
  } catch (error) {
    handleActionError(path, error, "Gagal menghapus supplier.");
  }
}

export async function createLocationAction(formData: FormData) {
  const path = "/master/locations";
  try {
    const userId = await getActorId();
    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    const name = String(formData.get("name") ?? "").trim();
    const type = String(formData.get("type") ?? "").trim();

    if (code.length < 3 || name.length < 3 || !type) {
      redirectWithStatus(path, "error", "Kode, nama, dan tipe lokasi wajib valid.");
    }

    await prisma.$transaction(async (tx) => {
      const exists = await tx.location.findFirst({ where: { OR: [{ code }, { name }] } });
      if (exists) {
        throw new Error("Kode atau nama lokasi sudah dipakai.");
      }

      const location = await tx.location.create({
        data: {
          code,
          name,
          type,
          address: parseText(formData.get("address")),
          isActive: String(formData.get("isActive") ?? "on") === "on",
        },
      });

      await logActivity(tx, {
        userId,
        module: "MASTER_LOCATION",
        action: "CREATE",
        entity: "Location",
        entityId: location.id,
        details: `Menambah lokasi ${location.name}`,
      });
    });

    revalidatePath(path);
    revalidateOnboardingChecklist();
    redirectWithStatus(path, "success", "Lokasi berhasil ditambahkan.");
  } catch (error) {
    handleActionError(path, error, "Gagal menambah lokasi.");
  }
}

export async function createItemAction(formData: FormData) {
  const path = "/master/raw-materials";

  try {
    const actorId = await getActorId();
    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const unitId = String(formData.get("unitId") ?? "").trim();

    if (!code || !name || !category || !unitId) {
      redirectWithStatus(path, "error", "Data bahan baku belum lengkap.");
    }

    const minStock = parseNumber(formData.get("minStock"), 0);
    const standardCost = parseNumber(formData.get("standardCost"), 0);
    const shelfLifeDays = parseNumber(formData.get("shelfLifeDays"), 0);

    if (minStock < 0 || standardCost < 0 || shelfLifeDays < 0) {
      redirectWithStatus(path, "error", "Harga standar, stok minimum, dan masa simpan tidak boleh negatif.");
    }

    await prisma.$transaction(async (tx) => {
      const exists = await tx.item.findFirst({ where: { OR: [{ code }, { name }] } });
      if (exists) {
        throw new Error("Kode atau nama bahan baku sudah dipakai.");
      }

      const item = await tx.item.create({
        data: {
          code,
          name,
          type: ItemType.RAW_MATERIAL,
          category,
          unitId,
          standardCost,
          minStock,
          shelfLifeDays: shelfLifeDays > 0 ? shelfLifeDays : null,
          supplierId: parseText(formData.get("supplierId")),
          isActive: String(formData.get("isActive") ?? "on") === "on",
        },
      });

      await logActivity(tx, {
        userId: actorId,
        module: "MASTER_ITEM",
        action: "CREATE",
        entity: "Item",
        entityId: item.id,
        details: `Menambah bahan baku ${item.name}`,
        metadata: { type: ItemType.RAW_MATERIAL },
      });
    });

    revalidatePath(path);
    revalidatePath("/reports/current-stock");
    revalidateOnboardingChecklist();
    redirectWithStatus(path, "success", "Bahan baku berhasil ditambahkan.");
  } catch (error) {
    handleActionError(path, error, "Gagal menambah bahan baku.");
  }
}

export async function updateItemAction(formData: FormData) {
  const requestedPath = parseText(formData.get("redirectPath"));
  const path = requestedPath && requestedPath.startsWith("/") ? requestedPath : "/master/raw-materials";

  try {
    const actorId = await getActorId();
    const itemId = String(formData.get("itemId") ?? "").trim();
    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const unitId = String(formData.get("unitId") ?? "").trim();

    if (!itemId || !code || !name || !category || !unitId) {
      redirectWithStatus(path, "error", "Data bahan baku belum lengkap.");
    }

    const minStock = parseNumber(formData.get("minStock"), 0);
    const standardCost = parseNumber(formData.get("standardCost"), 0);
    const shelfLifeDays = parseNumber(formData.get("shelfLifeDays"), 0);

    if (minStock < 0 || standardCost < 0 || shelfLifeDays < 0) {
      redirectWithStatus(path, "error", "Harga standar, stok minimum, dan masa simpan tidak boleh negatif.");
    }

    await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: itemId } });
      if (!item || item.type !== ItemType.RAW_MATERIAL) {
        throw new Error("Bahan baku tidak ditemukan.");
      }

      const exists = await tx.item.findFirst({
        where: {
          id: { not: itemId },
          OR: [{ code }, { name }],
        },
      });

      if (exists) {
        throw new Error("Kode atau nama bahan baku sudah dipakai.");
      }

      const updated = await tx.item.update({
        where: { id: itemId },
        data: {
          code,
          name,
          category,
          unitId,
          standardCost,
          minStock,
          shelfLifeDays: shelfLifeDays > 0 ? shelfLifeDays : null,
          isActive: String(formData.get("isActive") ?? "on") === "on",
        },
      });

      await logActivity(tx, {
        userId: actorId,
        module: "MASTER_ITEM",
        action: "UPDATE",
        entity: "Item",
        entityId: updated.id,
        details: `Mengubah bahan baku ${updated.name}`,
      });
    });

    revalidatePath(path);
    revalidatePath("/master/raw-materials");
    revalidatePath("/stock-movement/in");
    revalidatePath("/stock-movement/out");
    revalidateOnboardingChecklist();
    redirectWithStatus(path, "success", "Bahan baku berhasil diperbarui.");
  } catch (error) {
    handleActionError(path, error, "Gagal memperbarui bahan baku.");
  }
}

export async function deleteItemAction(formData: FormData) {
  const requestedPath = parseText(formData.get("redirectPath"));
  const path = requestedPath && requestedPath.startsWith("/") ? requestedPath : "/master/raw-materials";

  try {
    const actorId = await getActorId();
    const itemId = String(formData.get("itemId") ?? "").trim();

    if (!itemId) {
      redirectWithStatus(path, "error", "Bahan baku tidak valid.");
    }

    await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: itemId } });
      if (!item || item.type !== ItemType.RAW_MATERIAL) {
        throw new Error("Bahan baku tidak ditemukan.");
      }

      await tx.item.update({
        where: { id: itemId },
        data: { isActive: false },
      });

      await logActivity(tx, {
        userId: actorId,
        module: "MASTER_ITEM",
        action: "DELETE",
        entity: "Item",
        entityId: itemId,
        details: `Menonaktifkan bahan baku ${item.name}`,
      });
    });

    revalidatePath(path);
    revalidatePath("/master/raw-materials");
    revalidatePath("/stock-movement/in");
    revalidatePath("/stock-movement/out");
    revalidateOnboardingChecklist();
    redirectWithStatus(path, "success", "Bahan baku berhasil dihapus.");
  } catch (error) {
    handleActionError(path, error, "Gagal menghapus bahan baku.");
  }
}
