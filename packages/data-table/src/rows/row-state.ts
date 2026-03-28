import { e, DerivedCell, Cell } from '@virtuoso.dev/reactive-engine-core'

import { data$, groupIndexSet$, groupStickyConfig$, totalCount$ } from '../core/data'
import { recalcInProgress$, sizeState$, totalHeight$ } from '../resize/sizes'
import {
  deviation$,
  headerHeight$,
  increaseViewportBy$,
  scrollableHeaderHeight$,
  scrollOffset$,
  scrollToPending$,
  scrollTop$,
  stickyFooterHeight$,
  stickyHeaderHeight$,
  viewportHeight$,
  visibleListHeight$,
} from '../scroll/dom'
import { normalizeRowLocation, scrollToLocationFromScrollToRowLocation } from '../scroll/scroll-to-row'
import {
  lastJumpDueToRowResize$,
  scrollDirection$,
  UP,
  initialLocation$,
  pendingScrollToInitialLocation$,
  mobileSafariIsReadjusting$,
} from '../scroll/state'
import { empty } from '../sizing/AATree'
import { itemsWithinOffsetsWithStickyResult } from '../sizing/itemsWithinOffsets'
import { computeStickyItems, computeStickyItemsFromAnchorIndex, EMPTY_STICKY_RESULT } from '../sizing/stickyItems'

import type { DataArray, Item, Row } from '../interfaces'
import type { OffsetBreakpoint } from '../sizing/SizeState'
import type { StickyResult } from '../sizing/stickyItems'

function rowsSeed(index: number, data: unknown[] | null) {
  return [
    {
      data: data?.[index],
      prevData: data?.[index - 1] ?? null,
      nextData: data?.[index + 1] ?? null,
      size: 0,
      index,
      offset: 0,
    },
  ] as Row<unknown>[]
}

const EMPTY_ROWS = [] as Row<unknown>[]
const EMPTY_STICKY_START_ITEMS = [] as Item<unknown>[]
const EMPTY_STICKY_START_TOPS = [] as number[]
const EMPTY_ROWS_STATE = {
  rows: EMPTY_ROWS,
  stickyStartItems: EMPTY_STICKY_START_ITEMS,
  stickyStartTops: EMPTY_STICKY_START_TOPS,
  stickySignature: '',
  startStickySize: 0,
  listEnd: 0,
  listStart: 0,
  offsetTree: [] as OffsetBreakpoint[],
  paddingEnd: 0,
  paddingStart: 0,
  totalCount: 0,
  totalSize: 0,
  deviationDelta: 0,
  visibleListSize: 0,
  data: null as DataArray | null,
  stable: false,
}

const muteRowsChange$ = Cell(false)

export const rowsState$ = Cell(EMPTY_ROWS_STATE)

function buildStickySignature(stickyResult: StickyResult) {
  if (stickyResult === EMPTY_STICKY_RESULT || (stickyResult.stickyStartItems.length === 0 && stickyResult.stickyEndItems.length === 0)) {
    return ''
  }

  const stickyStart = stickyResult.stickyStartItems.map((item, index) => `${item.index}:${stickyResult.stickyStartTops[index]}`).join('|')
  const stickyEnd = stickyResult.stickyEndItems.map((item) => item.index).join('|')

  return `${stickyStart}::${stickyEnd}`
}

function visualStartStickySize(stickyResult: StickyResult, stickyHeaderHeight: number) {
  const lastStickyStartIdx = stickyResult.stickyStartItems.length - 1
  return lastStickyStartIdx >= 0
    ? stickyResult.stickyStartTops[lastStickyStartIdx]! + stickyResult.stickyStartItems[lastStickyStartIdx]!.size - stickyHeaderHeight
    : 0
}

function firstVisibleDataRowIndex(
  rows: Row<unknown>[],
  groupIndexSet: Set<number>,
  visibleViewportTop: number,
  visibleViewportBottom: number,
  stickyResult: StickyResult,
  stickyHeaderHeight: number
) {
  const effectiveVisibleStart = visibleViewportTop + visualStartStickySize(stickyResult, stickyHeaderHeight)

  for (const row of rows) {
    if (groupIndexSet.has(row.index)) {
      continue
    }

    if (row.offset + row.size <= effectiveVisibleStart) {
      continue
    }

    if (row.offset >= visibleViewportBottom) {
      return null
    }

    return row.index
  }

  return null
}

e.link(
  e.pipe(
    e.combine(
      scrollTop$,
      visibleListHeight$,
      sizeState$,
      totalCount$,
      totalHeight$,
      data$,
      scrollOffset$,
      initialLocation$,
      pendingScrollToInitialLocation$,
      scrollableHeaderHeight$,
      stickyHeaderHeight$,
      stickyFooterHeight$,
      deviation$,
      muteRowsChange$,
      recalcInProgress$,
      mobileSafariIsReadjusting$,
      groupStickyConfig$,
      groupIndexSet$,
      increaseViewportBy$
    ),
    e.filter((args) => {
      const mobileSafariIsReadjusting = args.at(-4) as boolean
      const recalcInProgress = args.at(-5) as boolean
      const muteRowsChange = args.at(-6) as boolean
      return !recalcInProgress && !mobileSafariIsReadjusting && !muteRowsChange
    }),
    e.withLatestFrom(viewportHeight$, headerHeight$, scrollTop$, scrollToPending$, scrollDirection$, lastJumpDueToRowResize$),
    e.scan(
      (
        current,
        [
          [
            listScrollTop,
            visibleListHeight,
            sizeState,
            totalCount,
            totalHeight,
            data,
            scrollOffset,
            initialLocation,
            pendingScrollToInitialLocation,
            scrollableHeaderHeight,
            stickyHeaderHeight,
            stickyFooterHeight,
            deviation,
            _muteRowsChange,
            _recalcInProgress,
            _mobileSafariIsReadjusting,
            groupStickyConfig,
            groupIndexSet,
            increaseViewportBy,
          ],
          viewportHeight,
          headerHeight,
          scrollTop,
          scrollToPending,
          scrollDirection,
          lastJumpDueToRowResize,
        ]
      ) => {
        if (data?.length === 0) {
          return EMPTY_ROWS_STATE
        }
        if (empty(sizeState.sizeTree)) {
          let initialIndex = 0

          if (initialLocation !== null) {
            initialIndex = normalizeRowLocation(initialLocation, totalCount - 1).index
          }
          return { ...EMPTY_ROWS_STATE, rows: rowsSeed(initialIndex, data), offsetTree: sizeState.offsetTree, totalCount, data }
        }

        let offsetDueToPendingScrollToInitialLocation = 0

        if (pendingScrollToInitialLocation !== null && listScrollTop === 0) {
          offsetDueToPendingScrollToInitialLocation =
            scrollToLocationFromScrollToRowLocation({
              totalHeight,
              location: pendingScrollToInitialLocation,
              sizeState,
              totalCount,
              viewportHeight,
              headerHeight,
              stickyHeaderHeight,
              stickyFooterHeight,
            }).top ?? 0
        }

        let deviationDelta = 0

        if (scrollTop !== 0 && !scrollToPending && scrollDirection === UP && current.totalCount === totalCount && current.rows.length > 0) {
          deviationDelta = totalHeight - current.totalSize
          if (deviationDelta !== 0) {
            deviationDelta += lastJumpDueToRowResize
          }
        }

        const visibleViewportTop = Math.min(
          Math.max(
            listScrollTop + offsetDueToPendingScrollToInitialLocation + scrollOffset - deviation - scrollableHeaderHeight + deviationDelta,
            0
          ),
          totalHeight - visibleListHeight
        )

        const visibleViewportBottom = visibleViewportTop + visibleListHeight
        const renderViewportTop = Math.min(Math.max(visibleViewportTop - increaseViewportBy, 0), totalHeight - visibleListHeight)
        const renderViewportBottom = renderViewportTop + visibleListHeight + increaseViewportBy * 2

        const stickyResult =
          groupStickyConfig.length > 0
            ? computeStickyItems(
                groupStickyConfig,
                sizeState.offsetTree,
                visibleViewportTop,
                visibleViewportBottom,
                data,
                stickyHeaderHeight
              )
            : EMPTY_STICKY_RESULT

        let effectiveStickyResult = stickyResult
        let stickySignature = buildStickySignature(effectiveStickyResult)

        if (
          groupStickyConfig.length === 0 &&
          current.offsetTree === sizeState.offsetTree &&
          current.totalCount === totalCount &&
          current.data === data &&
          current.stickySignature === stickySignature &&
          renderViewportTop >= current.listStart &&
          renderViewportBottom <= current.listEnd
        ) {
          return current
        }

        let rowsResult = itemsWithinOffsetsWithStickyResult(
          sizeState.offsetTree,
          renderViewportTop,
          renderViewportBottom,
          totalCount,
          totalHeight,
          data,
          effectiveStickyResult,
          undefined,
          stickyHeaderHeight
        )

        // Sticky rows should describe the first visible data row below the sticky stack.
        // A threshold-only selection can lag by one group near transitions, so correct it
        // against the actual visible data row when necessary.
        for (let iteration = 0; iteration < 2; iteration++) {
          const anchorIndex = firstVisibleDataRowIndex(
            rowsResult.items,
            groupIndexSet,
            visibleViewportTop,
            visibleViewportBottom,
            effectiveStickyResult,
            stickyHeaderHeight
          )

          if (anchorIndex === null) {
            break
          }

          const anchoredStickyResult = computeStickyItemsFromAnchorIndex(
            groupStickyConfig,
            sizeState.offsetTree,
            anchorIndex,
            visibleViewportTop,
            visibleViewportBottom,
            data,
            stickyHeaderHeight
          )
          const anchoredStickySignature = buildStickySignature(anchoredStickyResult)

          if (anchoredStickySignature === stickySignature) {
            break
          }

          effectiveStickyResult = anchoredStickyResult
          stickySignature = anchoredStickySignature
          rowsResult = itemsWithinOffsetsWithStickyResult(
            sizeState.offsetTree,
            renderViewportTop,
            renderViewportBottom,
            totalCount,
            totalHeight,
            data,
            effectiveStickyResult,
            undefined,
            stickyHeaderHeight
          )
        }

        const { items: rows, stickyStartItems, stickyStartTops, startStickySize, listStart, listEnd, paddingStart, paddingEnd } = rowsResult

        return {
          rows,
          stickyStartItems,
          stickyStartTops,
          stickySignature,
          startStickySize,
          listEnd,
          listStart,
          offsetTree: sizeState.offsetTree,
          paddingEnd,
          paddingStart,
          totalCount,
          totalSize: totalHeight,
          data,
          deviationDelta,
          visibleListSize: visibleListHeight,
          stable: pendingScrollToInitialLocation === null,
        }
      },
      EMPTY_ROWS_STATE
    )
  ),
  rowsState$
)

/**
 * @group State
 */
export interface ViewportRange {
  startIndex: number
  endIndex: number
}

/**
 * @group State
 */
export const viewportRange$ = DerivedCell(
  null as ViewportRange | null,
  e.pipe(
    rowsState$,
    e.filter((state) => state.stable),
    e.map((state) => {
      const { rows } = state
      if (rows.length === 0) {
        return null
      }
      return {
        startIndex: rows[0]!.index,
        endIndex: rows.at(-1)!.index,
      }
    })
  ),
  (prev, curr) =>
    prev === curr ||
    (prev !== null &&
      prev !== undefined &&
      curr !== null &&
      curr !== undefined &&
      prev.startIndex === curr.startIndex &&
      prev.endIndex === curr.endIndex)
)

/**
 * @group State
 */
export const currentlyRenderedRows$ = DerivedCell(
  [] as unknown[],
  e.pipe(
    e.combine(rowsState$, scrollTop$, groupIndexSet$),
    e.map(([rowsState, scrollTop, groupIndexSet]) => {
      const allRows = rowsState.rows
      const startIdx = allRows.findIndex((r) => r.offset + r.size >= scrollTop)
      const rows = startIdx === -1 ? [] : allRows.slice(startIdx)
      return rows.filter((row) => !groupIndexSet.has(row.index)).map((row) => row.data)
    })
  )
)
