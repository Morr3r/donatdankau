import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function clearCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await prisma.authSession.deleteMany({ where: { tokenHash } });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function POST() {
  await clearCurrentSession();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  await clearCurrentSession();
  return NextResponse.json({ ok: true });
}
