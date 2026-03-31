"use client";

import { useMemo, useState } from "react";

import { Field, Label } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { convertQuantityBetweenUnits, getUnitDisplayName } from "@/lib/unit-conversion";

type UnitOption = {
  id: string;
  code: string;
  name: string;
};

type ItemOption = {
  id: string;
  name: string;
  standardCost: number | string;
  unit: UnitOption;
};

type StockQuantityCalculatorFieldProps = {
  items: ItemOption[];
  units: UnitOption[];
  itemInputId: string;
  quantityInputId: string;
  unitInputId: string;
  quantityLabel?: string;
  itemDataTour?: string;
  quantityDataTour?: string;
  unitDataTour?: string;
};

const currencyWithDecimals = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 2,
});

const decimalFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 6,
});

export function StockQuantityCalculatorField({
  items,
  units,
  itemInputId,
  quantityInputId,
  unitInputId,
  quantityLabel = "Qty",
  itemDataTour,
  quantityDataTour,
  unitDataTour,
}: StockQuantityCalculatorFieldProps) {
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitId, setUnitId] = useState("");

  const selectedItem = useMemo(() => items.find((item) => item.id === itemId) ?? null, [itemId, items]);
  const selectedUnit = useMemo(() => units.find((unit) => unit.id === unitId) ?? null, [unitId, units]);
  const parsedQty = Number(quantity);
  const parsedStandardCost = selectedItem ? Number(selectedItem.standardCost) : 0;

  const conversion = useMemo(() => {
    if (!selectedItem || !selectedUnit || !Number.isFinite(parsedQty) || parsedQty <= 0) {
      return null;
    }

    return convertQuantityBetweenUnits(parsedQty, selectedUnit, selectedItem.unit);
  }, [parsedQty, selectedItem, selectedUnit]);

  const estimatedCost = conversion && selectedItem ? conversion.quantity * parsedStandardCost : null;

  return (
    <>
      <Field>
        <Label htmlFor={itemInputId}>Bahan Baku</Label>
        <Select
          id={itemInputId}
          name="itemId"
          data-tour={itemDataTour}
          required
          value={itemId}
          onChange={(event) => {
            const nextItemId = event.target.value;
            setItemId(nextItemId);

            const nextItem = items.find((item) => item.id === nextItemId);
            if (nextItem && !unitId) {
              setUnitId(nextItem.unit.id);
            }
          }}
        >
          <option value="">Pilih bahan baku</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field>
          <Label htmlFor={quantityInputId}>{quantityLabel}</Label>
          <Input
            id={quantityInputId}
            name="quantity"
            data-tour={quantityDataTour}
            type="number"
            step="0.001"
            min={0.001}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />
        </Field>
        <Field>
          <Label htmlFor={unitInputId}>Satuan Input</Label>
          <Select
            id={unitInputId}
            name="unitId"
            data-tour={unitDataTour}
            required
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
          >
            <option value="">Pilih satuan</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="rounded-2xl border border-[#ecd0ab] bg-[#fff6e9] px-4 py-3 text-sm">
        {!selectedItem ? (
          <p className="text-[#7a573e]">Pilih bahan baku dulu untuk melihat hitungan otomatis.</p>
        ) : !selectedUnit ? (
          <p className="text-[#7a573e]">Pilih satuan input untuk menghitung nilai otomatis.</p>
        ) : !Number.isFinite(parsedQty) || parsedQty <= 0 ? (
          <p className="text-[#7a573e]">Isi qty lebih dari 0 untuk melihat estimasi nilai.</p>
        ) : !conversion ? (
          <p className="text-[#a53a47]">
            Satuan input <span className="font-semibold">{getUnitDisplayName(selectedUnit)}</span> tidak bisa dikonversi ke
            satuan bahan baku <span className="font-semibold">{getUnitDisplayName(selectedItem.unit)}</span>.
          </p>
        ) : (
          <div className="space-y-1.5 text-[#5a3a28]">
            <p>
              Harga standar:{" "}
              <span className="font-semibold text-[#3f2418]">
                {currencyWithDecimals.format(parsedStandardCost)} / {getUnitDisplayName(selectedItem.unit)}
              </span>
            </p>
            <p>
              Qty sistem:{" "}
              <span className="font-semibold text-[#3f2418]">
                {decimalFormatter.format(conversion.quantity)} {getUnitDisplayName(selectedItem.unit)}
              </span>
            </p>
            <p>
              Estimasi nilai:{" "}
              <span className="font-semibold text-[#3f2418]">
                {currencyWithDecimals.format(estimatedCost ?? 0)}
              </span>
            </p>
            {conversion.converted ? (
              <p className="text-xs text-[#7a573e]">
                Konversi otomatis aktif: {decimalFormatter.format(parsedQty)} {getUnitDisplayName(selectedUnit)} ke{" "}
                {getUnitDisplayName(selectedItem.unit)}.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
