import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

const DEFAULT_LOCATION_CODE = "CABANG-UTAMA";
const DEFAULT_LOCATION_NAME = "Toko Donat Dankau";
const DEFAULT_LOCATION_TYPE = "STORE";

export async function getOrCreateDefaultLocation() {
  return prisma.location.upsert({
    where: { code: DEFAULT_LOCATION_CODE },
    update: {
      name: DEFAULT_LOCATION_NAME,
      type: DEFAULT_LOCATION_TYPE,
      isActive: true,
    },
    create: {
      code: DEFAULT_LOCATION_CODE,
      name: DEFAULT_LOCATION_NAME,
      type: DEFAULT_LOCATION_TYPE,
      isActive: true,
    },
  });
}

export async function getOrCreateDefaultLocationInTx(tx: Prisma.TransactionClient) {
  return tx.location.upsert({
    where: { code: DEFAULT_LOCATION_CODE },
    update: {
      name: DEFAULT_LOCATION_NAME,
      type: DEFAULT_LOCATION_TYPE,
      isActive: true,
    },
    create: {
      code: DEFAULT_LOCATION_CODE,
      name: DEFAULT_LOCATION_NAME,
      type: DEFAULT_LOCATION_TYPE,
      isActive: true,
    },
  });
}
