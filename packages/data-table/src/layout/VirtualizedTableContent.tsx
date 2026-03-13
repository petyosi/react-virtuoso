import React, { useCallback, useMemo } from 'react'
import type { CSSProperties } from 'react'

import { useCellValue, useCellValues, useEngine } from '@virtuoso.dev/reactive-engine-react'

import { columns$, columnWidths$, columnWidthsCssVars$ } from '../columns/Column'
import { columnsState$, stickyColumnsState$ } from '../columns/column-state'
import { columnGroups$ } from '../columns/ColumnGroup'
import { columnGroupHeaders$ } from '../columns/ColumnGroupHeader'
import { columnHeaders$ } from '../columns/ColumnHeader'
import { buildHeaderTree, getEffectiveSticky, groupsWithDescendantColumns, HeaderNodeRenderer } from '../columns/header-tree'
import {
  emptyPlaceholder$,
  footer$,
  footerWrapper$,
  header$,
  headerWrapper$,
  NO_OVERFLOW_ANCHOR_STYLE,
  stickyFooter$,
  stickyFooterWrapper$,
  stickyHeader$,
  stickyHeaderWrapper$,
} from '../core/components'
import { computeRowKey$ } from '../core/content'
import { context$, totalCount$ } from '../core/data'
import { accumulateSizeRange } from '../resize/accumulate-size-range'
import { useResizeObserver } from '../resize/resize-observer-singleton'
import { FOOTER_ROLE, HEADER_ROLE, TABLE_BODY_ROLE, STICKY_FOOTER_ROLE, STICKY_HEADER_ROLE } from '../resize/resize-observing'
import { ranges$, totalHeight$ } from '../resize/sizes'
import { Row } from '../rows/Row'
import { rowsState$ } from '../rows/row-state'
import {
  customScrollParent$,
  deviation$,
  emptyRenderCycle$,
  hasHorizontalScroll$,
  tableBodyCssTransition$,
  tableBodyForceBottomSpace$,
  tableBodyMarginTop$,
  measureItems$,
  transformDeviation$,
  useWindowScroll$,
} from '../scroll/dom'
import { pendingScrollToInitialLocation$ } from '../scroll/scroll-to-row'
import { ScrollbarOverlay } from './ScrollbarOverlay'
import { CustomScrollParentWrapper, ScrollableElement, WindowScrollElementWrapper } from './scroller-elements'
import { TableLayoutRoot } from './TableLayoutRoot'

import type { ScrollerProps, SizeRange } from '../interfaces'

const STICKY_HEADER_WRAPPER_BASE_STYLE: CSSProperties = {
  ...NO_OVERFLOW_ANCHOR_STYLE,
  display: 'flex',
  whiteSpace: 'nowrap',
  minWidth: 'max-content',
}

const LEFT_STICKY_CONTAINER_STYLE: CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  display: 'flex',
  alignItems: 'flex-end',
}

const RIGHT_STICKY_CONTAINER_STYLE: CSSProperties = {
  position: 'sticky',
  right: 0,
  zIndex: 2,
  display: 'flex',
  alignItems: 'flex-end',
}

const SCROLLABLE_HEADER_CONTAINER_STYLE: CSSProperties = {
  display: 'flex',
  flex: 1,
  alignItems: 'flex-end',
}

function StickyHeaderContent() {
  const [columns, columnHeaders, stickyColumnsState, columnsState, columnGroups, columnGroupHeaders, columnWidths] = useCellValues(
    columns$,
    columnHeaders$,
    stickyColumnsState$,
    columnsState$,
    columnGroups$,
    columnGroupHeaders$,
    columnWidths$
  )
  const hasHorizontalScroll = useCellValue(hasHorizontalScroll$)

  const warnedEmptyGroups = React.useRef(new Set<string>())

  React.useEffect(() => {
    const nonEmptyGroups = groupsWithDescendantColumns(columns, columnGroups)

    for (const [groupId] of columnGroups) {
      if (nonEmptyGroups.has(groupId) || warnedEmptyGroups.current.has(groupId)) {
        continue
      }
      console.warn(`ColumnGroup ${groupId} has no columns and will not be rendered`)
      warnedEmptyGroups.current.add(groupId)
    }
  }, [columns, columnGroups])

  const { leftTree, scrollableTree, rightTree } = useMemo(() => {
    return {
      leftTree: buildHeaderTree(columns, columnGroups, (_key, col) => getEffectiveSticky(col, columnGroups) === 'left'),
      scrollableTree: buildHeaderTree(columns, columnGroups, (_key, col) => !getEffectiveSticky(col, columnGroups)),
      rightTree: buildHeaderTree(columns, columnGroups, (_key, col) => getEffectiveSticky(col, columnGroups) === 'right'),
    }
  }, [columns, columnGroups])

  return (
    <>
      {stickyColumnsState.leftColumns.length > 0 && (
        <div style={LEFT_STICKY_CONTAINER_STYLE} data-sticky="left">
          {leftTree.map((node) => (
            <HeaderNodeRenderer
              key={node.type === 'column' ? node.key : node.groupId}
              node={node}
              columns={columns}
              columnHeaders={columnHeaders}
              columnGroupHeaders={columnGroupHeaders}
              columnsState={columnsState}
              columnWidths={columnWidths}
              overlaidByScrollbar={false}
            />
          ))}
        </div>
      )}
      <div style={SCROLLABLE_HEADER_CONTAINER_STYLE}>
        {scrollableTree.map((node) => (
          <HeaderNodeRenderer
            key={node.type === 'column' ? node.key : node.groupId}
            node={node}
            columns={columns}
            columnHeaders={columnHeaders}
            columnGroupHeaders={columnGroupHeaders}
            columnsState={columnsState}
            columnWidths={columnWidths}
            overlaidByScrollbar={false}
          />
        ))}
      </div>
      {stickyColumnsState.rightColumns.length > 0 && (
        <div style={RIGHT_STICKY_CONTAINER_STYLE} data-sticky="right">
          {rightTree.map((node, idx) => (
            <HeaderNodeRenderer
              key={node.type === 'column' ? node.key : node.groupId}
              node={node}
              columns={columns}
              columnHeaders={columnHeaders}
              columnGroupHeaders={columnGroupHeaders}
              columnsState={columnsState}
              columnWidths={columnWidths}
              overlaidByScrollbar={hasHorizontalScroll && idx === rightTree.length - 1}
            />
          ))}
        </div>
      )}
    </>
  )
}

export const VirtualizedTableContent: React.FC<ScrollerProps> = ({ style: passedStyle, ...htmlProps }) => {
  const engine = useEngine()

  const [
    Header,
    _StickyHeader,
    HeaderWrapper,
    StickyHeaderWrapper,
    Footer,
    StickyFooter,
    FooterWrapper,
    StickyFooterWrapper,
    EmptyPlaceholder,
    customScrollParent,
    { rows, stickyStartItems, stickyStartTops },
  ] = useCellValues(
    header$,
    stickyHeader$,
    headerWrapper$,
    stickyHeaderWrapper$,
    footer$,
    stickyFooter$,
    footerWrapper$,
    stickyFooterWrapper$,
    emptyPlaceholder$,
    customScrollParent$,
    rowsState$
  )

  const columnWidthsCssVars = useCellValue(columnWidthsCssVars$)

  const deviation = useCellValue(deviation$)
  const transformDeviation = useCellValue(transformDeviation$)

  const tableBodyMarginTop = useCellValue(tableBodyMarginTop$)
  const tableBodyForceBottomSpace = useCellValue(tableBodyForceBottomSpace$)
  const tableBodyCssTransition = useCellValue(tableBodyCssTransition$)
  const context = useCellValue(context$)
  const computeRowKey = useCellValue(computeRowKey$)
  const totalCount = useCellValue(totalCount$)
  const totalHeight = useCellValue(totalHeight$)
  const useWindowScroll = useCellValue(useWindowScroll$)
  const pendingScrollToInitialLocation = useCellValue(pendingScrollToInitialLocation$)

  const tableBodyRef = React.useRef<HTMLElement | null>(null)

  const measureItems = React.useCallback(() => {
    const results: SizeRange[] = []
    for (const element of (tableBodyRef.current?.children ?? []) as HTMLCollectionOf<HTMLDivElement>) {
      accumulateSizeRange(results, element, element.getBoundingClientRect().height)
    }
    engine.pub(ranges$, results)
  }, [engine])

  React.useLayoutEffect(() => {
    return engine.sub(measureItems$, measureItems)
  }, [measureItems, engine])

  React.useLayoutEffect(() => {
    if (rows.length === 0) {
      engine.pub(emptyRenderCycle$)
    }
  }, [rows, engine])

  const ScrollableRoot = customScrollParent ? CustomScrollParentWrapper : useWindowScroll ? WindowScrollElementWrapper : ScrollableElement

  const tableBodyStyle = useMemo(
    () => ({
      boxSizing: 'content-box' as const,
      height: totalHeight,
      paddingBottom: tableBodyForceBottomSpace,
      overflowAnchor: 'none' as const,
      marginTop: tableBodyMarginTop,
      transition: tableBodyCssTransition,
      position: 'relative' as const,
      isolation: 'isolate' as const,
      ...(deviation + transformDeviation === 0 ? {} : { transform: `translateY(${deviation + transformDeviation}px)` }),
      visibility: pendingScrollToInitialLocation ? ('hidden' as const) : ('visible' as const),
      ...columnWidthsCssVars,
    }),
    [
      totalHeight,
      tableBodyForceBottomSpace,
      tableBodyMarginTop,
      tableBodyCssTransition,
      deviation,
      transformDeviation,
      pendingScrollToInitialLocation,
      columnWidthsCssVars,
    ]
  )

  const stickyHeaderWrapperStyle = STICKY_HEADER_WRAPPER_BASE_STYLE

  const stickyHeaderRef = useResizeObserver()
  const headerRef = useResizeObserver()
  const tableBodyCallbackRef = useResizeObserver()
  const footerRef = useResizeObserver()
  const stickyFooterRef = useResizeObserver()

  const theTableBodyCallbackRef = useCallback(
    (el: HTMLElement | null) => {
      tableBodyRef.current = el
      tableBodyCallbackRef(el)
    },
    [tableBodyCallbackRef]
  )

  return (
    <TableLayoutRoot {...htmlProps} style={passedStyle}>
      <ScrollableRoot {...htmlProps} tableBodyRef={tableBodyRef}>
        {(totalCount === 0 || pendingScrollToInitialLocation) && EmptyPlaceholder ? <EmptyPlaceholder context={context} /> : null}
        <StickyHeaderWrapper data-table-element-role={STICKY_HEADER_ROLE} ref={stickyHeaderRef} style={stickyHeaderWrapperStyle}>
          <StickyHeaderContent />
        </StickyHeaderWrapper>
        {Header && (
          <HeaderWrapper data-table-element-role={HEADER_ROLE} ref={headerRef} style={NO_OVERFLOW_ANCHOR_STYLE}>
            <Header context={context} />
          </HeaderWrapper>
        )}
        {totalCount > 0 ? (
          <div
            data-table-element-role={TABLE_BODY_ROLE}
            ref={theTableBodyCallbackRef}
            data-testid="virtuoso-table-body"
            style={tableBodyStyle}
          >
            {stickyStartItems.map((stickyRow, idx) => {
              return (
                <Row
                  key={`sticky-${stickyRow.index}`}
                  row={stickyRow}
                  sticky
                  stickyTop={stickyStartTops[idx]!}
                  stickyZIndex={4 + stickyStartItems.length - idx}
                />
              )
            })}
            {rows.map((row) => {
              return (
                <Row
                  key={computeRowKey({
                    index: row.index,
                    data: row.data,
                    context,
                  })}
                  row={row}
                />
              )
            })}
          </div>
        ) : null}
        {Footer && (
          <FooterWrapper data-table-element-role={FOOTER_ROLE} ref={footerRef} style={NO_OVERFLOW_ANCHOR_STYLE}>
            <Footer context={context} />
          </FooterWrapper>
        )}
        {StickyFooter && (
          <StickyFooterWrapper data-table-element-role={STICKY_FOOTER_ROLE} ref={stickyFooterRef} style={NO_OVERFLOW_ANCHOR_STYLE}>
            <StickyFooter context={context} />
          </StickyFooterWrapper>
        )}
      </ScrollableRoot>
      <ScrollbarOverlay />
    </TableLayoutRoot>
  )
}
