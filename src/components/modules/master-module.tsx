import { createAdminRegistrationAction } from "@/lib/actions/auth";
import { createItemAction, createSupplierAction, createUnitAction } from "@/lib/actions/master";
import { ItemRowActions, SupplierRowActions, UnitRowActions } from "@/components/modules/master-row-actions";
import { currencyFormatter, formatDateTime, formatNumber } from "@/lib/format";
import { getMasterPageData } from "@/lib/queries/master";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, Label } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";

export async function MasterModule({ entity }: { entity: string }) {
  const data = await getMasterPageData(entity);

  if (!data) {
    return (
      <Card>
        <p className="text-sm text-[#7a573e]">Modul master tidak ditemukan.</p>
      </Card>
    );
  }

  if (entity === "raw-materials") {
    const items = data.items ?? [];
    const units = data.units ?? [];

    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[430px_1fr]">
        <Card>
          <CardTitle>Master Bahan Baku</CardTitle>
          <CardDescription className="mt-3">
            Bentuk katalog bahan baku inti lengkap dengan harga standar, stok minimum, dan masa simpan.
          </CardDescription>
          <div className="mt-4 rounded-[20px] border border-[#ecd0ab] bg-[#fff6e9] px-4 py-4 text-sm text-[#6e503c]">
            Data yang rapi di sini akan mempermudah transaksi stok, stock opname, dan laporan harian.
          </div>
          <div className="mt-4 rounded-[20px] border border-[#ecd0ab] bg-[#fff6e9] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f6045]">Tambah Satuan Cepat</p>
            <p className="mt-1 text-sm text-[#6e503c]">Belum ada satuan yang dibutuhkan? Tambahkan langsung dari sini.</p>
            <form action={createUnitAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <input type="hidden" name="redirectPath" value="/master/raw-materials" />
              <Field>
                <Label htmlFor="quickUnitCode">Kode Satuan</Label>
                <Input id="quickUnitCode" name="code" placeholder="KG" required />
              </Field>
              <Field>
                <Label htmlFor="quickUnitName">Nama Satuan</Label>
                <Input id="quickUnitName" name="name" placeholder="Kilogram" required />
              </Field>
              <Button type="submit" className="h-11 whitespace-nowrap">
                + Tambah Satuan
              </Button>
            </form>
          </div>
          <form action={createItemAction} className="mt-4 space-y-3">
            <Field>
              <Label htmlFor="code">Kode Bahan</Label>
              <Input id="code" name="code" placeholder="BBK-001" data-tour="tour-material-code" required />
            </Field>
            <Field>
              <Label htmlFor="name">Nama Bahan</Label>
              <Input id="name" name="name" placeholder="Tepung Protein Tinggi" data-tour="tour-material-name" required />
            </Field>
            <Field>
              <Label htmlFor="category">Jenis Bahan</Label>
              <Input id="category" name="category" placeholder="Bahan Utama" required />
            </Field>
            <Field>
              <Label htmlFor="unitId">Satuan</Label>
              <Select id="unitId" name="unitId" data-tour="tour-material-unit" required>
                <option value="">Pilih satuan</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="standardCost">Harga Standar (Rp)</Label>
              <Input
                id="standardCost"
                name="standardCost"
                type="number"
                min={0}
                step="1"
                defaultValue="0"
                data-tour="tour-material-cost"
                required
              />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <Label htmlFor="minStock">Stok Minimum</Label>
                <Input id="minStock" name="minStock" type="number" step="0.001" defaultValue="0" data-tour="tour-material-min-stock" required />
              </Field>
              <Field>
                <Label htmlFor="shelfLifeDays">Masa Simpan (hari)</Label>
                <Input id="shelfLifeDays" name="shelfLifeDays" type="number" min={0} defaultValue="0" data-tour="tour-material-shelf-life" />
              </Field>
            </div>
            <label className="flex items-center gap-2 pt-1 text-sm text-[#4b2f1f]">
              <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 rounded border-[#d8b88b]" />
              Status aktif
            </label>
            <Button type="submit" className="w-full" data-tour="tour-material-submit">
              Simpan Bahan Baku
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Daftar Bahan Baku</CardTitle>
          <CardDescription className="mt-3">Total {items.length} bahan baku terdaftar dan siap dipakai dalam transaksi stok.</CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Nama</Th>
                  <Th>Jenis</Th>
                  <Th>Satuan</Th>
                  <Th>Harga Standar</Th>
                  <Th>Min. Stok</Th>
                  <Th>Masa Simpan</Th>
                  <Th>Status</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <Td colSpan={9} className="text-center text-[#7a573e]">
                      Belum ada data bahan baku.
                    </Td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const standardCostValue = item.standardCost ?? 0;
                    const minStockValue = item.minStock ?? 0;

                    return (
                      <tr key={item.id}>
                        <Td>{item.code}</Td>
                        <Td>{item.name}</Td>
                        <Td>{item.category}</Td>
                        <Td>{item.unit.name}</Td>
                        <Td>{currencyFormatter.format(Number(standardCostValue))}</Td>
                        <Td>{formatNumber(minStockValue)}</Td>
                        <Td>{item.shelfLifeDays ? `${item.shelfLifeDays} hari` : "-"}</Td>
                        <Td>
                          <Badge variant={item.isActive ? "success" : "neutral"}>{item.isActive ? "Aktif" : "Nonaktif"}</Badge>
                        </Td>
                        <Td>
                          <ItemRowActions
                            item={{
                              id: item.id,
                              code: item.code,
                              name: item.name,
                              category: item.category,
                              unitId: item.unitId,
                              standardCost: String(standardCostValue),
                              minStock: String(minStockValue),
                              shelfLifeDays: item.shelfLifeDays ?? null,
                              isActive: item.isActive,
                            }}
                            units={units.map((unit) => ({ id: unit.id, name: unit.name }))}
                          />
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </TableWrapper>
        </Card>
      </div>
    );
  }

  if (entity === "units") {
    const units = data.units ?? [];

    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardTitle>Master Satuan</CardTitle>
          <CardDescription className="mt-3">Standarisasi satuan akan menjaga konsistensi input quantity di seluruh modul.</CardDescription>
          <form action={createUnitAction} className="mt-4 space-y-3">
            <Field>
              <Label htmlFor="code">Kode</Label>
              <Input id="code" name="code" placeholder="KG" data-tour="tour-unit-code" required />
            </Field>
            <Field>
              <Label htmlFor="name">Nama Satuan</Label>
              <Input id="name" name="name" placeholder="Kilogram" data-tour="tour-unit-name" required />
            </Field>
            <Button type="submit" className="w-full" data-tour="tour-unit-submit">
              Simpan Satuan
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Daftar Satuan</CardTitle>
          <CardDescription className="mt-3">Saat ini ada {units.length} satuan yang bisa dipakai untuk stok bahan baku.</CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Nama</Th>
                  <Th>Dibuat</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {units.length === 0 ? (
                  <tr>
                    <Td colSpan={4} className="text-center text-[#7a573e]">
                      Belum ada data satuan.
                    </Td>
                  </tr>
                ) : (
                  units.map((unit) => (
                    <tr key={unit.id}>
                      <Td>{unit.code}</Td>
                      <Td>{unit.name}</Td>
                      <Td>{formatDateTime(unit.createdAt)}</Td>
                      <Td>
                        <UnitRowActions unit={{ id: unit.id, code: unit.code, name: unit.name }} />
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableWrapper>
        </Card>
      </div>
    );
  }

  if (entity === "suppliers") {
    const suppliers = data.suppliers ?? [];

    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardTitle>Master Supplier</CardTitle>
          <CardDescription className="mt-3">
            Simpan supplier aktif beserta kontak dan jenis bahan yang mereka suplai untuk monitoring pengadaan.
          </CardDescription>
          <form action={createSupplierAction} className="mt-4 space-y-3">
            <Field>
              <Label htmlFor="name">Nama Supplier</Label>
              <Input id="name" name="name" placeholder="PT Bahan Roti Nusantara" required />
            </Field>
            <Field>
              <Label htmlFor="contact">Kontak</Label>
              <Input id="contact" name="contact" placeholder="0812xxxxxxx" />
            </Field>
            <Field>
              <Label htmlFor="address">Alamat</Label>
              <Input id="address" name="address" placeholder="Jl. Industri No. 88" />
            </Field>
            <Field>
              <Label htmlFor="suppliedProduct">Bahan Disuplai</Label>
              <Input id="suppliedProduct" name="suppliedProduct" placeholder="Tepung, gula, mentega" />
            </Field>
            <label className="flex items-center gap-2 pt-1 text-sm text-[#4b2f1f]">
              <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 rounded border-[#d8b88b]" />
              Supplier aktif
            </label>
            <Button type="submit" className="w-full">
              Simpan Supplier
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Daftar Supplier</CardTitle>
          <CardDescription className="mt-3">Kelola relasi supplier dengan tampilan yang lebih jelas untuk proses pembelian bahan baku.</CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Nama</Th>
                  <Th>Kontak</Th>
                  <Th>Alamat</Th>
                  <Th>Bahan Disuplai</Th>
                  <Th>Status</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <Td colSpan={6} className="text-center text-[#7a573e]">
                      Belum ada data supplier.
                    </Td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <Td>{supplier.name}</Td>
                      <Td>{supplier.contact ?? "-"}</Td>
                      <Td>{supplier.address ?? "-"}</Td>
                      <Td>{supplier.suppliedProduct ?? "-"}</Td>
                      <Td>
                        <Badge variant={supplier.isActive ? "success" : "neutral"}>
                          {supplier.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </Td>
                      <Td>
                        <SupplierRowActions
                          supplier={{
                            id: supplier.id,
                            name: supplier.name,
                            contact: supplier.contact,
                            address: supplier.address,
                            suppliedProduct: supplier.suppliedProduct,
                            isActive: supplier.isActive,
                          }}
                        />
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableWrapper>
        </Card>
      </div>
    );
  }

  if (entity === "register") {
    const users = data.users ?? [];

    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[430px_1fr]">
        <Card>
          <CardTitle>Registrasi Admin Baru</CardTitle>
          <CardDescription className="mt-3">
            Tambahkan admin baru dengan akses langsung aktif agar operasional harian tetap cepat dan sederhana.
          </CardDescription>
          <div className="mt-4 rounded-[20px] border border-[#ecd0ab] bg-[#fff6e9] px-4 py-4 text-sm text-[#6e503c]">
            Username hanya huruf dan angka. Password minimal 6 karakter.
          </div>
          <form action={createAdminRegistrationAction} className="mt-4 space-y-3">
            <Field>
              <Label htmlFor="name">Nama Admin</Label>
              <Input id="name" name="name" placeholder="Nama lengkap" required />
            </Field>
            <Field>
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" placeholder="admin123" required />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </Field>
              <Field>
                <Label htmlFor="confirmPassword">Konfirmasi</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
              </Field>
            </div>
            <Button type="submit" className="w-full">
              Daftarkan Admin
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Admin Terdaftar</CardTitle>
          <CardDescription className="mt-3">Total {users.length} admin aktif tersedia untuk mengelola sistem stock opname.</CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Nama</Th>
                  <Th>Username</Th>
                  <Th>Status</Th>
                  <Th>Dibuat</Th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <Td colSpan={4} className="text-center text-[#7a573e]">
                      Belum ada admin terdaftar.
                    </Td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <Td>{user.name}</Td>
                      <Td>{user.username ?? "-"}</Td>
                      <Td>
                        <Badge variant={user.status === "ACTIVE" ? "success" : "neutral"}>
                          {user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </Td>
                      <Td>{formatDateTime(user.createdAt)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableWrapper>
        </Card>
      </div>
    );
  }

  return null;
}
