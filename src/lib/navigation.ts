import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  History,
  Boxes,
  ClipboardList,
  ClipboardCheck,
  PackageMinus,
  PackagePlus,
  PackageCheck,
  Scale,
  ScrollText,
  Settings2,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const navTourTargets: Record<string, string> = {
  "/dashboard": "nav-dashboard",
  "/activity-log": "nav-activity-log",
  "/onboarding": "nav-onboarding",
  "/master/raw-materials": "nav-raw-materials",
  "/master/units": "nav-units",
  "/stock-movement/in": "nav-stock-in",
  "/stock-movement/out": "nav-stock-out",
  "/stock-movement/adjustments": "nav-adjustment",
  "/stock-opname/create": "nav-opname-create",
  "/stock-opname/process": "nav-opname-process",
  "/stock-opname/history": "nav-opname-history",
};

export const navGroups: NavGroup[] = [
  {
    title: "Dashboard",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/activity-log", label: "Aktivitas User", icon: History },
    ],
  },
  {
    title: "1. Setup Awal",
    items: [
      { href: "/onboarding", label: "Checklist Onboarding", icon: ClipboardList },
      { href: "/master/raw-materials", label: "Bahan Baku", icon: Boxes },
      { href: "/master/units", label: "Satuan", icon: Scale },
    ],
  },
  {
    title: "2. Operasional Harian",
    items: [
      { href: "/stock-movement/in", label: "Stok Masuk", icon: PackagePlus },
      { href: "/stock-movement/out", label: "Stok Keluar", icon: PackageMinus },
      { href: "/stock-movement/adjustments", label: "Adjustment", icon: Settings2 },
    ],
  },
  {
    title: "3. Tutup Bulan",
    items: [
      { href: "/stock-opname/create", label: "Persiapan Opname", icon: ClipboardCheck },
      { href: "/stock-opname/process", label: "Hitung & Rekonsiliasi", icon: PackageCheck },
      { href: "/stock-opname/history", label: "Rekap Bulanan", icon: ScrollText },
    ],
  },
];

