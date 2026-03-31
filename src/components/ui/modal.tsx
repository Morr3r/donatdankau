"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
};

export function Modal({ open, title, description, onClose, children, widthClassName }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  if (!open || !portalTarget) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5">
      <button
        type="button"
        aria-label="Tutup modal"
        onClick={onClose}
        className="absolute inset-0 bg-[#2b180f]/55 backdrop-blur-[3px]"
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-3xl overflow-hidden rounded-[24px] border border-[#edcc9e] bg-[#fffaf1] shadow-[0_40px_90px_-42px_rgba(35,18,10,0.75)]",
          widthClassName,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#efd6b4] bg-[#fff2dd] px-4 py-4 sm:px-6">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#3f2418]">{title}</h3>
            {description ? <p className="mt-1 text-sm text-[#6f503a]">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2c395] bg-[#fff8ee] text-[#7a5538]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[calc(90vh-84px)] overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
