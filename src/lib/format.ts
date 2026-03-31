import { format } from "date-fns";

export const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
});

export const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 3,
});

export const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  if (typeof value === "object" && "toString" in value) {
    return Number((value as { toString: () => string }).toString());
  }
  return 0;
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";
  return format(new Date(value), "dd MMM yyyy, HH:mm");
}

export function formatNumber(value: unknown) {
  return numberFormatter.format(toNumber(value));
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

