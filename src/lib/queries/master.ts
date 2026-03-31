import { ItemType } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function getMasterPageData(entity: string) {
  switch (entity) {
    case "raw-materials": {
      const [items, units] = await Promise.all([
        prisma.item.findMany({
          where: { type: ItemType.RAW_MATERIAL, isActive: true },
          include: { unit: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.unit.findMany({ orderBy: { name: "asc" } }),
      ]);
      return { items, units };
    }
    case "units": {
      const units = await prisma.unit.findMany({ orderBy: { createdAt: "desc" } });
      return { units };
    }
    case "suppliers": {
      const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: "desc" } });
      return { suppliers };
    }
    case "register": {
      const users = await prisma.appUser.findMany({
        where: { role: "ADMIN" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return { users };
    }
    default:
      return null;
  }
}
