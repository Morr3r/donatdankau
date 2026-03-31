"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function FlashToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const firedKey = useRef<string | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }

    const success = params.get("success");
    const error = params.get("error");
    const unique = `${pathname}|${success ?? ""}|${error ?? ""}`;

    if (firedKey.current === unique) return;

    if (success) {
      toast.success(success);
    }

    if (error) {
      toast.error(error);
    }

    if (!success && !error) return;

    firedKey.current = unique;
    const next = new URLSearchParams(params.toString());
    next.delete("success");
    next.delete("error");

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [params, pathname, router]);

  return null;
}

