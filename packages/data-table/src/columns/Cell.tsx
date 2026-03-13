import { useLayoutEffect, useMemo } from 'react'
import type { ReactNode } from 'react'

import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { useColumnId } from './Column'
import { createRegistryCell } from './registry'

import type { Row } from '../interfaces'
import type { ColumnInfo } from './Column'
import type { ColumnState } from './column-state'

/**
 * The parameters passed to a cell renderer.
 *
 * @group Components
 */
export interface CellRenderParams {
  columnKey: string
  column: ColumnInfo
  columnState: ColumnState
  row: Row<unknown>
  cellValue: unknown
  overlaidByScrollbar: boolean
}

/**
 * The render function used by a cell definition.
 *
 * @group Components
 */
export type CellRenderFunction = (params: CellRenderParams) => ReactNode

const { cell$: cellRenderers$, register$: cellRendererRegister$ } = createRegistryCell<CellRenderFunction>()
const { cell$: cellClassNames$, register$: cellClassNameRegister$ } = createRegistryCell<string>()
export { cellRenderers$, cellClassNames$ }

export namespace CellDefinition {
  /**
   * The properties accepted by the `Cell` component.
   *
   * @group Components
   */
  export interface Props {
    children: CellRenderFunction
    className?: string
  }
}

export type CellProps = CellDefinition.Props

/**
 * Declares the cell renderer for the current column.
 *
 * @group Components
 */
export function CellDefinition({ children, className }: CellDefinition.Props) {
  const colId = useColumnId()
  const cellRendererRegister = usePublisher(cellRendererRegister$)
  const cellClassNameRegister = usePublisher(cellClassNameRegister$)

  useLayoutEffect(() => {
    cellRendererRegister({ type: 'add', id: colId, value: children })
    return () => {
      cellRendererRegister({ type: 'remove', id: colId })
    }
  }, [cellRendererRegister, colId, children])

  useLayoutEffect(() => {
    if (className === undefined) {
      cellClassNameRegister({ type: 'remove', id: colId })
      return
    }

    cellClassNameRegister({ type: 'add', id: colId, value: className })
    return () => {
      cellClassNameRegister({ type: 'remove', id: colId })
    }
  }, [cellClassNameRegister, className, colId])

  return null
}

interface CellRendererProps {
  columnKey: string
  column: ColumnInfo
  columnState: ColumnState
  row: Row<unknown>
  cellRenderFunction: CellRenderFunction | undefined
  overlaidByScrollbar: boolean
}

export function CellRenderer({ columnKey, column, columnState, row, cellRenderFunction, overlaidByScrollbar }: CellRendererProps) {
  const cellValue = (row.data as Record<string, unknown>)?.[column.field]

  if (process.env.NODE_ENV !== 'production' && row.data && typeof row.data === 'object' && !(column.field in row.data)) {
    console.warn(
      `[VirtuosoDataTable] Column field "${column.field}" not found in row data at index ${row.index}. Available fields: ${Object.keys(row.data).join(', ')}`
    )
  }

  const content = useMemo(() => {
    if (cellRenderFunction) {
      return cellRenderFunction({ columnKey, column, columnState, row, cellValue, overlaidByScrollbar })
    }

    return cellValue === null || cellValue === undefined ? '' : String(cellValue)
  }, [cellRenderFunction, columnKey, column, columnState, row, cellValue, overlaidByScrollbar])

  return content
}
