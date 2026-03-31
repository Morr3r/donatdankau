import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireAuthUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const currentUser = await requireAuthUser();
  return <AppShell currentUser={currentUser}>{children}</AppShell>;
}

