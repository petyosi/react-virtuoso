import React from 'react'

import { EngineProvider } from '@virtuoso.dev/reactive-engine-react'

import { columnDeclarationOrder$ } from '../columns/Column'
import { columnItemsState$, columnOverscanCount$ } from '../columns/column-state'
import { VirtualizedTableContent } from '../layout/VirtualizedTableContent'
import { localSource } from '../model/local-source'
import { bridgeModelToEngine } from '../model/model-bridge'
import { dataTableStructureEntries$ } from '../resize/resize-observing'
import { currentlyRenderedRows$, rowsState$, viewportRange$ } from '../rows/row-state'
import { atBottomState$ } from '../scroll/at-bottom'
import { customScrollParent$, increaseViewportBy$, onScroll$, scrollToPending$, useWindowScroll$ } from '../scroll/dom'
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
import { virtuosoApiObject } from './virtuosoApiObject'

import type { VirtuosoDataTableMethods, VirtuosoDataTableProps } from '../interfaces'
import type { DataModelHandle } from '../model/types'

const DEFAULT_DATA = { data: [], groups: [] }

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
 * The component accepts a ref that can be used to call methods on the data table. See {@link VirtuosoDataTableMethods} for the available methods.
 *
 * @function
 * @group Components
 */
export const VirtuosoDataTable = React.forwardRef<VirtuosoDataTableMethods<unknown>, VirtuosoDataTableProps<unknown, unknown>>(
  (
    {
      data = DEFAULT_DATA,
      model: externalModel,
      computeRowKey = defaultComputeRowKey,
      context = null,
      engineId,
      engineRef,
      initialLocation = null,
      onScroll,
      onRenderedDataChange,
      EmptyPlaceholder = null,
      useWindowScroll = false,
      customScrollParent = null,
      ScrollElement = 'div',
      increaseViewportBy = 0,
      columnOverscanCount = 0,
      components,
      children,
      ...scrollerProps
    },
    ref
  ) => {
    const apiObjectRef = React.useRef<VirtuosoDataTableMethods<unknown> | null>(null)
    const implicitModelRef = React.useRef<DataModelHandle | null>(null)
    const engineProviderProps = {
      ...(engineId === undefined ? {} : { engineId }),
      ...(engineRef === undefined ? {} : { engineRef }),
    }
    React.useImperativeHandle(ref, () => apiObjectRef.current!, [])

    React.useEffect(() => {
      window.addEventListener('error', silenceResizeObserverError, {
        capture: true,
      })
      return () => {
        window.removeEventListener('error', silenceResizeObserverError, { capture: true })
      }
    }, [])

    return (
      <EngineProvider
        {...engineProviderProps}
        // oxlint-disable-next-line jsx-no-new-function-as-prop
        initFn={(e) => {
          e.register(rowsState$)
          e.register(columnDeclarationOrder$)
          e.register(columnItemsState$)
          e.register(dataTableStructureEntries$)
          e.register(scrollToPending$)
          e.register(scrollDirection$)
          e.register(deviationDelta$)
          e.register(atBottomState$)
          e.register(groupStickyConfig$)
          e.register(groupLevelMap$)
          e.register(viewportRange$)
          e.register(loadingState$)

          const model = externalModel ?? localSource({ data: [...data.data], groups: data.groups })
          if (!externalModel) {
            implicitModelRef.current = model
          }
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
          apiObjectRef.current = virtuosoApiObject<unknown>(e)
        }}
        // oxlint-disable-next-line jsx-no-new-function-as-prop
        updateFn={(e) => {
          if (implicitModelRef.current) {
            implicitModelRef.current.setData!([...data.data], data.groups)
          }
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
          data,
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
) as (<Data, Context, Group = unknown>(
  props: VirtuosoDataTableProps<Data, Context, Group> & {
    ref?: NoInfer<React.Ref<VirtuosoDataTableMethods<Data>>>
  }
) => React.ReactElement) & { displayName?: string }

VirtuosoDataTable.displayName = 'VirtuosoDataTable'

export type { ColumnHeaderRenderParams, ColumnHeaderRendererProps } from '../columns/ColumnHeader'
