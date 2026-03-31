"use client";

import { useEffect, useRef } from "react";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 1000;

function buildLoginUrl() {
  return "/auth/login";
}

export function SessionTimeoutGuard() {
  const lastActivityRef = useRef(0);
  const logoutTriggeredRef = useRef(false);

  useEffect(() => {
    lastActivityRef.current = Date.now();

    async function logoutAndRedirect() {
      if (logoutTriggeredRef.current) return;
      logoutTriggeredRef.current = true;

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          cache: "no-store",
          keepalive: true,
        });
      } catch {
        // Tetap redirect walau request logout gagal sesaat.
      }

      window.location.href = buildLoginUrl();
    }

    function markActivity() {
      if (logoutTriggeredRef.current) return;
      lastActivityRef.current = Date.now();
    }

    function handlePageHide() {
      if (logoutTriggeredRef.current) return;

      const payload = new Blob([JSON.stringify({ reason: "close" })], {
        type: "application/json",
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/auth/logout", payload);
        return;
      }

      void fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
        keepalive: true,
      });
    }

    const activityEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "mousemove", "scroll", "touchstart", "focus"];

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, markActivity, { passive: true });
    }

    const timer = window.setInterval(() => {
      if (logoutTriggeredRef.current) return;

      const idleDuration = Date.now() - lastActivityRef.current;
      if (idleDuration >= IDLE_TIMEOUT_MS) {
        void logoutAndRedirect();
      }
    }, CHECK_INTERVAL_MS);

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, markActivity);
      }
      window.removeEventListener("pagehide", handlePageHide);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
