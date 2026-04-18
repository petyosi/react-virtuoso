import * as React from 'react'
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { useCellValue, usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { useResizeObserver } from '../resize/resize-observer-singleton'
import { useColumnId } from './Column'
import { columnWidthOverrides$ } from './column-width-overrides'
import { headerSlotEdgeEntries$, headerSlotEndEntries$, headerSlotOverlayEntries$, headerSlotStartEntries$ } from './header-slots/registry'
import { createRegistryCell } from './registry'

import type { ColumnInfo } from './Column'
import type { ColumnState } from './column-state'
import type { HeaderSlotEntry, HeaderSlotCustomComponent, HeaderSlotRenderFunction, HeaderSlotRenderParams } from './header-slots/registry'

/**
 * The parameters passed to a column header renderer.
 *
 * @group Components
 */
export interface ColumnHeaderRenderParams {
  columnKey: string
  column: ColumnInfo
  columnState: ColumnState
  overlaidByScrollbar: boolean
}

/**
 * The render function used by a column header.
 *
 * @group Components
 */
export type ColumnHeaderRenderFunction = (params: ColumnHeaderRenderParams) => ReactNode
/**
 * A React component variant for a column header.
 *
 * @group Components
 */
export type ColumnHeaderCustomComponent = React.ComponentType<ColumnHeaderRenderParams>
export type ColumnHeaderChild = React.ReactElement | ColumnHeaderRenderFunction | null | undefined | false
export type ColumnHeaderChildren = ColumnHeaderRenderFunction | React.ReactElement | readonly ColumnHeaderChild[]

export interface ColumnHeaderEntry {
  type?: 'function' | 'component'
  renderer?: ColumnHeaderRenderFunction | ColumnHeaderCustomComponent
  className?: string
}

const { cell$: columnHeaders$, register$: columnHeaderRegister$ } = createRegistryCell<ColumnHeaderEntry>()
export { columnHeaders$ }

export namespace ColumnHeader {
  /**
   * The properties accepted by the `ColumnHeader` component.
   *
   * @group Components
   */
  export type Props =
    | {
        children?: ColumnHeaderChildren
        className?: string
      }
    | {
        component: ColumnHeaderCustomComponent
        className?: string
      }
}

export type ColumnHeaderProps = ColumnHeader.Props

function flattenHeaderChildren(children: unknown): unknown[] {
  if (children === null || children === undefined || typeof children === 'boolean') {
    return []
  }

  if (Array.isArray(children)) {
    return children.flatMap(flattenHeaderChildren)
  }

  if (React.isValidElement(children) && children.type === React.Fragment) {
    return flattenHeaderChildren((children.props as { children?: unknown }).children)
  }

  return [children]
}

function parseSlotModeChildren(children: unknown) {
  const slotChildren: React.ReactElement[] = []
  let contentRenderer: ColumnHeaderRenderFunction | undefined

  for (const child of flattenHeaderChildren(children)) {
    if (typeof child === 'function') {
      if (contentRenderer) {
        throw new TypeError('ColumnHeader accepts at most one render-function child in slot mode.')
      }
      contentRenderer = child as ColumnHeaderRenderFunction
      continue
    }

    if (typeof child === 'string' || typeof child === 'number') {
      throw new TypeError('ColumnHeader does not accept plain text or number children in slot mode. Use a render function instead.')
    }

    if (React.isValidElement(child)) {
      slotChildren.push(child)
    }
  }

  return { contentRenderer, slotChildren }
}

/**
 * Declares the header renderer for the current column.
 *
 * @group Components
 */
export function ColumnHeader(props: ColumnHeader.Props) {
  const colId = useColumnId()
  const columnHeaderRegister = usePublisher(columnHeaderRegister$)
  const { className } = props
  const parsedChildren = 'component' in props ? undefined : parseSlotModeChildren(props.children)
  const renderer = 'component' in props ? props.component : parsedChildren?.contentRenderer
  const rendererType = 'component' in props ? 'component' : renderer ? 'function' : undefined

  useLayoutEffect(() => {
    columnHeaderRegister({
      type: 'add',
      id: colId,
      value: {
        ...(className === undefined ? {} : { className }),
        ...(rendererType === undefined || renderer === undefined ? {} : { type: rendererType, renderer }),
      },
    })
    return () => {
      columnHeaderRegister({ type: 'remove', id: colId })
    }
  }, [className, columnHeaderRegister, rendererType, colId, renderer])

  return parsedChildren && parsedChildren.slotChildren.length > 0 ? parsedChildren.slotChildren : null
}

const DEFAULT_COLUMN_HEADER_STYLE: CSSProperties = {}

export interface ColumnHeaderRendererProps {
  columnKey: string
  column: ColumnInfo
  columnState: ColumnState
  renderer: ColumnHeaderCustomComponent | ColumnHeaderRenderFunction | undefined
  rendererType: 'component' | 'function' | undefined
  overlaidByScrollbar: boolean
  className?: string
}

export function ColumnHeaderRenderer({
  columnKey,
  column,
  columnState,
  renderer,
  rendererType,
  overlaidByScrollbar,
  className,
}: ColumnHeaderRendererProps) {
  const observerRef = useResizeObserver('border-box')
  const headerRef = useRef<HTMLDivElement>(null)
  const columnWidthOverrides = useCellValue(columnWidthOverrides$)
  const headerSlotStartEntries = useCellValue(headerSlotStartEntries$)
  const headerSlotEndEntries = useCellValue(headerSlotEndEntries$)
  const headerSlotEdgeEntries = useCellValue(headerSlotEdgeEntries$)
  const headerSlotOverlayEntries = useCellValue(headerSlotOverlayEntries$)

  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      headerRef.current = element
      observerRef(element)
    },
    [observerRef]
  )

  const startSlots = useMemo(
    () => [...headerSlotStartEntries].filter(([, entry]) => entry.columnId === columnKey),
    [columnKey, headerSlotStartEntries]
  )
  const endSlots = useMemo(
    () => [...headerSlotEndEntries].filter(([, entry]) => entry.columnId === columnKey),
    [columnKey, headerSlotEndEntries]
  )
  const edgeSlots = useMemo(
    () => [...headerSlotEdgeEntries].filter(([, entry]) => entry.columnId === columnKey),
    [columnKey, headerSlotEdgeEntries]
  )
  const overlaySlots = useMemo(
    () => [...headerSlotOverlayEntries].filter(([, entry]) => entry.columnId === columnKey),
    [columnKey, headerSlotOverlayEntries]
  )
  const content = useMemo(() => {
    if (!renderer) {
      return column.field
    }

    if (rendererType === 'component') {
      const Comp = renderer
      return <Comp columnKey={columnKey} column={column} columnState={columnState} overlaidByScrollbar={overlaidByScrollbar} />
    }

    return (renderer as ColumnHeaderRenderFunction)({ columnKey, column, columnState, overlaidByScrollbar })
  }, [columnKey, column, columnState, overlaidByScrollbar, renderer, rendererType])
  const slotRenderParams = useMemo<HeaderSlotRenderParams>(
    () => ({ columnKey, column, columnState, overlaidByScrollbar, headerRef }),
    [column, columnKey, columnState, overlaidByScrollbar]
  )
  const style = useMemo<CSSProperties>(() => {
    const override = columnWidthOverrides.get(columnKey)
    if (override === undefined) {
      return DEFAULT_COLUMN_HEADER_STYLE
    }

    return {
      width: override,
      minWidth: override,
      flexGrow: 0,
      flexShrink: 0,
    }
  }, [columnKey, columnWidthOverrides])
  const hasSlots = startSlots.length + endSlots.length + edgeSlots.length + overlaySlots.length > 0

  const slotModeStyle = useMemo<CSSProperties>(() => {
    if (!hasSlots) {
      return style
    }

    return {
      ...style,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    }
  }, [hasSlots, style])

  return (
    <div
      ref={ref}
      className={className}
      data-table-element-role="column-header"
      data-column-key={columnKey}
      data-observer-group="column-header"
      style={slotModeStyle}
    >
      {hasSlots ? (
        <>
          {overlaySlots.map(([slotId, entry]) => (
            <div key={slotId} style={OVERLAY_SLOT_STYLE}>
              {renderHeaderSlot(entry, slotRenderParams)}
            </div>
          ))}
          {startSlots.map(([slotId, entry]) => (
            <React.Fragment key={slotId}>{renderHeaderSlot(entry, slotRenderParams)}</React.Fragment>
          ))}
          <div style={HEADER_CONTENT_STYLE}>{content}</div>
          {endSlots.map(([slotId, entry]) => (
            <React.Fragment key={slotId}>{renderHeaderSlot(entry, slotRenderParams)}</React.Fragment>
          ))}
          {edgeSlots.map(([slotId, entry]) => (
            <div key={slotId} style={EDGE_SLOT_STYLE}>
              {renderHeaderSlot(entry, slotRenderParams)}
            </div>
          ))}
        </>
      ) : (
        content
      )}
    </div>
  )
}

const HEADER_CONTENT_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
}

const OVERLAY_SLOT_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
}

const EDGE_SLOT_STYLE: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'stretch',
}

function renderHeaderSlot(entry: HeaderSlotEntry, params: HeaderSlotRenderParams) {
  if (entry.type === 'component') {
    const Component = entry.renderer as HeaderSlotCustomComponent
    return <Component {...params} {...entry.extraProps} />
  }

  return (entry.renderer as HeaderSlotRenderFunction)({ ...params, ...entry.extraProps })
}
