import * as React from 'react'

import { useCellValue } from '@virtuoso.dev/reactive-engine-react'

import { ColumnDeclarationScope } from '../../columns/Column'
import { initialData$ } from '../../core/data'
import { dataModel$ } from '../../model/model-bridge'

import type { DataModelHandle } from '../../model/types'

/**
 * The parameters passed to the `DynamicColumns` render function after the
 * table captures its first non-empty data result.
 *
 * @group Components
 */
export interface DynamicColumnsRenderParams<Row, Group = never> {
  data: readonly (Row | Group)[]
  model: DataModelHandle<Row | Group>
}

/**
 * The properties accepted by the `DynamicColumns` component.
 *
 * @group Components
 */
export interface DynamicColumnsProps<Row, Group = never> {
  children: (params: DynamicColumnsRenderParams<Row, Group>) => React.ReactNode
}

/**
 * Declares columns from the table's first non-empty data result.
 *
 * `DynamicColumns` renders nothing until the table captures data, then calls
 * its render function with stable `data` and `model` references for the current
 * table engine lifetime. The render function follows normal React render
 * semantics and may be called again if React re-renders this component.
 *
 * To discover columns again, remount the table by changing the `key` on
 * `VirtuosoDataTable`.
 *
 * @group Components
 */
export function DynamicColumns<Row, Group = never>({ children }: DynamicColumnsProps<Row, Group>) {
  const data = useCellValue(initialData$) as readonly (Row | Group)[] | null
  const model = useCellValue(dataModel$) as DataModelHandle<Row | Group> | null
  const content = data === null || model === null ? null : children({ data, model })

  return <ColumnDeclarationScope>{content}</ColumnDeclarationScope>
}
