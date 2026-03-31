"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import {
  deleteAdjustmentAction,
  deleteStockInAction,
  deleteStockOutAction,
  updateAdjustmentAction,
  updateStockInAction,
  updateStockOutAction,
} from "@/lib/actions/stock";
import { movementCategoryLabel } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

const stockInCategoryOptions = ["PURCHASE", "RETURN", "PRODUCTION", "ADJUSTMENT", "OTHER"] as const;
const stockOutCategoryOptions = ["PRODUCTION", "DAMAGED", "EXPIRED", "TRANSFER", "ADJUSTMENT", "OTHER"] as const;
const adjustmentCategoryOptions = ["ADJUSTMENT", "DAMAGED", "EXPIRED", "OPNAME", "OTHER"] as const;

function toDateTimeLocalValue(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function RowActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#e3c89e] bg-[#fff8ee] px-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#7a5538]"
      >
        <Pencil size={12} />
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#efb8bf] bg-[#fff1f3] px-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#a53a47]"
      >
        <Trash2 size={12} />
        Hapus
      </button>
    </div>
  );
}

type StockInRow = {
  id: string;
  transactionNumber: string;
  movementDate: string | Date;
  quantity: number | string;
  category: string;
  reason: string | null;
};

export function StockInRowActions({ movement }: { movement: StockInRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const movementDateValue = useMemo(() => toDateTimeLocalValue(movement.movementDate), [movement.movementDate]);

  return (
    <>
      <RowActionButtons onEdit={() => setEditOpen(true)} onDelete={() => setDeleteOpen(true)} />

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Stok Masuk"
        description="Perbarui transaksi tanpa keluar dari halaman."
      >
        <form action={updateStockInAction} className="space-y-3">
          <input type="hidden" name="movementId" value={movement.id} />
          <input type="hidden" name="redirectPath" value="/stock-movement/in" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <Label htmlFor={`edit-stock-in-date-${movement.id}`}>Tanggal</Label>
              <Input
                id={`edit-stock-in-date-${movement.id}`}
                name="movementDate"
                type="datetime-local"
                defaultValue={movementDateValue}
              />
            </Field>
            <Field>
              <Label htmlFor={`edit-stock-in-number-${movement.id}`}>No. Transaksi</Label>
              <Input
                id={`edit-stock-in-number-${movement.id}`}
                name="transactionNumber"
                defaultValue={movement.transactionNumber}
                required
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <Label htmlFor={`edit-stock-in-qty-${movement.id}`}>Qty</Label>
              <Input
                id={`edit-stock-in-qty-${movement.id}`}
                name="quantity"
                type="number"
                step="0.001"
                min={0.001}
                defaultValue={String(movement.quantity)}
                required
              />
            </Field>
            <Field>
              <Label htmlFor={`edit-stock-in-category-${movement.id}`}>Kategori</Label>
              <Select id={`edit-stock-in-category-${movement.id}`} name="category" defaultValue={movement.category}>
                {stockInCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {movementCategoryLabel[category]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field>
            <Label htmlFor={`edit-stock-in-reason-${movement.id}`}>Keterangan</Label>
            <Input id={`edit-stock-in-reason-${movement.id}`} name="reason" defaultValue={movement.reason ?? ""} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan Perubahan</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Hapus Stok Masuk"
        description="Stok sistem akan disesuaikan otomatis."
        widthClassName="max-w-lg"
      >
        <form action={deleteStockInAction} className="space-y-4">
          <input type="hidden" name="movementId" value={movement.id} />
          <input type="hidden" name="redirectPath" value="/stock-movement/in" />
          <p className="text-sm text-[#6e503c]">
            Yakin hapus transaksi <span className="font-semibold text-[#4b2f1f]">{movement.transactionNumber}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="border-[#ce5465] bg-[#de6a7a] text-white hover:bg-[#d45a6b]">
              Hapus
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

type StockOutRow = {
  id: string;
  transactionNumber: string;
  movementDate: string | Date;
  quantity: number | string;
  category: string;
  reason: string | null;
};

export function StockOutRowActions({ movement }: { movement: StockOutRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const movementDateValue = useMemo(() => toDateTimeLocalValue(movement.movementDate), [movement.movementDate]);

  return (
    <>
      <RowActionButtons onEdit={() => setEditOpen(true)} onDelete={() => setDeleteOpen(true)} />

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Stok Keluar"
        description="Perbarui jumlah pemakaian atau kategorinya."
      >
        <form action={updateStockOutAction} className="space-y-3">
          <input type="hidden" name="movementId" value={movement.id} />
          <input type="hidden" name="redirectPath" value="/stock-movement/out" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <Label htmlFor={`edit-stock-out-date-${movement.id}`}>Tanggal</Label>
              <Input
                id={`edit-stock-out-date-${movement.id}`}
                name="movementDate"
                type="datetime-local"
                defaultValue={movementDateValue}
              />
            </Field>
            <Field>
              <Label htmlFor={`edit-stock-out-number-${movement.id}`}>No. Transaksi</Label>
              <Input
                id={`edit-stock-out-number-${movement.id}`}
                name="transactionNumber"
                defaultValue={movement.transactionNumber}
                required
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <Label htmlFor={`edit-stock-out-qty-${movement.id}`}>Qty</Label>
              <Input
                id={`edit-stock-out-qty-${movement.id}`}
                name="quantity"
                type="number"
                step="0.001"
                min={0.001}
                defaultValue={String(movement.quantity)}
                required
              />
            </Field>
            <Field>
              <Label htmlFor={`edit-stock-out-category-${movement.id}`}>Kategori</Label>
              <Select id={`edit-stock-out-category-${movement.id}`} name="category" defaultValue={movement.category}>
                {stockOutCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {movementCategoryLabel[category]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field>
            <Label htmlFor={`edit-stock-out-reason-${movement.id}`}>Keterangan</Label>
            <Input id={`edit-stock-out-reason-${movement.id}`} name="reason" defaultValue={movement.reason ?? ""} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan Perubahan</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Hapus Stok Keluar"
        description="Stok sistem akan dikembalikan otomatis."
        widthClassName="max-w-lg"
      >
        <form action={deleteStockOutAction} className="space-y-4">
          <input type="hidden" name="movementId" value={movement.id} />
          <input type="hidden" name="redirectPath" value="/stock-movement/out" />
          <p className="text-sm text-[#6e503c]">
            Yakin hapus transaksi <span className="font-semibold text-[#4b2f1f]">{movement.transactionNumber}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="border-[#ce5465] bg-[#de6a7a] text-white hover:bg-[#d45a6b]">
              Hapus
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

type AdjustmentRow = {
  id: string;
  transactionNumber: string;
  movementDate: string | Date;
  quantity: number | string;
  movementType: "ADJUSTMENT_PLUS" | "ADJUSTMENT_MINUS";
  category: string;
  reason: string | null;
};

export function AdjustmentRowActions({ movement }: { movement: AdjustmentRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const movementDateValue = useMemo(() => toDateTimeLocalValue(movement.movementDate), [movement.movementDate]);

  return (
    <>
      <RowActionButtons onEdit={() => setEditOpen(true)} onDelete={() => setDeleteOpen(true)} />

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Adjustment"
        description="Ubah arah, jumlah, dan alasan penyesuaian."
      >
        <form action={updateAdjustmentAction} className="space-y-3">
          <input type="hidden" name="movementId" value={movement.id} />
          <input type="hidden" name="redirectPath" value="/stock-movement/adjustments" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <Label htmlFor={`edit-adj-date-${movement.id}`}>Tanggal</Label>
              <Input
                id={`edit-adj-date-${movement.id}`}
                name="movementDate"
                type="datetime-local"
                defaultValue={movementDateValue}
              />
            </Field>
            <Field>
              <Label htmlFor={`edit-adj-number-${movement.id}`}>No. Dokumen</Label>
              <Input
                id={`edit-adj-number-${movement.id}`}
                name="transactionNumber"
                defaultValue={movement.transactionNumber}
                required
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field>
              <Label htmlFor={`edit-adj-qty-${movement.id}`}>Qty</Label>
              <Input
                id={`edit-adj-qty-${movement.id}`}
                name="quantity"
                type="number"
                step="0.001"
                min={0.001}
                defaultValue={String(movement.quantity)}
                required
              />
            </Field>
            <Field>
              <Label htmlFor={`edit-adj-direction-${movement.id}`}>Arah</Label>
              <Select
                id={`edit-adj-direction-${movement.id}`}
                name="direction"
                defaultValue={movement.movementType === "ADJUSTMENT_PLUS" ? "PLUS" : "MINUS"}
              >
                <option value="PLUS">Tambah (+)</option>
                <option value="MINUS">Kurang (-)</option>
              </Select>
            </Field>
            <Field>
              <Label htmlFor={`edit-adj-category-${movement.id}`}>Kategori</Label>
              <Select id={`edit-adj-category-${movement.id}`} name="category" defaultValue={movement.category}>
                {adjustmentCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {movementCategoryLabel[category]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field>
            <Label htmlFor={`edit-adj-reason-${movement.id}`}>Alasan</Label>
            <Input id={`edit-adj-reason-${movement.id}`} name="reason" defaultValue={movement.reason ?? ""} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan Perubahan</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Hapus Adjustment"
        description="Nilai stok akan dikoreksi balik otomatis."
        widthClassName="max-w-lg"
      >
        <form action={deleteAdjustmentAction} className="space-y-4">
          <input type="hidden" name="movementId" value={movement.id} />
          <input type="hidden" name="redirectPath" value="/stock-movement/adjustments" />
          <p className="text-sm text-[#6e503c]">
            Yakin hapus transaksi <span className="font-semibold text-[#4b2f1f]">{movement.transactionNumber}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="border-[#ce5465] bg-[#de6a7a] text-white hover:bg-[#d45a6b]">
              Hapus
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
