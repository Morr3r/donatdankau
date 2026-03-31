import { prisma, type TxClient } from "@/lib/db";
import { getOrCreateDefaultLocation } from "@/lib/location";

type JsonPayload = string | number | boolean | Array<JsonPayload | null> | { [key: string]: JsonPayload | null };

export function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  if (value === null || value === "") return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

export function parseText(value: FormDataEntryValue | null) {
  if (value === null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

export async function getSystemUserId() {
  const existingUser = await prisma.appUser.findFirst({ orderBy: { createdAt: "asc" } });

  if (existingUser) return existingUser.id;

  const defaultLocation = await getOrCreateDefaultLocation();

  const user = await prisma.appUser.create({
    data: {
      name: "System Admin",
      username: "system",
      email: "system@donatdankau.local",
      role: "ADMIN",
      locationId: defaultLocation?.id,
    },
  });

  return user.id;
}

export async function getNextDocumentNumber(tx: TxClient, key: string, prefix: string) {
  const counter = await tx.counter.upsert({
    where: { key },
    update: { value: { increment: 1 } },
    create: { key, value: 1 },
  });

  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}-${datePart}-${String(counter.value).padStart(4, "0")}`;
}

export async function logActivity(
  tx: TxClient,
  payload: {
    userId?: string | null;
    module: string;
    action: string;
    entity?: string;
    entityId?: string;
    details?: string;
    metadata?: JsonPayload;
  },
) {
  await tx.activityLog.create({
    data: {
      userId: payload.userId ?? null,
      module: payload.module,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId,
      details: payload.details,
      metadata: payload.metadata,
    },
  });
}

export async function adjustStockLevel(
  tx: TxClient,
  payload: {
    itemId: string;
    locationId: string;
    delta: number;
    setLastOpnameAt?: boolean;
  },
) {
  const current = await tx.stockLevel.findUnique({
    where: { itemId_locationId: { itemId: payload.itemId, locationId: payload.locationId } },
  });

  const currentQty = current ? Number(current.quantity) : 0;
  const nextQty = currentQty + payload.delta;

  await tx.stockLevel.upsert({
    where: { itemId_locationId: { itemId: payload.itemId, locationId: payload.locationId } },
    update: {
      quantity: nextQty,
      ...(payload.setLastOpnameAt ? { lastOpnameAt: new Date() } : {}),
    },
    create: {
      itemId: payload.itemId,
      locationId: payload.locationId,
      quantity: nextQty,
      ...(payload.setLastOpnameAt ? { lastOpnameAt: new Date() } : {}),
    },
  });
}

