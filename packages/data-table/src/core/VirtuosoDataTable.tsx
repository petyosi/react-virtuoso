import React from 'react'

import { EngineProvider } from '@virtuoso.dev/reactive-engine-react'

import { columnDeclarationOrder$, columns$ } from '../columns/Column'
import { columnItemsState$, columnOverscanCount$ } from '../columns/column-state'
import { VirtualizedTableContent } from '../layout/VirtualizedTableContent'
import { bridgeModelToEngine, dataModel$, dataModelViewId$ } from '../model/model-bridge'
import { dataTableStructureEntries$ } from '../resize/resize-observing'
import { itemHeight$ } from '../resize/sizes'
import { currentlyRenderedRows$, rowsState$, viewportRange$ } from '../rows/row-state'
import { atBottomState$ } from '../scroll/at-bottom'
import { customScrollParent$, increaseViewportBy$, onScroll$, scrollerElement$, scrollToPending$, useWindowScroll$ } from '../scroll/dom'
import { deviationDelta$ } from '../scroll/reverse-scroll-fix'
import { initialLocation$ } from '../scroll/scroll-to-row'
import { scrollDirection$ } from '../scroll/state'
import {
  DefaultFooterWrapper,
  DefaultHeaderWrapper,
  DefaultRowComponent,
  DefaultStickyColumnContainer,
  DefaultStickyFooterWrapper,
  DefaultStickyHeaderWrapper,
  emptyPlaceholder$,
  footer$,
  footerWrapper$,
  header$,
  headerWrapper$,
  loadingFooter$,
  loadingOverlay$,
  loadingPlaceholder$,
  rowComponent$,
  scrollElement$,
  stickyColumnContainer$,
  stickyFooter$,
  stickyFooterWrapper$,
  stickyHeader$,
  stickyHeaderWrapper$,
} from './components'
import { computeRowKey$, defaultComputeRowKey } from './content'
import { context$, groupLevelMap$, groupStickyConfig$ } from './data'
import { loadingState$ } from './loading'

import type { VirtuosoDataTableProps } from '../interfaces'

function silenceResizeObserverError(error: ErrorEvent) {
  if (error.message?.includes('ResizeObserver loop')) {
    error.preventDefault()
    error.stopPropagation()
    error.stopImmediatePropagation()
  }
}

/**
 *
 * The React component that renders the data table. Refer to {@link VirtuosoDataTableProps} for the accepted props.
 *
 * @function
 * @group Components
 */
function VirtuosoDataTableComponent(props: VirtuosoDataTableProps<unknown, unknown>) {
  const hasCustomScrollParentProp = Object.hasOwn(props, 'customScrollParent')
  const {
    model,
    computeRowKey = defaultComputeRowKey,
    context = null,
    engineId,
    engineRef,
    onScroll,
    onRenderedDataChange,
    useWindowScroll = false,
    customScrollParent = null,
    increaseViewportBy = 0,
    columnOverscanCount = 0,
    components,
    children,
    ...scrollerProps
  } = props
  const initialLocation = props.initialLocation ?? null
  const EmptyPlaceholder = props.EmptyPlaceholder ?? null
  const ScrollElement = props.ScrollElement ?? 'div'
  const engineProviderProps = {
    ...(engineId === undefined ? {} : { engineId }),
    ...(engineRef === undefined ? {} : { engineRef }),
  }

  React.useEffect(() => {
    window.addEventListener('error', silenceResizeObserverError, {
      capture: true,
    })
    return () => {
      window.removeEventListener('error', silenceResizeObserverError, { capture: true })
    }
  }, [])

  if (hasCustomScrollParentProp && customScrollParent === null) {
    return null
  }

  return (
    <EngineProvider
      {...engineProviderProps}
      // oxlint-disable-next-line jsx-no-new-function-as-prop
      initFn={(e) => {
        e.register(columns$)
        e.register(rowsState$)
        e.register(columnDeclarationOrder$)
        e.register(columnItemsState$)
        e.register(dataTableStructureEntries$)
        e.register(itemHeight$)
        e.register(scrollerElement$)
        e.register(scrollToPending$)
        e.register(scrollDirection$)
        e.register(deviationDelta$)
        e.register(atBottomState$)
        e.register(groupStickyConfig$)
        e.register(groupLevelMap$)
        e.register(viewportRange$)
        e.register(loadingState$)
        e.register(dataModel$)
        e.register(dataModelViewId$)

        e.pubIn({
          [dataModel$]: model,
          [dataModelViewId$]: 'default',
        })
        bridgeModelToEngine(model, e, 'default')

        e.pubIn({
          [context$]: context,
          [computeRowKey$]: computeRowKey,
          [initialLocation$]: initialLocation,
          [header$]: null,
          [footer$]: null,
          [stickyHeader$]: null,
          [stickyFooter$]: null,
          [emptyPlaceholder$]: EmptyPlaceholder,
          [loadingPlaceholder$]: components?.LoadingPlaceholder ?? null,
          [loadingOverlay$]: components?.LoadingOverlay ?? null,
          [loadingFooter$]: components?.LoadingFooter ?? null,
          [scrollElement$]: ScrollElement,
          [stickyFooterWrapper$]: DefaultStickyFooterWrapper,
          [stickyHeaderWrapper$]: components?.StickyHeader ?? DefaultStickyHeaderWrapper,
          [footerWrapper$]: DefaultFooterWrapper,
          [headerWrapper$]: DefaultHeaderWrapper,
          [rowComponent$]: components?.Row ?? DefaultRowComponent,
          [stickyColumnContainer$]: components?.StickyColumnContainer ?? DefaultStickyColumnContainer,
          [useWindowScroll$]: useWindowScroll,
          [customScrollParent$]: customScrollParent,
          [increaseViewportBy$]: increaseViewportBy,
          [columnOverscanCount$]: columnOverscanCount,
        })
        e.singletonSub(onScroll$, onScroll)
        e.singletonSub(currentlyRenderedRows$, onRenderedDataChange)
      }}
      // oxlint-disable-next-line jsx-no-new-function-as-prop
      updateFn={(e) => {
        e.pubIn({
          [context$]: context,
          [customScrollParent$]: customScrollParent,
          [increaseViewportBy$]: increaseViewportBy,
          [computeRowKey$]: computeRowKey,
          [emptyPlaceholder$]: EmptyPlaceholder,
          [loadingPlaceholder$]: components?.LoadingPlaceholder ?? null,
          [loadingOverlay$]: components?.LoadingOverlay ?? null,
          [loadingFooter$]: components?.LoadingFooter ?? null,
          [columnOverscanCount$]: columnOverscanCount,
          [stickyHeaderWrapper$]: components?.StickyHeader ?? DefaultStickyHeaderWrapper,
          [rowComponent$]: components?.Row ?? DefaultRowComponent,
          [stickyColumnContainer$]: components?.StickyColumnContainer ?? DefaultStickyColumnContainer,
        })
        e.singletonSub(onScroll$, onScroll)
        e.singletonSub(currentlyRenderedRows$, onRenderedDataChange)
      }}
      // oxlint-disable-next-line jsx-no-new-array-as-prop
      updateDeps={[
        context,
        customScrollParent,
        increaseViewportBy,
        computeRowKey,
        EmptyPlaceholder,
        columnOverscanCount,
        onScroll,
        onRenderedDataChange,
        components,
      ]}
    >
      {children}
      <VirtualizedTableContent {...scrollerProps} />
    </EngineProvider>
  )
}

export const VirtuosoDataTable = VirtuosoDataTableComponent as (<Data, Context, Group = unknown>(
  props: VirtuosoDataTableProps<Data, Context, Group>
) => React.ReactElement) & { displayName?: string }

VirtuosoDataTable.displayName = 'VirtuosoDataTable'

export type { ColumnHeaderRenderParams, ColumnHeaderRendererProps } from '../columns/ColumnHeader'
