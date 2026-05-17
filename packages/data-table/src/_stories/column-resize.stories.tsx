import type { CSSProperties } from 'react'

import { ReorderDropZone, ReorderGrip } from '@/components/ui/data-table/column-reorder'
import { ResizeHandle } from '@/components/ui/data-table/column-resize'

import { Cell } from '..'
import { Column } from '../columns/Column'
import { ColumnHeader } from '../columns/ColumnHeader'
import { HeaderEdge, HeaderOverlay, HeaderStart } from '../columns/header-slots/slots'
import { LocalDataTable as VirtuosoDataTable } from '../tests/LocalDataTable'

const COLUMN_COUNT = 6
const ITEM_COUNT = 50
const LIST_STYLE: CSSProperties = { height: 400, width: 720 }
const BASE_HEADER_CLASSNAME = 'flex h-10 items-center px-3 text-sm font-medium text-foreground whitespace-nowrap'

const ITEMS = Array.from({ length: ITEM_COUNT }, (_row, rowIndex) =>
  Object.fromEntries(
    Array.from({ length: COLUMN_COUNT }, (_column, columnIndex) => [`col${columnIndex}`, `R${rowIndex + 1}C${columnIndex + 1}`])
  )
)

export function BasicColumnResize() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      {Array.from({ length: COLUMN_COUNT }, (_, index) => (
        <Column key={`col${index}`} field={`col${index}`}>
          <ColumnHeader className={BASE_HEADER_CLASSNAME}>
            <HeaderEdge component={ResizeHandle} />
            {({ column }) => column.field}
          </ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

export function ResizeWithReorder() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      {Array.from({ length: COLUMN_COUNT }, (_, index) => (
        <Column key={`col${index}`} field={`col${index}`}>
          <ColumnHeader className={BASE_HEADER_CLASSNAME}>
            <HeaderStart component={ReorderGrip} />
            <HeaderOverlay component={ReorderDropZone} />
            <HeaderEdge component={ResizeHandle} />
            {({ column }) => column.field}
          </ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}
