import { useMemo } from 'react'

import { localModel } from '@virtuoso.dev/data-table'

import { ReorderDropZone, ReorderGrip } from '../../registry/new-york/data-table/column-reorder'
import { ResizeHandle } from '../../registry/new-york/data-table/column-resize'
import {
  DataTable,
  DataTableCell,
  DataTableColumn,
  DataTableColumnHeader,
  HeaderEdge,
  HeaderOverlay,
  HeaderStart,
} from '../../registry/new-york/data-table/data-table'

interface Product {
  id: string
  name: string
  price: number
  status: 'In stock' | 'Low stock' | 'Backorder'
  stock: number
}

const productNames = [
  'Standing Desk',
  'USB-C Dock',
  'Keyboard Pro',
  'Studio Headset',
  'Office Chair',
  'Microphone',
  'Curved Monitor',
  'Wireless Mouse',
  'Smart Lamp',
  'BT Speaker',
  'Fitness Band',
  'Webcam 4K',
]

const currency = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
})

const statusStyles: Record<Product['status'], string> = {
  Backorder: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
  'In stock': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  'Low stock': 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
}

function buildProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, index) => {
    const stock = (index * 7) % 36
    const status: Product['status'] = stock < 5 ? 'Backorder' : stock < 12 ? 'Low stock' : 'In stock'
    return {
      id: `SKU-${String(index + 1).padStart(4, '0')}`,
      name: `${productNames[index % productNames.length]} ${Math.floor(index / productNames.length) + 1}`,
      price: 49 + ((index * 23) % 950),
      status,
      stock,
    }
  })
}

export default function DataTableHeroDemo() {
  const model = useMemo(() => localModel({ data: buildProducts(500) }), [])

  return (
    <div className="not-content w-full">
      <DataTable
        className="rounded-xl border border-(--sl-color-gray-5) shadow-sm"
        computeRowKey={({ data }) => data.id}
        model={model}
        style={{ height: 384 }}
      >
        <DataTableColumn field="name" sticky="left">
          <DataTableColumnHeader className="min-w-[170px]">
            <HeaderStart component={ReorderGrip} />
            <HeaderOverlay component={ReorderDropZone} />
            <HeaderEdge component={ResizeHandle} />
            {() => 'Product'}
          </DataTableColumnHeader>
          <DataTableCell className="font-medium">
            {({ row }) => {
              // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
              const product = row.data as Product
              return (
                <div className="flex flex-col">
                  <span>{product.name}</span>
                  <span className="text-xs text-muted-foreground">{product.id}</span>
                </div>
              )
            }}
          </DataTableCell>
        </DataTableColumn>

        <DataTableColumn field="status">
          <DataTableColumnHeader className="min-w-[120px]">
            <HeaderStart component={ReorderGrip} />
            <HeaderOverlay component={ReorderDropZone} />
            <HeaderEdge component={ResizeHandle} />
            {() => 'Status'}
          </DataTableColumnHeader>
          <DataTableCell>
            {({ cellValue }) => {
              // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
              const status = cellValue as Product['status']
              return (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}>
                  {status}
                </span>
              )
            }}
          </DataTableCell>
        </DataTableColumn>

        <DataTableColumn field="stock">
          <DataTableColumnHeader className="min-w-[70px] justify-end">
            <HeaderStart component={ReorderGrip} />
            <HeaderOverlay component={ReorderDropZone} />
            <HeaderEdge component={ResizeHandle} />
            {() => 'Stock'}
          </DataTableColumnHeader>
          <DataTableCell className="text-right tabular-nums">{({ cellValue }) => String(cellValue)}</DataTableCell>
        </DataTableColumn>

        <DataTableColumn field="price">
          <DataTableColumnHeader className="min-w-[90px] justify-end">
            <HeaderStart component={ReorderGrip} />
            <HeaderOverlay component={ReorderDropZone} />
            <HeaderEdge component={ResizeHandle} />
            {() => 'Price'}
          </DataTableColumnHeader>
          <DataTableCell className="text-right font-medium tabular-nums">
            {({ cellValue }) => currency.format(Number(cellValue))}
          </DataTableCell>
        </DataTableColumn>
      </DataTable>
    </div>
  )
}
