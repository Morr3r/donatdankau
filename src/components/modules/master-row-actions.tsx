"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import {
  deleteItemAction,
  deleteSupplierAction,
  deleteUnitAction,
  updateItemAction,
  updateSupplierAction,
  updateUnitAction,
} from "@/lib/actions/master";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

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

export function UnitRowActions({ unit }: { unit: { id: string; code: string; name: string } }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <RowActionButtons onEdit={() => setEditOpen(true)} onDelete={() => setDeleteOpen(true)} />

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Satuan"
        description="Perbarui kode dan nama satuan."
      >
        <form action={updateUnitAction} className="space-y-3">
          <input type="hidden" name="redirectPath" value="/master/units" />
          <input type="hidden" name="unitId" value={unit.id} />
          <Field>
            <Label htmlFor={`edit-unit-code-${unit.id}`}>Kode</Label>
            <Input id={`edit-unit-code-${unit.id}`} name="code" defaultValue={unit.code} required />
          </Field>
          <Field>
            <Label htmlFor={`edit-unit-name-${unit.id}`}>Nama Satuan</Label>
            <Input id={`edit-unit-name-${unit.id}`} name="name" defaultValue={unit.name} required />
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
        title="Hapus Satuan"
        description="Data satuan yang masih dipakai tidak bisa dihapus."
        widthClassName="max-w-lg"
      >
        <form action={deleteUnitAction} className="space-y-4">
          <input type="hidden" name="redirectPath" value="/master/units" />
          <input type="hidden" name="unitId" value={unit.id} />
          <p className="text-sm text-[#6e503c]">
            Yakin hapus satuan <span className="font-semibold text-[#4b2f1f]">{unit.name}</span>?
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

type ItemRowActionsProps = {
  item: {
    id: string;
    code: string;
    name: string;
    category: string;
    unitId: string;
    standardCost: number | string;
    minStock: number | string;
    shelfLifeDays: number | null;
    isActive: boolean;
  };
  units: Array<{ id: string; name: string }>;
};

export function ItemRowActions({ item, units }: ItemRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <RowActionButtons onEdit={() => setEditOpen(true)} onDelete={() => setDeleteOpen(true)} />

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Bahan Baku"
        description="Perbarui data bahan baku dari modal ini."
      >
        <form action={updateItemAction} className="space-y-3">
          <input type="hidden" name="redirectPath" value="/master/raw-materials" />
          <input type="hidden" name="itemId" value={item.id} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <Label htmlFor={`edit-item-code-${item.id}`}>Kode Bahan</Label>
              <Input id={`edit-item-code-${item.id}`} name="code" defaultValue={item.code} required />
            </Field>
            <Field>
              <Label htmlFor={`edit-item-name-${item.id}`}>Nama Bahan</Label>
              <Input id={`edit-item-name-${item.id}`} name="name" defaultValue={item.name} required />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <Label htmlFor={`edit-item-category-${item.id}`}>Kategori</Label>
              <Input id={`edit-item-category-${item.id}`} name="category" defaultValue={item.category} required />
            </Field>
            <Field>
              <Label htmlFor={`edit-item-unit-${item.id}`}>Satuan</Label>
              <Select id={`edit-item-unit-${item.id}`} name="unitId" defaultValue={item.unitId} required>
                <option value="">Pilih satuan</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field>
              <Label htmlFor={`edit-item-cost-${item.id}`}>Harga Standar</Label>
              <Input
                id={`edit-item-cost-${item.id}`}
                name="standardCost"
                type="number"
                min={0}
                step="1"
                defaultValue={String(item.standardCost)}
                required
              />
            </Field>
            <Field>
              <Label htmlFor={`edit-item-min-${item.id}`}>Stok Minimum</Label>
              <Input
                id={`edit-item-min-${item.id}`}
                name="minStock"
                type="number"
                min={0}
                step="0.001"
                defaultValue={String(item.minStock)}
                required
              />
            </Field>
            <Field>
              <Label htmlFor={`edit-item-shelf-${item.id}`}>Masa Simpan (hari)</Label>
              <Input
                id={`edit-item-shelf-${item.id}`}
                name="shelfLifeDays"
                type="number"
                min={0}
                defaultValue={item.shelfLifeDays ?? 0}
              />
            </Field>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-[#4b2f1f]">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={item.isActive}
              className="h-4 w-4 rounded border-[#d8b88b]"
            />
            Aktif
          </label>

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
        title="Hapus Bahan Baku"
        description="Bahan baku akan disembunyikan dari daftar aktif."
        widthClassName="max-w-lg"
      >
        <form action={deleteItemAction} className="space-y-4">
          <input type="hidden" name="redirectPath" value="/master/raw-materials" />
          <input type="hidden" name="itemId" value={item.id} />
          <p className="text-sm text-[#6e503c]">
            Yakin hapus bahan baku <span className="font-semibold text-[#4b2f1f]">{item.name}</span>?
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

type SupplierRowActionsProps = {
  supplier: {
    id: string;
    name: string;
    contact: string | null;
    address: string | null;
    suppliedProduct: string | null;
    isActive: boolean;
  };
};

export function SupplierRowActions({ supplier }: SupplierRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <RowActionButtons onEdit={() => setEditOpen(true)} onDelete={() => setDeleteOpen(true)} />

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Supplier"
        description="Perbarui informasi supplier tanpa pindah halaman."
      >
        <form action={updateSupplierAction} className="space-y-3">
          <input type="hidden" name="redirectPath" value="/master/suppliers" />
          <input type="hidden" name="supplierId" value={supplier.id} />
          <Field>
            <Label htmlFor={`edit-supplier-name-${supplier.id}`}>Nama Supplier</Label>
            <Input id={`edit-supplier-name-${supplier.id}`} name="name" defaultValue={supplier.name} required />
          </Field>
          <Field>
            <Label htmlFor={`edit-supplier-contact-${supplier.id}`}>Kontak</Label>
            <Input id={`edit-supplier-contact-${supplier.id}`} name="contact" defaultValue={supplier.contact ?? ""} />
          </Field>
          <Field>
            <Label htmlFor={`edit-supplier-address-${supplier.id}`}>Alamat</Label>
            <Input id={`edit-supplier-address-${supplier.id}`} name="address" defaultValue={supplier.address ?? ""} />
          </Field>
          <Field>
            <Label htmlFor={`edit-supplier-product-${supplier.id}`}>Bahan Disuplai</Label>
            <Input
              id={`edit-supplier-product-${supplier.id}`}
              name="suppliedProduct"
              defaultValue={supplier.suppliedProduct ?? ""}
            />
          </Field>
          <label className="inline-flex items-center gap-2 text-sm text-[#4b2f1f]">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={supplier.isActive}
              className="h-4 w-4 rounded border-[#d8b88b]"
            />
            Supplier aktif
          </label>
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
        title="Hapus Supplier"
        description="Supplier akan dinonaktifkan dari daftar aktif."
        widthClassName="max-w-lg"
      >
        <form action={deleteSupplierAction} className="space-y-4">
          <input type="hidden" name="redirectPath" value="/master/suppliers" />
          <input type="hidden" name="supplierId" value={supplier.id} />
          <p className="text-sm text-[#6e503c]">
            Yakin hapus supplier <span className="font-semibold text-[#4b2f1f]">{supplier.name}</span>?
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
