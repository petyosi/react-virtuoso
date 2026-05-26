// oxlint-disable require-hook
import { Cell, e } from '@virtuoso.dev/reactive-engine-core'

import { scrollLeft$, viewportWidth$ } from '../scroll/dom'
import { itemsWithinOffsets } from '../sizing/itemsWithinOffsets'
import { columnWidths$, visibleColumns$ } from './Column'
import { columnCount$, columnSizeState$, totalWidth$ } from './column-sizes'
import { columnGroups$ } from './ColumnGroup'
import { getEffectiveSticky } from './header-tree'

import type { ExcludeIndicesInfo } from '../sizing/itemsWithinOffsets'

/**
 * @group State
 */
export interface ColumnItem {
  index: number
  key: string
  offset: number
  size: number
}

/**
 * @group State
 */
export interface ColumnItemsState {
  columns: ColumnItem[]
  paddingStart: number
  paddingEnd: number
  totalWidth: number
}

export const EMPTY_COLUMN_ITEMS_STATE: ColumnItemsState = {
  columns: [],
  paddingStart: 0,
  paddingEnd: 0,
  totalWidth: 0,
}

/**
 * @group State
 */
export interface StickyColumnsState {
  leftColumns: ColumnItem[]
  rightColumns: ColumnItem[]
  leftWidth: number
  rightWidth: number
  stickyIndices: Set<number>
  totalStickyWidth: number
}

export const EMPTY_STICKY_COLUMNS_STATE: StickyColumnsState = {
  leftColumns: [],
  rightColumns: [],
  leftWidth: 0,
  rightWidth: 0,
  stickyIndices: new Set(),
  totalStickyWidth: 0,
}

/**
 * @group State
 */
export const stickyColumnsState$ = Cell(EMPTY_STICKY_COLUMNS_STATE)

/**
 * @group State
 */
export interface ColumnState {
  sticky?: 'left' | 'right'
}

/**
 * @group State
 */
export type ColumnsStateMap = Map<string, ColumnState>

export const EMPTY_COLUMN_STATE: ColumnState = {}

/**
 * @group State
 */
export const columnsState$ = Cell<ColumnsStateMap>(new Map())

e.link(
  e.pipe(
    stickyColumnsState$,
    e.map(({ leftColumns, rightColumns }) => {
      const state = new Map<string, ColumnState>()
      for (const col of leftColumns) {
        state.set(col.key, { sticky: 'left' })
      }
      for (const col of rightColumns) {
        state.set(col.key, { sticky: 'right' })
      }
      return state
    })
  ),
  columnsState$
)

e.link(
  e.pipe(
    e.combine(visibleColumns$, columnWidths$, columnGroups$),
    e.map(([columnsMap, widths, groups]) => {
      const leftColumns: ColumnItem[] = []
      const rightColumns: ColumnItem[] = []
      const stickyIndices = new Set<number>()
      let leftWidth = 0
      let rightWidth = 0
      let leftOffset = 0
      let rightOffset = 0

      const entries = [...columnsMap.entries()]
      for (let index = 0; index < entries.length; index++) {
        const [key, info] = entries[index]!
        const size = widths.get(key) ?? 0

        const effectiveSticky = getEffectiveSticky(info, groups)

        if (effectiveSticky === 'left') {
          leftColumns.push({ index, key, offset: leftOffset, size })
          leftOffset += size
          leftWidth += size
          stickyIndices.add(index)
        } else if (effectiveSticky === 'right') {
          rightColumns.push({ index, key, offset: rightOffset, size })
          rightOffset += size
          rightWidth += size
          stickyIndices.add(index)
        }
      }

      const totalStickyWidth = leftWidth + rightWidth
      return { leftColumns, rightColumns, leftWidth, rightWidth, stickyIndices, totalStickyWidth }
    })
  ),
  stickyColumnsState$
)

export const columnOverscanCount$ = Cell(0)

/**
 * @group State
 */
export const columnItemsState$ = Cell(EMPTY_COLUMN_ITEMS_STATE)

e.link(
  e.pipe(
    e.combine(
      scrollLeft$,
      viewportWidth$,
      columnSizeState$,
      columnCount$,
      totalWidth$,
      visibleColumns$,
      columnOverscanCount$,
      stickyColumnsState$
    ),
    e.map(([scrollLeft, viewportWidth, sizeState, count, totalWidth, columnsMap, overscanCount, stickyState]) => {
      if (count === 0) {
        return EMPTY_COLUMN_ITEMS_STATE
      }

      const empty = sizeState.offsetTree.length === 0
      if (empty) {
        return EMPTY_COLUMN_ITEMS_STATE
      }

      const { leftWidth, rightWidth, stickyIndices, totalStickyWidth } = stickyState
      const columnKeys = [...columnsMap.keys()]

      if (stickyIndices.size === count) {
        return {
          columns: [],
          paddingStart: 0,
          paddingEnd: 0,
          totalWidth,
        }
      }

      const excludeIndicesInfo: ExcludeIndicesInfo = {
        indices: stickyIndices,
        totalExcludedSize: totalStickyWidth,
      }

      // The viewport is in "virtual" space where sticky columns don't exist.
      // The scrollable area width is viewport minus sticky widths.
      const virtualViewportWidth = viewportWidth - leftWidth - rightWidth
      let viewportLeft = scrollLeft
      let viewportRight = scrollLeft + virtualViewportWidth

      if (overscanCount > 0) {
        const estimatedColumnWidth = sizeState.lastSize
        const overscanWidth = overscanCount * estimatedColumnWidth
        viewportLeft = Math.max(0, viewportLeft - overscanWidth)
        viewportRight += overscanWidth
      }

      const {
        items: initialItems,
        paddingStart,
        paddingEnd,
      } = itemsWithinOffsets(
        sizeState.offsetTree,
        viewportLeft,
        viewportRight,
        count,
        totalWidth,
        columnKeys,
        undefined,
        excludeIndicesInfo
      )
      const items = initialItems

      return {
        columns: items.map((item) => ({
          index: item.index,
          key: item.data as string,
          offset: item.offset,
          size: item.size,
        })),
        paddingStart,
        paddingEnd,
        totalWidth,
      }
    })
  ),
  columnItemsState$
)
