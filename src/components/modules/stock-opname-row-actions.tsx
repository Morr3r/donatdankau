"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { deleteOpnameAction, deleteOpnameItemAction, updateOpnameAction, updateOpnameItemAction } from "@/lib/actions/stock";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

function toDateValue(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

type DraftOpname = {
  id: string;
  documentNumber: string;
  opnameDate: string | Date;
  notes: string | null;
};

export function DraftOpnameRowActions({ opname }: { opname: DraftOpname }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const opnameDateValue = useMemo(() => toDateValue(opname.opnameDate), [opname.opnameDate]);

  return (
    <>
      <RowActionButtons onEdit={() => setEditOpen(true)} onDelete={() => setDeleteOpen(true)} />

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Dokumen Opname"
        description="Perbarui nomor dokumen, tanggal, dan catatan."
      >
        <form action={updateOpnameAction} className="space-y-3">
          <input type="hidden" name="opnameId" value={opname.id} />
          <input type="hidden" name="redirectPath" value="/stock-opname/create" />
          <Field>
            <Label htmlFor={`edit-opname-number-${opname.id}`}>Nomor Dokumen</Label>
            <Input
              id={`edit-opname-number-${opname.id}`}
              name="documentNumber"
              defaultValue={opname.documentNumber}
              required
            />
          </Field>
          <Field>
            <Label htmlFor={`edit-opname-date-${opname.id}`}>Tanggal Opname</Label>
            <Input id={`edit-opname-date-${opname.id}`} name="opnameDate" type="date" defaultValue={opnameDateValue} required />
          </Field>
          <Field>
            <Label htmlFor={`edit-opname-notes-${opname.id}`}>Catatan</Label>
            <Input id={`edit-opname-notes-${opname.id}`} name="notes" defaultValue={opname.notes ?? ""} />
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
        title="Hapus Dokumen Opname"
        description="Dokumen draft dan item hitungnya akan dihapus."
        widthClassName="max-w-lg"
      >
        <form action={deleteOpnameAction} className="space-y-4">
          <input type="hidden" name="opnameId" value={opname.id} />
          <input type="hidden" name="redirectPath" value="/stock-opname/create" />
          <p className="text-sm text-[#6e503c]">
            Yakin hapus dokumen <span className="font-semibold text-[#4b2f1f]">{opname.documentNumber}</span>?
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

type OpnameItemRow = {
  id: string;
  opnameId: string;
  itemName: string;
  physicalStock: number | string;
  note: string | null;
};

export function OpnameItemRowActions({ row }: { row: OpnameItemRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const redirectPath = `/stock-opname/process?id=${row.opnameId}`;

  return (
    <>
      <RowActionButtons onEdit={() => setEditOpen(true)} onDelete={() => setDeleteOpen(true)} />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Hasil Hitung" description={row.itemName}>
        <form action={updateOpnameItemAction} className="space-y-3">
          <input type="hidden" name="opnameItemId" value={row.id} />
          <input type="hidden" name="redirectPath" value={redirectPath} />
          <Field>
            <Label htmlFor={`edit-opname-item-qty-${row.id}`}>Stok Saat Ini</Label>
            <Input
              id={`edit-opname-item-qty-${row.id}`}
              name="physicalStock"
              type="number"
              step="0.001"
              min={0}
              defaultValue={String(row.physicalStock)}
              required
            />
          </Field>
          <Field>
            <Label htmlFor={`edit-opname-item-note-${row.id}`}>Catatan</Label>
            <Input id={`edit-opname-item-note-${row.id}`} name="note" defaultValue={row.note ?? ""} />
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
        title="Hapus Item Hasil Hitung"
        description="Item akan dikeluarkan dari rekonsiliasi dokumen ini."
        widthClassName="max-w-lg"
      >
        <form action={deleteOpnameItemAction} className="space-y-4">
          <input type="hidden" name="opnameItemId" value={row.id} />
          <input type="hidden" name="redirectPath" value={redirectPath} />
          <p className="text-sm text-[#6e503c]">
            Yakin hapus item <span className="font-semibold text-[#4b2f1f]">{row.itemName}</span>?
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
