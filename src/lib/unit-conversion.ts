export type UnitLike = {
  id?: string | null;
  code?: string | null;
  name?: string | null;
};

type UnitDimension = "MASS" | "VOLUME" | "COUNT";

type UnitAlias = {
  dimension: UnitDimension;
  factor: number;
  aliases: string[];
};

const UNIT_ALIASES: UnitAlias[] = [
  { dimension: "MASS", factor: 1000, aliases: ["kg", "kgs", "kilogram", "kilograms", "kilo"] },
  { dimension: "MASS", factor: 1, aliases: ["g", "gr", "gram", "grams"] },
  { dimension: "MASS", factor: 0.001, aliases: ["mg", "milligram", "miligram"] },
  { dimension: "MASS", factor: 100, aliases: ["ons"] },
  { dimension: "VOLUME", factor: 1000, aliases: ["l", "lt", "ltr", "liter", "litre"] },
  { dimension: "VOLUME", factor: 1, aliases: ["ml", "milliliter", "mililiter", "cc"] },
  { dimension: "COUNT", factor: 1, aliases: ["pcs", "pc", "piece", "pieces", "buah", "unit"] },
];

function normalizeUnitText(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function resolveUnitAlias(unit: UnitLike) {
  const candidates = [unit.code, unit.name].filter((value): value is string => Boolean(value && value.trim().length > 0));
  for (const raw of candidates) {
    const normalized = normalizeUnitText(raw);
    const alias = UNIT_ALIASES.find((entry) => entry.aliases.includes(normalized));
    if (alias) {
      return alias;
    }
  }

  return null;
}

function isSameUnitText(from: UnitLike, to: UnitLike) {
  const fromCandidates = [from.code, from.name]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .map(normalizeUnitText)
    .filter(Boolean);
  const toCandidates = [to.code, to.name]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .map(normalizeUnitText)
    .filter(Boolean);

  return fromCandidates.some((entry) => toCandidates.includes(entry));
}

function roundToSixDecimals(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function getUnitDisplayName(unit: UnitLike) {
  return unit.name?.trim() || unit.code?.trim() || "satuan";
}

export function convertQuantityBetweenUnits(
  quantity: number,
  from: UnitLike,
  to: UnitLike,
): { quantity: number; converted: boolean } | null {
  if (!Number.isFinite(quantity)) {
    return null;
  }

  if (from.id && to.id && from.id === to.id) {
    return { quantity, converted: false };
  }

  const fromAlias = resolveUnitAlias(from);
  const toAlias = resolveUnitAlias(to);

  if (fromAlias && toAlias) {
    if (fromAlias.dimension !== toAlias.dimension) {
      return null;
    }

    const convertedQuantity = roundToSixDecimals((quantity * fromAlias.factor) / toAlias.factor);
    return {
      quantity: convertedQuantity,
      converted: convertedQuantity !== quantity,
    };
  }

  if (isSameUnitText(from, to)) {
    return { quantity, converted: false };
  }

  return null;
}
