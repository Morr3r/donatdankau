"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const SHOW_AFTER_SCROLL_Y = 320;

function getScrollSnapshot() {
  if (typeof window === "undefined") {
    return { y: 0, progress: 0 };
  }

  const y = window.scrollY;
  const doc = document.documentElement;
  const scrollable = Math.max(0, doc.scrollHeight - window.innerHeight);
  const progress = scrollable === 0 ? 0 : Math.min(1, y / scrollable);

  return { y, progress };
}

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const updateFromScroll = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        const snapshot = getScrollSnapshot();
        setIsVisible(snapshot.y > SHOW_AFTER_SCROLL_Y);
        setProgress(snapshot.progress);
        frame = 0;
      });
    };

    updateFromScroll();
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
    };
  }, []);

  const progressStyle = useMemo(
    () => ({
      backgroundImage: `conic-gradient(#e6992f ${Math.round(progress * 360)}deg, rgba(205,154,98,0.24) 0deg)`,
    }),
    [progress],
  );

  const handleScrollTop = () => {
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  };

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-5 right-4 z-[85] sm:bottom-6 sm:right-6",
        "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      )}
      aria-hidden={!isVisible}
    >
      <div className="relative">
        <div
          className={cn(
            "absolute -inset-2 -z-10 rounded-full bg-[radial-gradient(circle,rgba(229,143,180,0.34)_0%,rgba(239,188,99,0.12)_48%,transparent_75%)] blur-lg transition-opacity duration-300",
            isVisible ? "opacity-100" : "opacity-0",
          )}
        />

        <button
          type="button"
          onClick={handleScrollTop}
          className={cn(
            "group pointer-events-auto relative inline-flex h-14 w-14 items-center justify-center rounded-full p-[2px]",
            "shadow-[0_22px_38px_-26px_rgba(71,43,28,0.58)] transition",
            "hover:translate-y-[-1px] active:translate-y-0",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c57f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff6ea]",
          )}
          style={progressStyle}
          aria-label="Kembali ke atas"
        >
          <span className="flex h-full w-full items-center justify-center rounded-full border border-[#e7c89e] bg-[linear-gradient(145deg,#fffaf2_0%,#ffecd4_100%)] text-[#6e452e]">
            <ChevronUp size={22} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
          </span>
        </button>
      </div>
    </div>
  );
}
