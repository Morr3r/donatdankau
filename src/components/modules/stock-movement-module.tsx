import { movementCategoryLabel } from "@/lib/constants";
import {
  createAdjustmentAction,
  createStockInAction,
  createStockOutAction,
} from "@/lib/actions/stock";
import { AdjustmentRowActions, StockInRowActions, StockOutRowActions } from "@/components/modules/stock-row-actions";
import { StockQuantityCalculatorField } from "@/components/modules/stock-quantity-calculator-field";
import { formatDateTime, formatNumber } from "@/lib/format";
import { getStockMovementPageData } from "@/lib/queries/stock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, Label } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";

const stockInCategoryOptions = ["PURCHASE", "RETURN", "PRODUCTION", "ADJUSTMENT", "OTHER"] as const;
const stockOutCategoryOptions = ["PRODUCTION", "DAMAGED", "EXPIRED", "TRANSFER", "ADJUSTMENT", "OTHER"] as const;

export async function StockMovementModule({ section }: { section: string }) {
  const data = await getStockMovementPageData(section);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageData = data as any;

  if (!data) {
    return (
      <Card>
        <p className="text-sm text-[#7a573e]">Modul pergerakan stok tidak ditemukan.</p>
      </Card>
    );
  }

  if (section === "in" && "movements" in data) {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[450px_1fr]">
        <Card>
          <CardTitle>Input Stok Masuk Bahan Baku</CardTitle>
          <CardDescription className="mt-3">
            Catat barang masuk agar stok sistem bertambah sesuai stok fisik di toko.
          </CardDescription>
          <form action={createStockInAction} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <Label htmlFor="movementDate">Tanggal</Label>
                <Input id="movementDate" name="movementDate" type="datetime-local" />
              </Field>
              <Field>
                <Label htmlFor="transactionNumber">No. Transaksi</Label>
                <Input id="transactionNumber" name="transactionNumber" placeholder="Auto" />
              </Field>
            </div>
            <StockQuantityCalculatorField
              items={(pageData.items ?? []).map((item) => ({
                id: item.id,
                name: item.name,
                standardCost: item.standardCost,
                unit: {
                  id: item.unit.id,
                  code: item.unit.code,
                  name: item.unit.name,
                },
              }))}
              units={(pageData.units ?? []).map((unit) => ({
                id: unit.id,
                code: unit.code,
                name: unit.name,
              }))}
              itemInputId="itemId"
              quantityInputId="quantity"
              unitInputId="unitId"
              quantityLabel="Qty Masuk"
              itemDataTour="tour-stockin-item"
              quantityDataTour="tour-stockin-qty"
              unitDataTour="tour-stockin-unit"
            />
            <input type="hidden" name="destinationLocationId" value={pageData.defaultLocation.id} />
            <Field>
              <Label htmlFor="sourceSupplierId">Supplier / Sumber</Label>
              <Select id="sourceSupplierId" name="sourceSupplierId">
                <option value="">Tanpa supplier</option>
                {(pageData.suppliers ?? []).map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="category">Jenis Transaksi</Label>
              <Select id="category" name="category" defaultValue="PURCHASE">
                {stockInCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {movementCategoryLabel[category]}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <Label htmlFor="batchCode">Kode Batch</Label>
                <Input id="batchCode" name="batchCode" placeholder="Opsional" />
              </Field>
              <Field>
                <Label htmlFor="expiryDate">Tanggal Expired</Label>
                <Input id="expiryDate" name="expiryDate" type="date" />
              </Field>
            </div>
            <Field>
              <Label htmlFor="reason">Keterangan</Label>
              <Input id="reason" name="reason" placeholder="Catatan transaksi" />
            </Field>
            <Button type="submit" className="w-full" data-tour="tour-stockin-submit">
              Simpan Stok Masuk
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Histori Stok Masuk</CardTitle>
          <CardDescription className="mt-3">Lihat riwayat stok masuk yang sudah Anda catat.</CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>No. Transaksi</Th>
                  <Th>Item</Th>
                  <Th>Qty</Th>
                  <Th>Supplier</Th>
                  <Th>Input Oleh</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {(pageData.movements ?? []).length === 0 ? (
                  <tr>
                    <Td colSpan={7} className="text-center text-[#7a573e]">
                      Belum ada transaksi stok masuk.
                    </Td>
                  </tr>
                ) : (
                  (pageData.movements ?? []).map((movement) => (
                    <tr key={movement.id}>
                      <Td>{formatDateTime(movement.movementDate)}</Td>
                      <Td>{movement.transactionNumber}</Td>
                      <Td>{movement.item.name}</Td>
                      <Td>{formatNumber(movement.quantity)}</Td>
                      <Td>{movement.sourceSupplier?.name ?? "-"}</Td>
                      <Td>{movement.inputBy.name}</Td>
                      <Td>
                        <StockInRowActions
                          movement={{
                            id: movement.id,
                            transactionNumber: movement.transactionNumber,
                            movementDate: movement.movementDate.toISOString(),
                            quantity: Number(movement.quantity),
                            category: movement.category,
                            reason: movement.reason,
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

  if (section === "out" && "movements" in data) {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[450px_1fr]">
        <Card>
          <CardTitle>Input Stok Keluar Bahan Baku</CardTitle>
          <CardDescription className="mt-3">
            Catat bahan baku terpakai agar stok sistem tidak lebih besar dari stok fisik.
          </CardDescription>
          <form action={createStockOutAction} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <Label htmlFor="movementDate">Tanggal</Label>
                <Input id="movementDate" name="movementDate" type="datetime-local" />
              </Field>
              <Field>
                <Label htmlFor="transactionNumber">No. Transaksi</Label>
                <Input id="transactionNumber" name="transactionNumber" placeholder="Auto" />
              </Field>
            </div>
            <StockQuantityCalculatorField
              items={(pageData.items ?? []).map((item) => ({
                id: item.id,
                name: item.name,
                standardCost: item.standardCost,
                unit: {
                  id: item.unit.id,
                  code: item.unit.code,
                  name: item.unit.name,
                },
              }))}
              units={(pageData.units ?? []).map((unit) => ({
                id: unit.id,
                code: unit.code,
                name: unit.name,
              }))}
              itemInputId="itemId"
              quantityInputId="quantity"
              unitInputId="unitId"
              quantityLabel="Qty Keluar"
              itemDataTour="tour-stockout-item"
              quantityDataTour="tour-stockout-qty"
              unitDataTour="tour-stockout-unit"
            />
            <input type="hidden" name="sourceLocationId" value={pageData.defaultLocation.id} />
            <Field>
              <Label htmlFor="category">Jenis Keluar</Label>
              <Select id="category" name="category" defaultValue="PRODUCTION">
                {stockOutCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {movementCategoryLabel[category]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="reason">Alasan / Catatan</Label>
              <Input id="reason" name="reason" placeholder="Pemakaian produksi / rusak / expired" />
            </Field>
            <Button type="submit" className="w-full" data-tour="tour-stockout-submit">
              Simpan Stok Keluar
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Histori Stok Keluar</CardTitle>
          <CardDescription className="mt-3">Lihat riwayat bahan baku keluar yang sudah tercatat.</CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>No. Transaksi</Th>
                  <Th>Item</Th>
                  <Th>Qty</Th>
                  <Th>Kategori</Th>
                  <Th>Input Oleh</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {(pageData.movements ?? []).length === 0 ? (
                  <tr>
                    <Td colSpan={7} className="text-center text-[#7a573e]">
                      Belum ada transaksi stok keluar.
                    </Td>
                  </tr>
                ) : (
                  (pageData.movements ?? []).map((movement) => (
                    <tr key={movement.id}>
                      <Td>{formatDateTime(movement.movementDate)}</Td>
                      <Td>{movement.transactionNumber}</Td>
                      <Td>{movement.item.name}</Td>
                      <Td>{formatNumber(movement.quantity)}</Td>
                      <Td>{movementCategoryLabel[movement.category]}</Td>
                      <Td>{movement.inputBy.name}</Td>
                      <Td>
                        <StockOutRowActions
                          movement={{
                            id: movement.id,
                            transactionNumber: movement.transactionNumber,
                            movementDate: movement.movementDate.toISOString(),
                            quantity: Number(movement.quantity),
                            category: movement.category,
                            reason: movement.reason,
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

  if (section === "adjustments" && "movements" in data) {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[430px_1fr]">
        <Card>
          <CardTitle>Penyesuaian Stok Bahan Baku</CardTitle>
          <CardDescription className="mt-3">
            Gunakan adjustment jika ada selisih stok fisik, barang rusak, atau stok hilang.
          </CardDescription>
          <form action={createAdjustmentAction} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <Label htmlFor="movementDate">Tanggal</Label>
                <Input id="movementDate" name="movementDate" type="datetime-local" />
              </Field>
              <Field>
                <Label htmlFor="transactionNumber">No. Dokumen</Label>
                <Input id="transactionNumber" name="transactionNumber" placeholder="Auto" />
              </Field>
            </div>
            <input type="hidden" name="locationId" value={pageData.defaultLocation.id} />
            <StockQuantityCalculatorField
              items={(pageData.items ?? []).map((item) => ({
                id: item.id,
                name: item.name,
                standardCost: item.standardCost,
                unit: {
                  id: item.unit.id,
                  code: item.unit.code,
                  name: item.unit.name,
                },
              }))}
              units={(pageData.units ?? []).map((unit) => ({
                id: unit.id,
                code: unit.code,
                name: unit.name,
              }))}
              itemInputId="itemId"
              quantityInputId="quantity"
              unitInputId="unitId"
              quantityLabel="Qty Adjustment"
              itemDataTour="tour-adjust-item"
              quantityDataTour="tour-adjust-qty"
              unitDataTour="tour-adjust-unit"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <Label htmlFor="direction">Arah Penyesuaian</Label>
                <Select id="direction" name="direction" defaultValue="PLUS">
                  <option value="PLUS">Tambah (+)</option>
                  <option value="MINUS">Kurang (-)</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="category">Kategori</Label>
                <Select id="category" name="category" defaultValue="ADJUSTMENT">
                  <option value="ADJUSTMENT">Penyesuaian</option>
                  <option value="DAMAGED">Rusak</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="OPNAME">Selisih Opname</option>
                </Select>
              </Field>
            </div>
            <Field>
              <Label htmlFor="reason">Alasan</Label>
              <Input id="reason" name="reason" placeholder="Koreksi selisih, kehilangan, kerusakan" />
            </Field>
            <Button type="submit" className="w-full" data-tour="tour-adjust-submit">
              Simpan Penyesuaian
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Histori Penyesuaian</CardTitle>
          <CardDescription className="mt-3">Lihat riwayat koreksi stok yang pernah dilakukan.</CardDescription>
          <TableWrapper className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Tanggal</Th>
                  <Th>No. Dokumen</Th>
                  <Th>Item</Th>
                  <Th>Qty</Th>
                  <Th>Arah</Th>
                  <Th>Input Oleh</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {(pageData.movements ?? []).length === 0 ? (
                  <tr>
                    <Td colSpan={7} className="text-center text-[#7a573e]">
                      Belum ada data penyesuaian.
                    </Td>
                  </tr>
                ) : (
                  (pageData.movements ?? []).map((movement) => (
                    <tr key={movement.id}>
                      <Td>{formatDateTime(movement.movementDate)}</Td>
                      <Td>{movement.transactionNumber}</Td>
                      <Td>{movement.item.name}</Td>
                      <Td>{formatNumber(movement.quantity)}</Td>
                      <Td>
                        <Badge variant={movement.movementType === "ADJUSTMENT_PLUS" ? "success" : "warning"}>
                          {movement.movementType === "ADJUSTMENT_PLUS" ? "Tambah" : "Kurang"}
                        </Badge>
                      </Td>
                      <Td>{movement.inputBy.name}</Td>
                      <Td>
                        <AdjustmentRowActions
                          movement={{
                            id: movement.id,
                            transactionNumber: movement.transactionNumber,
                            movementDate: movement.movementDate.toISOString(),
                            quantity: Number(movement.quantity),
                            movementType: movement.movementType as "ADJUSTMENT_PLUS" | "ADJUSTMENT_MINUS",
                            category: movement.category,
                            reason: movement.reason,
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

  return null;
}
