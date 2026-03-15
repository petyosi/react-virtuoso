import { useLayoutEffect, useMemo } from 'react'
import type { ReactNode } from 'react'

import { usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { useColumnId } from './Column'
import { createRegistryCell } from './registry'

import type { Row } from '../interfaces'
import type { ColumnInfo } from './Column'
import type { ColumnState } from './column-state'

export interface CellRenderParams {
  columnKey: string
  column: ColumnInfo
  columnState: ColumnState
  row: Row<unknown>
  cellValue: unknown
  overlaidByScrollbar: boolean
}

export type CellRenderFunction = (params: CellRenderParams) => ReactNode

const { cell$: cellRenderers$, register$: cellRendererRegister$ } = createRegistryCell<CellRenderFunction>()
export { cellRenderers$ }

export namespace CellDefinition {
  export interface Props {
    children: CellRenderFunction
  }
}

export function CellDefinition({ children }: CellDefinition.Props) {
  const colId = useColumnId()
  const cellRendererRegister = usePublisher(cellRendererRegister$)

  useLayoutEffect(() => {
    cellRendererRegister({ type: 'add', id: colId, value: children })
    return () => {
      cellRendererRegister({ type: 'remove', id: colId })
    }
  }, [cellRendererRegister, colId, children])

  return null
}

export interface CellRendererProps {
  columnKey: string
  column: ColumnInfo
  columnState: ColumnState
  row: Row<unknown>
  cellRenderFunction: CellRenderFunction | undefined
  overlaidByScrollbar: boolean
}

export function CellRenderer({ columnKey, column, columnState, row, cellRenderFunction, overlaidByScrollbar }: CellRendererProps) {
  const cellValue = (row.data as Record<string, unknown>)?.[column.field]

  const content = useMemo(() => {
    if (cellRenderFunction) {
      return cellRenderFunction({ columnKey, column, columnState, row, cellValue, overlaidByScrollbar })
    }

    return cellValue === null || cellValue === undefined ? '' : String(cellValue)
  }, [cellRenderFunction, columnKey, column, columnState, row, cellValue, overlaidByScrollbar])

  return content
}
