import { Suspense, type ReactNode } from "react";
import { Toaster } from "sonner";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { FlashToast } from "@/components/system/flash-toast";
import { LoginGuidedTour } from "@/components/system/login-guided-tour";
import { ScrollToTopButton } from "@/components/system/scroll-to-top-button";
import { SessionTimeoutGuard } from "@/components/system/session-timeout-guard";
import type { AuthUser } from "@/lib/auth/session";

export function AppShell({ children, currentUser }: { children: ReactNode; currentUser: AuthUser }) {
  return (
    <div className="relative min-h-screen overflow-x-clip text-[#3d2517]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-20 h-[30rem] w-[30rem] rounded-full bg-[#e58fb4]/22 blur-3xl" />
        <div className="absolute -right-20 top-[6%] h-[34rem] w-[34rem] rounded-full bg-[#efbc63]/22 blur-3xl" />
        <div className="absolute bottom-[-22%] left-[26%] h-[26rem] w-[26rem] rounded-full bg-[#d98d34]/18 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1820px] items-start gap-2 px-2 py-2 sm:gap-3 sm:px-3 sm:py-3 lg:gap-4 lg:px-5 lg:py-4">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Topbar currentUser={currentUser} />
          <main className="min-w-0 px-0.5 pb-4 sm:px-2 sm:pb-5 lg:px-4">{children}</main>
        </div>
      </div>
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
      <LoginGuidedTour />
      <SessionTimeoutGuard />
      <ScrollToTopButton />
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          className:
            "!rounded-2xl !border !border-[#eccd9f] !bg-[#fffaf2] !text-[#4b2f1f] !shadow-[0_18px_38px_-24px_rgba(71,43,28,0.45)]",
        }}
      />
    </div>
  );
}

