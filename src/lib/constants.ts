import {
  StockMovementCategory,
  StockMovementType,
  StockOpnameStatus,
  TransferStatus,
  UserRole,
} from "@prisma/client";

export const roleLabel: Record<UserRole, string> = {
  ADMIN: "Admin",
  WAREHOUSE_STAFF: "Staff Gudang",
  OUTLET_STAFF: "Staff Outlet",
  SUPERVISOR: "Supervisor",
  OWNER_MANAGER: "Owner/Manager",
};

export const opnameStatusLabel: Record<StockOpnameStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const transferStatusLabel: Record<TransferStatus, string> = {
  DRAFT: "Draft",
  IN_TRANSIT: "In Transit",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export const movementTypeLabel: Record<StockMovementType, string> = {
  STOCK_IN: "Stok Masuk",
  STOCK_OUT: "Stok Keluar",
  TRANSFER_OUT: "Transfer Keluar",
  TRANSFER_IN: "Transfer Masuk",
  ADJUSTMENT_PLUS: "Penyesuaian +",
  ADJUSTMENT_MINUS: "Penyesuaian -",
  OPNAME_ADJUSTMENT: "Penyesuaian Opname",
};

export const movementCategoryLabel: Record<StockMovementCategory, string> = {
  PURCHASE: "Pembelian",
  RETURN: "Retur",
  PRODUCTION: "Produksi",
  DAMAGED: "Rusak",
  EXPIRED: "Expired",
  TRANSFER: "Transfer",
  ADJUSTMENT: "Penyesuaian",
  OPNAME: "Stock Opname",
  OTHER: "Lainnya",
};

export const stockInCategories: StockMovementCategory[] = [
  "PURCHASE",
  "RETURN",
  "PRODUCTION",
  "ADJUSTMENT",
  "OTHER",
];

export const stockOutCategories: StockMovementCategory[] = [
  "PRODUCTION",
  "DAMAGED",
  "EXPIRED",
  "TRANSFER",
  "ADJUSTMENT",
  "OTHER",
];

