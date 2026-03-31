import { prisma } from "@/lib/db";

export type ActivityLogQueryInput = {
  userId?: string;
  action?: string;
  q?: string;
  limit?: string;
};

type CrudAction = "CREATE" | "UPDATE" | "DELETE";
type ActionFilter = "CRUD" | "ALL" | CrudAction;

const CRUD_ACTIONS: CrudAction[] = ["CREATE", "UPDATE", "DELETE"];

function normalizeAction(value?: string) {
  if (!value) return "CRUD" as ActionFilter;
  if (value === "ALL") return "ALL" as ActionFilter;
  if (value === "CRUD") return "CRUD" as ActionFilter;

  const upper = value.toUpperCase();
  if (CRUD_ACTIONS.includes(upper as CrudAction)) return upper as ActionFilter;
  return "CRUD" as ActionFilter;
}

function normalizeLimit(value?: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 200;
  if (parsed < 50) return 50;
  if (parsed > 500) return 500;
  return Math.floor(parsed);
}

export async function getActivityLogData(input?: ActivityLogQueryInput) {
  const action = normalizeAction(input?.action);
  const userId = (input?.userId ?? "").trim();
  const keyword = (input?.q ?? "").trim();
  const take = normalizeLimit(input?.limit);

  const where = {
    ...(action === "ALL" ? {} : action === "CRUD" ? { action: { in: CRUD_ACTIONS } } : { action }),
    ...(userId ? { userId } : {}),
    ...(keyword
      ? {
          OR: [
            { module: { contains: keyword, mode: "insensitive" as const } },
            { entity: { contains: keyword, mode: "insensitive" as const } },
            { details: { contains: keyword, mode: "insensitive" as const } },
            {
              user: {
                is: {
                  OR: [
                    { name: { contains: keyword, mode: "insensitive" as const } },
                    { username: { contains: keyword, mode: "insensitive" as const } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const [rows, allUsers] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.appUser.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true, name: true, username: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const summary = rows.reduce(
    (acc, row) => {
      if (row.action === "CREATE") acc.create += 1;
      if (row.action === "UPDATE") acc.update += 1;
      if (row.action === "DELETE") acc.delete += 1;
      return acc;
    },
    { create: 0, update: 0, delete: 0 },
  );

  const uniqueUsers = new Set(rows.map((row) => row.userId).filter((id): id is string => Boolean(id))).size;

  return {
    rows,
    allUsers,
    filters: {
      action,
      userId,
      keyword,
      limit: take,
    },
    summary: {
      total: rows.length,
      create: summary.create,
      update: summary.update,
      delete: summary.delete,
      users: uniqueUsers,
    },
  };
}
