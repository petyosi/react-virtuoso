import React from 'react'

import { useCellValue, useEngine } from '@virtuoso.dev/reactive-engine-react'

import { cellRenderers$, CellRenderer } from '../columns/Cell'
import { columns$ } from '../columns/Column'
import { columnItemsState$, columnsState$, EMPTY_COLUMN_STATE, stickyColumnsState$ } from '../columns/column-state'
import { groupIndexSet$, groupLevelMap$ } from '../core/data'
import { unstableEnableRowRenderEvents$, unstableRowRender$ } from '../debug/row-render-events'
import { resizeObserverSingleton$ } from '../resize/resize-observer-singleton'
import { ROW_ROLE } from '../resize/resize-observing'
import { ranges$ } from '../resize/sizes'
import { hasHorizontalScroll$ } from '../scroll/dom'
import { VirtuosoDataTableTestingContext } from '../VirtuosoDataTableTestingContext'
import { groupHeaderRenderer$ } from './GroupHeaderCell'

import type { Item } from '../interfaces'
import type { GroupHeaderRenderFunction } from './GroupHeaderCell'

interface RowProps {
  row: Item<unknown>
  sticky?: boolean
  stickyTop?: number
  stickyZIndex?: number
}

interface RowCellSectionProps {
  row: Item<unknown>
  sticky?: boolean | undefined
}

const ROW_BASE_STYLE: React.CSSProperties = {
  overflowAnchor: 'none',
  position: 'absolute',
  display: 'flex',
}

const COLUMN_CELL_BASE_STYLE: React.CSSProperties = {
  flexShrink: 0,
  flexGrow: 0,
  overflowX: 'hidden',
  minHeight: 1,
}

const LEFT_STICKY_CONTAINER_STYLE: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  display: 'flex',
}

const RIGHT_STICKY_CONTAINER_STYLE: React.CSSProperties = {
  position: 'sticky',
  right: 0,
  zIndex: 2,
  display: 'flex',
}

const SCROLLABLE_CELLS_CONTAINER_STYLE: React.CSSProperties = {
  display: 'flex',
}

// Sticky and scrollable cell sections are separate memoized components so that
// horizontal scroll (which only changes columnItemsState$) re-renders ScrollableCells alone,
// leaving sticky cells untouched.

function useUnstableRowRenderEvent({
  row,
  sticky,
  group,
  section,
  disabled = false,
}: {
  row: Item<unknown>
  sticky?: boolean | undefined
  group: boolean
  section: 'row' | 'scrollable' | 'sticky-left' | 'sticky-right'
  disabled?: boolean
}) {
  const unstableRowRenderEventsEnabled = useCellValue(unstableEnableRowRenderEvents$)
  const engine = useEngine()

  React.useLayoutEffect(() => {
    if (disabled || !unstableRowRenderEventsEnabled) {
      return
    }

    engine.pub(unstableRowRender$, {
      index: row.index,
      sticky: Boolean(sticky),
      group,
      section,
    })
  })
}

const StickyLeftCells = React.memo<RowCellSectionProps>(function StickyLeftCells({ row, sticky }) {
  const stickyState = useCellValue(stickyColumnsState$)
  const columns = useCellValue(columns$)
  const cellRenderers = useCellValue(cellRenderers$)
  const columnsState = useCellValue(columnsState$)

  const leftStickyCellStyles = React.useMemo(
    () =>
      stickyState.leftColumns.map((col) => ({
        key: col.key,
        style: {
          ...COLUMN_CELL_BASE_STYLE,
          width: col.size,
        },
      })),
    [stickyState.leftColumns]
  )

  useUnstableRowRenderEvent({
    row,
    sticky,
    group: false,
    section: 'sticky-left',
    disabled: leftStickyCellStyles.length === 0,
  })

  if (leftStickyCellStyles.length === 0) {
    return null
  }

  return (
    <div style={LEFT_STICKY_CONTAINER_STYLE} data-sticky="left">
      {leftStickyCellStyles.map((col) => {
        const column = columns.get(col.key)
        if (!column) {
          return null
        }
        return (
          <div key={col.key} style={col.style}>
            <CellRenderer
              columnKey={col.key}
              column={column}
              columnState={columnsState.get(col.key) ?? EMPTY_COLUMN_STATE}
              row={row}
              cellRenderFunction={cellRenderers.get(col.key)}
              overlaidByScrollbar={false}
            />
          </div>
        )
      })}
    </div>
  )
})

const ScrollableCells = React.memo<RowCellSectionProps>(function ScrollableCells({ row, sticky }) {
  const columnItemsState = useCellValue(columnItemsState$)
  const columns = useCellValue(columns$)
  const cellRenderers = useCellValue(cellRenderers$)
  const columnsState = useCellValue(columnsState$)

  const scrollableCellsContainerStyle = React.useMemo<React.CSSProperties>(
    () => ({
      ...SCROLLABLE_CELLS_CONTAINER_STYLE,
      marginLeft: columnItemsState.paddingStart,
      marginRight: columnItemsState.paddingEnd,
    }),
    [columnItemsState.paddingStart, columnItemsState.paddingEnd]
  )

  const columnCellStyles = React.useMemo(
    () =>
      columnItemsState.columns.map((col) => ({
        key: col.key,
        style: {
          ...COLUMN_CELL_BASE_STYLE,
          width: col.size,
        },
      })),
    [columnItemsState.columns]
  )

  useUnstableRowRenderEvent({
    row,
    sticky,
    group: false,
    section: 'scrollable',
    disabled: columnCellStyles.length === 0,
  })

  return (
    <div style={scrollableCellsContainerStyle} data-scrollable="true">
      {columnCellStyles.map((col) => {
        const column = columns.get(col.key)
        if (!column) {
          return null
        }
        return (
          <div key={col.key} style={col.style}>
            <CellRenderer
              columnKey={col.key}
              column={column}
              columnState={columnsState.get(col.key) ?? EMPTY_COLUMN_STATE}
              row={row}
              cellRenderFunction={cellRenderers.get(col.key)}
              overlaidByScrollbar={false}
            />
          </div>
        )
      })}
    </div>
  )
})

const StickyRightCells = React.memo<RowCellSectionProps>(function StickyRightCells({ row, sticky }) {
  const stickyState = useCellValue(stickyColumnsState$)
  const columns = useCellValue(columns$)
  const cellRenderers = useCellValue(cellRenderers$)
  const columnsState = useCellValue(columnsState$)
  const hasHorizontalScroll = useCellValue(hasHorizontalScroll$)

  const rightStickyCellStyles = React.useMemo(
    () =>
      stickyState.rightColumns.map((col) => ({
        key: col.key,
        style: {
          ...COLUMN_CELL_BASE_STYLE,
          width: col.size,
        },
      })),
    [stickyState.rightColumns]
  )

  useUnstableRowRenderEvent({
    row,
    sticky,
    group: false,
    section: 'sticky-right',
    disabled: rightStickyCellStyles.length === 0,
  })

  if (rightStickyCellStyles.length === 0) {
    return null
  }

  return (
    <div style={RIGHT_STICKY_CONTAINER_STYLE} data-sticky="right">
      {rightStickyCellStyles.map((col, index) => {
        const column = columns.get(col.key)
        if (!column) {
          return null
        }
        const isLast = index === rightStickyCellStyles.length - 1
        return (
          <div key={col.key} style={col.style}>
            <CellRenderer
              columnKey={col.key}
              column={column}
              columnState={columnsState.get(col.key) ?? EMPTY_COLUMN_STATE}
              row={row}
              cellRenderFunction={cellRenderers.get(col.key)}
              overlaidByScrollbar={isLast && hasHorizontalScroll}
            />
          </div>
        )
      })}
    </div>
  )
})

const NonMemoRow: React.FC<RowProps> = ({ row, sticky, stickyTop, stickyZIndex }) => {
  const observer = useCellValue(resizeObserverSingleton$)
  const groupIndexSet = useCellValue(groupIndexSet$)
  const groupLevelMap = useCellValue(groupLevelMap$)
  const groupHeaderRendererEntry = useCellValue(groupHeaderRenderer$)
  const testingContext = React.useContext(VirtuosoDataTableTestingContext)
  const engine = useEngine()

  const ref = React.useRef<HTMLDivElement | null>(null)

  const isProbe = row.size === 0
  const callbackRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      if (el) {
        ref.current = el
        if (testingContext) {
          const index = Number.parseInt(el.dataset.index ?? '', 10)
          engine.pub(ranges$, [
            {
              startIndex: index,
              endIndex: index,
              size: testingContext.itemHeight,
            },
          ])
        }
        observer?.observe(el)
      } else if (ref.current) {
        observer?.unobserve(ref.current)
        ref.current = null
      }
    },
    // isProbe forces re-observation when the row enters probe state
    // (size resets to 0 after a data change).
    // oxlint-disable-next-line exhaustive-deps
    [testingContext, observer, engine, isProbe]
  )

  const isGroupRow = groupIndexSet.has(row.index)
  const groupLevel = groupLevelMap.get(row.index) ?? 0

  useUnstableRowRenderEvent({
    row,
    sticky,
    group: isGroupRow,
    section: 'row',
  })

  const rowStyle = React.useMemo<React.CSSProperties>(() => {
    if (sticky) {
      return {
        ...ROW_BASE_STYLE,
        position: 'sticky',
        top: stickyTop,
        zIndex: stickyZIndex ?? 3,
        boxSizing: 'border-box',
      }
    }
    return {
      ...ROW_BASE_STYLE,
      top: row.offset,
      ...(isGroupRow ? { zIndex: 4 } : {}),
      boxSizing: 'border-box',
    }
  }, [row.offset, sticky, stickyTop, stickyZIndex, isGroupRow])

  const groupHeaderContent = React.useMemo(() => {
    if (!isGroupRow || !groupHeaderRendererEntry) {
      return null
    }

    if (groupHeaderRendererEntry.type === 'component') {
      const Comp = groupHeaderRendererEntry.renderer
      return <Comp row={row} level={groupLevel} />
    }

    return (groupHeaderRendererEntry.renderer as GroupHeaderRenderFunction)({ row, level: groupLevel })
  }, [isGroupRow, groupHeaderRendererEntry, row, groupLevel])

  if (isGroupRow) {
    return (
      <div
        ref={callbackRef}
        data-testid="virtuoso-table-row"
        data-table-element-role={ROW_ROLE}
        data-index={row.index}
        data-known-size={row.size}
        data-group-row=""
        style={rowStyle}
      >
        {groupHeaderContent}
      </div>
    )
  }

  return (
    <div
      ref={callbackRef}
      data-testid="virtuoso-table-row"
      data-table-element-role={ROW_ROLE}
      data-index={row.index}
      data-known-size={row.size}
      style={rowStyle}
    >
      <StickyLeftCells row={row} sticky={sticky} />
      <ScrollableCells row={row} sticky={sticky} />
      <StickyRightCells row={row} sticky={sticky} />
    </div>
  )
}

export const Row = React.memo(NonMemoRow, (prev, next) => {
  const prevRow = prev.row
  const nextRow = next.row

  return (
    prevRow.index === nextRow.index &&
    prevRow.size === nextRow.size &&
    prevRow.offset === nextRow.offset &&
    prevRow.data === nextRow.data &&
    prevRow.prevData === nextRow.prevData &&
    prevRow.nextData === nextRow.nextData &&
    prev.sticky === next.sticky &&
    prev.stickyTop === next.stickyTop &&
    prev.stickyZIndex === next.stickyZIndex
  )
})
