import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const now = new Date();
  const envTz = process.env.APP_TIMEZONE?.trim();
  const resolvedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZone = envTz && envTz.length > 0 ? envTz : (resolvedTz ?? "UTC");

  return NextResponse.json(
    {
      epochMs: now.getTime(),
      timeZone,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
