"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Navigation, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  task: string;
  example?: string;
  targetSelector: string;
  href: string;
  completion: "click" | "fill" | "select" | "route";
  completionQueryKey?: string;
};

type ViewportSize = {
  width: number;
  height: number;
};

const TOUR_QUERY_KEY = "tutorial";
const TOUR_QUERY_VALUES = new Set(["login", "logout", "register"]);
const MOBILE_NAV_BREAKPOINT = 1024;
const SIDEBAR_TOUR_SELECTOR = "[data-tour='sidebar-shell']";
const MOBILE_NAV_SCROLL_SELECTOR = "[data-tour='mobile-nav-scroll']";
const MOBILE_TOP_SAFE_PADDING = 96;
const DESKTOP_TOP_SAFE_PADDING = 112;
const MOBILE_BOTTOM_SAFE_PADDING = 338;
const DESKTOP_BOTTOM_SAFE_PADDING = 186;

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "onboarding",
    title: "Mulai dari Checklist Onboarding",
    description: "Buka menu ini dulu supaya urutan kerja harian sampai tutup bulan tidak terlewat.",
    task: "Klik menu Checklist Onboarding untuk melihat progres setup.",
    targetSelector: "[data-tour='nav-onboarding']",
    href: "/onboarding",
    completion: "route",
  },
  {
    id: "units-menu",
    title: "Buka Menu Satuan",
    description: "Satuan wajib dibuat lebih dulu sebelum input bahan baku.",
    task: "Pindah ke halaman Satuan.",
    targetSelector: "[data-tour='nav-units']",
    href: "/master/units",
    completion: "route",
  },
  {
    id: "unit-code",
    title: "Kode Satuan",
    description: "",
    task: "Isi kolom Kode.",
    example: "Contoh: KG, GR, PCS.",
    targetSelector: "[data-tour='tour-unit-code']",
    href: "/master/units",
    completion: "fill",
  },
  {
    id: "unit-name",
    title: "Isi Nama Satuan",
    description: "Nama satuan harus jelas agar mudah dipilih saat input stok.",
    task: "Isi kolom Nama Satuan.",
    example: "Contoh: Kilogram, Gram, Pieces.",
    targetSelector: "[data-tour='tour-unit-name']",
    href: "/master/units",
    completion: "fill",
  },
  {
    id: "unit-submit",
    title: "Simpan Satuan",
    description: "Setelah dua field terisi, simpan supaya satuan masuk ke master data.",
    task: "Klik Simpan Satuan.",
    targetSelector: "[data-tour='tour-unit-submit']",
    href: "/master/units",
    completion: "click",
  },
  {
    id: "materials-menu",
    title: "Buka Menu Bahan Baku",
    description: "Setelah satuan siap, lanjut isi master bahan baku untuk operasional harian.",
    task: "Pindah ke halaman Bahan Baku.",
    targetSelector: "[data-tour='nav-raw-materials']",
    href: "/master/raw-materials",
    completion: "route",
  },
  {
    id: "material-code",
    title: "Isi Kode Bahan",
    description: "Kode bahan membantu pencarian cepat di tabel dan laporan.",
    task: "Isi kolom Kode Bahan.",
    example: "Contoh: BBK-001.",
    targetSelector: "[data-tour='tour-material-code']",
    href: "/master/raw-materials",
    completion: "fill",
  },
  {
    id: "material-name",
    title: "Isi Nama Bahan",
    description: "Nama bahan harus sesuai bahan baku aktual di dapur produksi.",
    task: "Isi kolom Nama Bahan.",
    example: "Contoh: Tepung Protein Tinggi.",
    targetSelector: "[data-tour='tour-material-name']",
    href: "/master/raw-materials",
    completion: "fill",
  },
  {
    id: "material-unit",
    title: "Pilih Satuan Bahan",
    description: "Satuan ini menjadi satuan sistem untuk hitung stok dan nilai bahan.",
    task: "Pilih Satuan yang sesuai.",
    targetSelector: "[data-tour='tour-material-unit']",
    href: "/master/raw-materials",
    completion: "select",
  },
  {
    id: "material-cost",
    title: "Isi Harga Standar",
    description: "Harga standar dipakai untuk estimasi nilai stok dan selisih opname.",
    task: "Isi Harga Standar (Rp).",
    example: "Contoh: 10000 untuk 1 kilogram.",
    targetSelector: "[data-tour='tour-material-cost']",
    href: "/master/raw-materials",
    completion: "fill",
  },
  {
    id: "material-min-stock",
    title: "Isi Stok Minimum",
    description: "Batas minimum membantu memicu alert saat stok mulai menipis.",
    task: "Isi kolom Stok Minimum.",
    example: "Contoh: 5 untuk minimum stok aman.",
    targetSelector: "[data-tour='tour-material-min-stock']",
    href: "/master/raw-materials",
    completion: "fill",
  },
  {
    id: "material-shelf-life",
    title: "Isi Masa Simpan",
    description: "Masa simpan dipakai untuk memantau risiko kedaluwarsa bahan baku.",
    task: "Isi kolom Masa Simpan (hari).",
    example: "Contoh: 30 untuk bahan dengan umur simpan 30 hari.",
    targetSelector: "[data-tour='tour-material-shelf-life']",
    href: "/master/raw-materials",
    completion: "fill",
  },
  {
    id: "material-submit",
    title: "Simpan Bahan Baku",
    description: "Setelah data utama terisi, simpan bahan baku agar bisa dipakai di transaksi.",
    task: "Klik Simpan Bahan Baku.",
    targetSelector: "[data-tour='tour-material-submit']",
    href: "/master/raw-materials",
    completion: "click",
  },
  {
    id: "stock-in-menu",
    title: "Buka Menu Stok Masuk",
    description: "Gunakan menu ini untuk stok awal dan pembelian bahan baku.",
    task: "Pindah ke halaman Stok Masuk.",
    targetSelector: "[data-tour='nav-stock-in']",
    href: "/stock-movement/in",
    completion: "route",
  },
  {
    id: "stock-in-item",
    title: "Pilih Bahan Stok Masuk",
    description: "Pilih item bahan baku yang benar sebelum isi qty.",
    task: "Pilih item di field Bahan Baku.",
    targetSelector: "[data-tour='tour-stockin-item']",
    href: "/stock-movement/in",
    completion: "select",
  },
  {
    id: "stock-in-qty",
    title: "Isi Qty Stok Masuk",
    description: "Sistem akan menghitung konversi dan estimasi nilai otomatis.",
    task: "Isi Qty dan satuan input.",
    example: "Contoh: 250 gram akan dikonversi ke satuan bahan.",
    targetSelector: "[data-tour='tour-stockin-qty']",
    href: "/stock-movement/in",
    completion: "fill",
  },
  {
    id: "stock-in-submit",
    title: "Simpan Transaksi Masuk",
    description: "Setelah data benar, simpan supaya stok sistem bertambah.",
    task: "Klik Simpan Stok Masuk.",
    targetSelector: "[data-tour='tour-stockin-submit']",
    href: "/stock-movement/in",
    completion: "click",
  },
  {
    id: "stock-out-menu",
    title: "Buka Menu Stok Keluar",
    description: "Catat pemakaian bahan produksi agar stok sistem selalu sinkron.",
    task: "Pindah ke halaman Stok Keluar.",
    targetSelector: "[data-tour='nav-stock-out']",
    href: "/stock-movement/out",
    completion: "route",
  },
  {
    id: "stock-out-qty",
    title: "Isi Qty Pemakaian",
    description: "Isi jumlah bahan yang dipakai/keluar dari gudang.",
    task: "Isi Qty Keluar, lalu cek satuannya.",
    targetSelector: "[data-tour='tour-stockout-qty']",
    href: "/stock-movement/out",
    completion: "fill",
  },
  {
    id: "stock-out-submit",
    title: "Simpan Stok Keluar",
    description: "Simpan transaksi agar stok berkurang sesuai pemakaian aktual.",
    task: "Klik Simpan Stok Keluar.",
    targetSelector: "[data-tour='tour-stockout-submit']",
    href: "/stock-movement/out",
    completion: "click",
  },
  {
    id: "adjust-menu",
    title: "Buka Menu Adjustment",
    description: "Gunakan saat ada selisih manual di luar transaksi harian.",
    task: "Pindah ke halaman Adjustment.",
    targetSelector: "[data-tour='nav-adjustment']",
    href: "/stock-movement/adjustments",
    completion: "route",
  },
  {
    id: "adjust-qty",
    title: "Isi Qty Penyesuaian",
    description: "Masukkan nilai koreksi, lalu pilih arah tambah/kurang.",
    task: "Isi Qty Adjustment dan pastikan arahnya benar.",
    targetSelector: "[data-tour='tour-adjust-qty']",
    href: "/stock-movement/adjustments",
    completion: "fill",
  },
  {
    id: "adjust-submit",
    title: "Simpan Adjustment",
    description: "Simpan agar stok sistem langsung terkoreksi.",
    task: "Klik Simpan Penyesuaian.",
    targetSelector: "[data-tour='tour-adjust-submit']",
    href: "/stock-movement/adjustments",
    completion: "click",
  },
  {
    id: "opname-create-menu",
    title: "Buka Persiapan Opname",
    description: "Masuk tahap tutup bulan untuk membuat dokumen opname.",
    task: "Pindah ke menu Persiapan Opname.",
    targetSelector: "[data-tour='nav-opname-create']",
    href: "/stock-opname/create",
    completion: "route",
  },
  {
    id: "opname-create-date",
    title: "Isi Tanggal Opname",
    description: "Tanggal opname menentukan periode rekap bulanan.",
    task: "Isi Tanggal Opname.",
    targetSelector: "[data-tour='tour-opname-date']",
    href: "/stock-opname/create",
    completion: "fill",
  },
  {
    id: "opname-create-submit",
    title: "Buat Dokumen Opname",
    description: "Dokumen ini akan dipakai pada proses hitung fisik.",
    task: "Klik Buat Dokumen Checklist.",
    targetSelector: "[data-tour='tour-opname-create-submit']",
    href: "/stock-opname/create",
    completion: "click",
  },
  {
    id: "opname-process-menu",
    title: "Buka Hitung & Rekonsiliasi",
    description: "Lanjutkan ke proses pengisian stok fisik per item.",
    task: "Pindah ke menu Hitung & Rekonsiliasi.",
    targetSelector: "[data-tour='nav-opname-process']",
    href: "/stock-opname/process",
    completion: "route",
  },
  {
    id: "opname-select-doc",
    title: "Pilih Dokumen Draft",
    description: "Pilih dokumen yang tadi dibuat agar bisa input hitung fisik.",
    task: "Klik Tampilkan setelah memilih dokumen.",
    targetSelector: "[data-tour='tour-opname-process-select-doc']",
    href: "/stock-opname/process",
    completion: "route",
    completionQueryKey: "id",
  },
  {
    id: "opname-physical",
    title: "Isi Stok Fisik",
    description: "Masukkan hasil hitung fisik aktual dari gudang/dapur.",
    task: "Isi field Stok Saat Ini.",
    targetSelector: "[data-tour='tour-opname-physical-stock']",
    href: "/stock-opname/process",
    completion: "fill",
  },
  {
    id: "opname-save-item",
    title: "Simpan Hasil Hitung",
    description: "Simpan item dulu supaya selisih qty dan nilai dihitung otomatis.",
    task: "Klik Simpan Hasil Hitung.",
    targetSelector: "[data-tour='tour-opname-save-item']",
    href: "/stock-opname/process",
    completion: "click",
  },
  {
    id: "opname-submit",
    title: "Submit Rekonsiliasi",
    description: "Setelah semua item terinput, submit untuk adjustment otomatis.",
    task: "Klik Submit Rekonsiliasi & Adjustment.",
    targetSelector: "[data-tour='tour-opname-submit-reconcile']",
    href: "/stock-opname/process",
    completion: "click",
  },
  {
    id: "opname-history-menu",
    title: "Buka Rekap Bulanan",
    description: "Cek hasil akhir selisih per periode bulanan.",
    task: "Pindah ke menu Rekap Bulanan.",
    targetSelector: "[data-tour='nav-opname-history']",
    href: "/stock-opname/history",
    completion: "route",
  },
  {
    id: "opname-export",
    title: "Export Rekap ke Excel",
    description: "Unduh rekap untuk arsip dan laporan owner/keuangan.",
    task: "Klik tombol Export Excel.",
    targetSelector: "[data-tour='tour-opname-export']",
    href: "/stock-opname/history",
    completion: "click",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getScrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined") return "smooth";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function getTargetCandidates(selector: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(selector));
}

function isTargetRenderable(node: HTMLElement) {
  const rect = node.getBoundingClientRect();
  const style = window.getComputedStyle(node);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
}

function getRectIntersectionScore(rect: DOMRect) {
  const visibleWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
  const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
  return visibleWidth * visibleHeight;
}

function preferTargetByViewport(candidates: HTMLElement[], isMobileViewport: boolean) {
  if (candidates.length === 0) return [];

  if (isMobileViewport) {
    const mobileCandidates = candidates.filter((node) => !node.closest(SIDEBAR_TOUR_SELECTOR));
    return mobileCandidates.length > 0 ? mobileCandidates : candidates;
  }

  const sidebarCandidates = candidates.filter((node) => node.closest(SIDEBAR_TOUR_SELECTOR));
  return sidebarCandidates.length > 0 ? sidebarCandidates : candidates;
}

function findBestTarget(selector: string, isMobileViewport: boolean) {
  const renderable = getTargetCandidates(selector).filter(isTargetRenderable);
  const preferred = preferTargetByViewport(renderable, isMobileViewport);

  for (const node of preferred) {
    if (getRectIntersectionScore(node.getBoundingClientRect()) > 0) {
      return node;
    }
  }

  return preferred[0] ?? null;
}

function centerItemInHorizontalRail(target: HTMLElement) {
  const rail = target.closest<HTMLElement>(MOBILE_NAV_SCROLL_SELECTOR);
  if (!rail) return;

  const targetRect = target.getBoundingClientRect();
  const railRect = rail.getBoundingClientRect();
  const delta = targetRect.left - railRect.left - (railRect.width - targetRect.width) / 2;

  rail.scrollBy({
    left: delta,
    behavior: getScrollBehavior(),
  });
}

function getSafeViewportBounds(isMobileViewport: boolean) {
  const top = isMobileViewport ? MOBILE_TOP_SAFE_PADDING : DESKTOP_TOP_SAFE_PADDING;
  const bottomPadding = isMobileViewport ? MOBILE_BOTTOM_SAFE_PADDING : DESKTOP_BOTTOM_SAFE_PADDING;
  const bottom = Math.max(top + 140, window.innerHeight - bottomPadding);
  return { top, bottom };
}

function isTargetInSafeViewport(node: HTMLElement, isMobileViewport: boolean) {
  const rect = node.getBoundingClientRect();
  const bounds = getSafeViewportBounds(isMobileViewport);

  if (getRectIntersectionScore(rect) <= 0) return false;
  return rect.top >= bounds.top && rect.bottom <= bounds.bottom;
}

function nudgeTargetIntoSafeViewport(node: HTMLElement, isMobileViewport: boolean) {
  const rect = node.getBoundingClientRect();
  const bounds = getSafeViewportBounds(isMobileViewport);

  let deltaY = 0;
  if (rect.bottom > bounds.bottom) {
    deltaY = rect.bottom - bounds.bottom + 14;
  } else if (rect.top < bounds.top) {
    deltaY = rect.top - bounds.top - 14;
  }

  if (Math.abs(deltaY) < 5) {
    return true;
  }

  window.scrollBy({
    top: deltaY,
    behavior: getScrollBehavior(),
  });
  return false;
}

function revealTarget(node: HTMLElement, isMobileViewport: boolean) {
  node.scrollIntoView({
    behavior: getScrollBehavior(),
    block: isMobileViewport ? "center" : "nearest",
    inline: isMobileViewport ? "center" : "nearest",
  });

  if (isMobileViewport) {
    centerItemInHorizontalRail(node);
  }

  nudgeTargetIntoSafeViewport(node, isMobileViewport);
}

function matchEventTarget(event: Event, selector: string) {
  if (!(event.target instanceof Element)) {
    return null;
  }

  return event.target.closest<HTMLElement>(selector);
}

function isFieldComplete(node: HTMLElement) {
  if (node instanceof HTMLInputElement) {
    if (node.type === "checkbox" || node.type === "radio") {
      return node.checked;
    }
    return node.value.trim().length > 0;
  }

  if (node instanceof HTMLTextAreaElement) {
    return node.value.trim().length > 0;
  }

  if (node instanceof HTMLSelectElement) {
    return node.value.trim().length > 0;
  }

  const nestedField = node.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select",
  );

  if (!nestedField) {
    return false;
  }

  return isFieldComplete(nestedField);
}

export function LoginGuidedTour() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [introOpen, setIntroOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 });
  const [passedStepId, setPassedStepId] = useState<string | null>(null);
  const autoAdvanceTimeoutRef = useRef<number | null>(null);
  const completedStepIdRef = useRef<string | null>(null);

  const currentStep = TUTORIAL_STEPS[stepIndex];
  const isMobileViewport = viewport.width > 0 && viewport.width < MOBILE_NAV_BREAKPOINT;
  const stepPassed = currentStep ? passedStepId === currentStep.id : false;
  const requiresManualAdvance = currentStep?.completion === "fill" || currentStep?.completion === "select";

  const clearAutoAdvanceTimeout = useCallback(() => {
    if (autoAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const tutorialFromQuery = searchParams.get(TOUR_QUERY_KEY);
    if (!tutorialFromQuery || !TOUR_QUERY_VALUES.has(tutorialFromQuery)) {
      return;
    }

    window.requestAnimationFrame(() => {
      setIntroOpen(true);
    });

    const next = new URLSearchParams(searchParams.toString());
    next.delete(TOUR_QUERY_KEY);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    return () => {
      clearAutoAdvanceTimeout();
    };
  }, [clearAutoAdvanceTimeout]);

  const startTour = useCallback(() => {
    clearAutoAdvanceTimeout();
    completedStepIdRef.current = null;
    setIntroOpen(false);
    setStepIndex(0);
    setPassedStepId(null);
    setTargetRect(null);
    setTourActive(true);
  }, [clearAutoAdvanceTimeout]);

  const finishTour = useCallback(() => {
    clearAutoAdvanceTimeout();
    completedStepIdRef.current = null;
    setTourActive(false);
    setStepIndex(0);
    setPassedStepId(null);
    setTargetRect(null);
  }, [clearAutoAdvanceTimeout]);

  const skipIntroAndTour = useCallback(() => {
    clearAutoAdvanceTimeout();
    completedStepIdRef.current = null;
    setIntroOpen(false);
    setTourActive(false);
    setPassedStepId(null);
    setTargetRect(null);
  }, [clearAutoAdvanceTimeout]);

  const goPrevStep = useCallback(() => {
    clearAutoAdvanceTimeout();
    completedStepIdRef.current = null;
    setPassedStepId(null);
    setStepIndex((previous) => Math.max(previous - 1, 0));
  }, [clearAutoAdvanceTimeout]);

  const moveToNextStep = useCallback(
    (stepId: string) => {
      const latestIndex = TUTORIAL_STEPS.findIndex((step) => step.id === stepId);
      if (latestIndex === -1) return;

      if (latestIndex >= TUTORIAL_STEPS.length - 1) {
        finishTour();
        return;
      }

      setStepIndex((previous) => {
        if (TUTORIAL_STEPS[previous]?.id !== stepId) {
          return previous;
        }
        return Math.min(previous + 1, TUTORIAL_STEPS.length - 1);
      });
    },
    [finishTour],
  );

  const goNextStep = useCallback(() => {
    if (!currentStep) return;
    if (currentStep.completion === "route") {
      if (pathname !== currentStep.href) {
        router.push(currentStep.href);
      }
      clearAutoAdvanceTimeout();
      completedStepIdRef.current = null;
      setPassedStepId(null);
      moveToNextStep(currentStep.id);
      return;
    }
    if (requiresManualAdvance && !stepPassed) return;

    clearAutoAdvanceTimeout();
    completedStepIdRef.current = null;
    setPassedStepId(null);
    moveToNextStep(currentStep.id);
  }, [clearAutoAdvanceTimeout, currentStep, moveToNextStep, pathname, requiresManualAdvance, router, stepPassed]);

  useEffect(() => {
    if (!tourActive || !currentStep) {
      return;
    }

    clearAutoAdvanceTimeout();
    completedStepIdRef.current = null;
  }, [clearAutoAdvanceTimeout, stepIndex, tourActive, currentStep]);

  useEffect(() => {
    if (!tourActive || !currentStep) {
      return;
    }

    const stepId = currentStep.id;

    const completeCurrentStep = () => {
      if (completedStepIdRef.current === stepId) {
        return;
      }

      completedStepIdRef.current = stepId;
      setPassedStepId(stepId);
      clearAutoAdvanceTimeout();

      const shouldAutoAdvance = currentStep.completion === "route" || currentStep.completion === "click";
      if (!shouldAutoAdvance) {
        return;
      }

      autoAdvanceTimeoutRef.current = window.setTimeout(() => {
        moveToNextStep(stepId);
      }, 420);
    };

    if (currentStep.completion === "route") {
      const hasRequiredQuery = currentStep.completionQueryKey
        ? (searchParams.get(currentStep.completionQueryKey)?.trim().length ?? 0) > 0
        : true;

      if (pathname === currentStep.href && hasRequiredQuery) {
        completeCurrentStep();
      }

      return;
    }

    const handleClickCompletion = (event: MouseEvent) => {
      if (!matchEventTarget(event, currentStep.targetSelector)) {
        return;
      }
      completeCurrentStep();
    };

    const handleFieldCompletion = (event: Event) => {
      const target = matchEventTarget(event, currentStep.targetSelector);
      if (!target || !isFieldComplete(target)) {
        return;
      }
      completeCurrentStep();
    };

    if (currentStep.completion === "click") {
      document.addEventListener("click", handleClickCompletion, true);
    }

    if (currentStep.completion === "fill") {
      document.addEventListener("input", handleFieldCompletion, true);
      document.addEventListener("change", handleFieldCompletion, true);
    }

    if (currentStep.completion === "select") {
      document.addEventListener("change", handleFieldCompletion, true);
    }

    return () => {
      document.removeEventListener("click", handleClickCompletion, true);
      document.removeEventListener("input", handleFieldCompletion, true);
      document.removeEventListener("change", handleFieldCompletion, true);
    };
  }, [clearAutoAdvanceTimeout, currentStep, moveToNextStep, pathname, searchParams, tourActive]);

  useEffect(() => {
    if (!tourActive || !currentStep) {
      return;
    }

    let cancelled = false;
    let attempt = 0;
    let timeoutId: number | null = null;
    const maxAttempts = isMobileViewport ? 14 : 10;

    const queueAttempt = (delay: number) => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        runAttempt();
      }, delay);
    };

    const runAttempt = () => {
      const target = findBestTarget(currentStep.targetSelector, isMobileViewport);
      if (!target) {
        attempt += 1;
        if (attempt < maxAttempts) {
          queueAttempt(220);
        }
        return;
      }

      revealTarget(target, isMobileViewport);

      attempt += 1;
      if (!isTargetInSafeViewport(target, isMobileViewport) && attempt < maxAttempts) {
        queueAttempt(180);
      }
    };

    const frameId = window.requestAnimationFrame(runAttempt);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [currentStep, isMobileViewport, pathname, tourActive]);

  useEffect(() => {
    if (!tourActive || !currentStep) {
      return;
    }

    let frameId = 0;

    const updateTargetRect = () => {
      const target = findBestTarget(currentStep.targetSelector, isMobileViewport);
      if (!target) {
        setTargetRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      if (getRectIntersectionScore(rect) <= 0) {
        setTargetRect(null);
        return;
      }

      setTargetRect(rect);
    };

    const queueUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        updateTargetRect();
        frameId = 0;
      });
    };

    queueUpdate();

    const interval = window.setInterval(queueUpdate, 280);
    window.addEventListener("resize", queueUpdate);
    window.addEventListener("scroll", queueUpdate, true);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.clearInterval(interval);
      window.removeEventListener("resize", queueUpdate);
      window.removeEventListener("scroll", queueUpdate, true);
    };
  }, [currentStep, isMobileViewport, pathname, tourActive]);

  const spotlight = useMemo(() => {
    if (!targetRect) return null;

    const padding = 10;
    const left = Math.max(targetRect.left - padding, 8);
    const top = Math.max(targetRect.top - padding, 8);
    const width = Math.max(targetRect.width + padding * 2, 52);
    const height = Math.max(targetRect.height + padding * 2, 52);

    return { left, top, width, height };
  }, [targetRect]);

  const bubbleStyle = useMemo<{ width: number; left: number; top: number; maxHeight: number }>(() => {
    const horizontalPadding = isMobileViewport ? 8 : 12;
    const cardWidth = clamp(viewport.width - horizontalPadding * 2, isMobileViewport ? 250 : 300, isMobileViewport ? 350 : 390);
    const estimatedHeight = isMobileViewport ? 292 : 282;
    const viewportBottomPadding = isMobileViewport ? 18 : 12;

    if (viewport.width === 0 || viewport.height === 0) {
      return {
        width: cardWidth,
        left: horizontalPadding,
        top: 10,
        maxHeight: 360,
      };
    }

    if (isMobileViewport) {
      const top = Math.max(viewport.height - estimatedHeight - 8, 8);
      return {
        width: cardWidth,
        left: Math.max((viewport.width - cardWidth) / 2, horizontalPadding),
        top,
        maxHeight: Math.max(210, viewport.height - top - viewportBottomPadding),
      };
    }

    if (!targetRect) {
      const top = Math.max(viewport.height * 0.2, 24);
      return {
        width: cardWidth,
        left: Math.max((viewport.width - cardWidth) / 2, horizontalPadding),
        top,
        maxHeight: Math.max(210, viewport.height - top - viewportBottomPadding),
      };
    }

    const gap = 18;

    const placeAbove = targetRect.top > viewport.height * 0.56;
    const top = placeAbove
      ? targetRect.top - estimatedHeight - gap
      : targetRect.bottom + gap;

    const preferredLeft = targetRect.left + targetRect.width / 2 - cardWidth / 2;

    const resolvedTop = clamp(top, 10, Math.max(10, viewport.height - estimatedHeight - 10));

    return {
      width: cardWidth,
      left: clamp(preferredLeft, horizontalPadding, Math.max(horizontalPadding, viewport.width - cardWidth - horizontalPadding)),
      top: resolvedTop,
      maxHeight: Math.max(210, viewport.height - resolvedTop - viewportBottomPadding),
    };
  }, [isMobileViewport, targetRect, viewport.height, viewport.width]);

  return (
    <>
      <Modal
        open={introOpen}
        onClose={startTour}
        title="Panduan Cepat Stock Opname"
        description="Supaya tidak bingung, ikuti alur sederhana ini. Setelah ditutup, sistem langsung menyorot menu yang harus Anda buka."
        widthClassName="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#ecd1ab] bg-[#fff6e8] p-4">
            <p className="text-sm leading-6 text-[#5f3e2b]">
              Alur aplikasi ini dibagi menjadi 3 tahap supaya operasional UMKM tetap ringan:{" "}
              <span className="font-semibold">Setup Awal</span>,{" "}
              <span className="font-semibold">Operasional Harian</span>, lalu <span className="font-semibold">Tutup Bulan</span>.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#ebd0aa] bg-[#fffaf1] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8f6848]">1. Setup Awal</p>
              <p className="mt-2 text-sm text-[#5e3d2b]">Satuan, bahan baku, harga standar, lalu stok awal.</p>
            </div>
            <div className="rounded-xl border border-[#ebd0aa] bg-[#fffaf1] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8f6848]">2. Harian</p>
              <p className="mt-2 text-sm text-[#5e3d2b]">Catat stok masuk, stok keluar, dan adjustment jika perlu.</p>
            </div>
            <div className="rounded-xl border border-[#ebd0aa] bg-[#fffaf1] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8f6848]">3. Tutup Bulan</p>
              <p className="mt-2 text-sm text-[#5e3d2b]">Buat dokumen opname, isi fisik, lalu cek rekap bulanan.</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#edd6b6] pt-3">
            <Button variant="ghost" onClick={skipIntroAndTour}>
              Lewati
            </Button>
            <Button onClick={startTour}>Tutup & Mulai Tur</Button>
          </div>
        </div>
      </Modal>

      {tourActive ? (
        <div className="pointer-events-none fixed inset-0 z-[130]">
          {spotlight ? (
            <div
              className="pointer-events-none absolute rounded-2xl border-2 border-[#efb04f] bg-transparent shadow-[0_0_0_9999px_rgba(28,15,10,0.68),0_0_0_1px_rgba(255,255,255,0.2)] transition-[left,top,width,height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                left: spotlight.left,
                top: spotlight.top,
                width: spotlight.width,
                height: spotlight.height,
              }}
            />
          ) : (
            <div className="pointer-events-none absolute inset-0 bg-[#2a170f]/72" />
          )}

          <div
            className={cn(
              "pointer-events-auto absolute overflow-y-auto overscroll-contain rounded-[22px] border border-[#eccd9f] bg-[#fffaf1] shadow-[0_34px_80px_-34px_rgba(34,19,12,0.78)] transition-[left,top,width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              isMobileViewport ? "p-3 touch-pan-y pb-[calc(env(safe-area-inset-bottom)+0.75rem)]" : "p-4",
            )}
            style={{
              left: bubbleStyle.left,
              top: bubbleStyle.top,
              width: bubbleStyle.width,
              maxHeight: bubbleStyle.maxHeight,
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#ecd1ad] bg-[#fff3df] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8a6345]">
                <Target size={13} /> Step {stepIndex + 1} dari {TUTORIAL_STEPS.length}
              </p>
              <button
                type="button"
                onClick={finishTour}
                className="rounded-lg border border-[#e7c89c] bg-[#fff5e7] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f5a3c]"
              >
                Selesai
              </button>
            </div>

            <div className="mt-1 rounded-xl border border-[#edd6b5] bg-[#fff4e3] p-3 text-xs text-[#6e4f39]">
              <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.14em] text-[#8a6345]">
                <Navigation size={12} /> Aksi Wajib Step Ini
              </div>
              <p className="mt-1">{currentStep.task}</p>
              {currentStep.example ? <p className="mt-1 text-[11px] text-[#8a6345]">{currentStep.example}</p> : null}
            </div>
            {!spotlight ? (
              <p className="mt-2 text-xs text-[#8a6345]">
                Target step sedang diposisikan otomatis. Tunggu sebentar atau tekan tombol Lanjut jika halaman belum sesuai.
              </p>
            ) : null}

            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="secondary" onClick={goPrevStep} disabled={stepIndex === 0}>
                  Sebelumnya
                </Button>
                <Button onClick={goNextStep} disabled={requiresManualAdvance && !stepPassed}>
                  Lanjut
                </Button>
              </div>
              <p className="inline-flex items-center gap-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6345]">
                {currentStep.completion === "route"
                  ? "Klik Lanjut Untuk Pindah Halaman"
                  : requiresManualAdvance
                    ? (stepPassed ? "Klik Lanjut" : "Lengkapi Field")
                    : "Menunggu Aksi Highlight"}
              </p>
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#f1ddc2]">
              <div
                className={cn("h-full rounded-full bg-[linear-gradient(90deg,#e9a448,#e88fb4)] transition-all duration-300")}
                style={{ width: `${((stepIndex + 1) / TUTORIAL_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
