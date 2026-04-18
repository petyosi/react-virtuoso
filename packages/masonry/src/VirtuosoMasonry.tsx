import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import { Realm, RealmContext, useCellValue, useCellValues, useRealm } from '@virtuoso.dev/gurx'

import { DefaultItemContent, itemContent$ } from './content'
import { context$, data$ } from './data'
import { listOffset$, scrollHeight$, scrollTop$, useWindowScroll$, viewportHeight$, viewportWidth$ } from './dom'
import { masonryItemsState$ } from './masonry-item-state'
import { absoluteSizes$, columnCount$, indexesInColumns$, initialItemCount$, knownSizes$, masonryRanges$ } from './masonry-sizes'

import type { ItemContent, ScrollerProps, SizeRange } from './interfaces'
import type { MasonryItem } from './masonry-item-state'

/**
 * Props for the VirtuosoMasonry component.
 * @typeParam Data - The type of items in the data array passed to the component.
 * @typeParam Context - Optional contextual data passed to the ItemContent render callback.
 * @group VirtuosoMasonry
 */
export interface VirtuosoMasonryProps<Data, Context> extends ScrollerProps {
  /**
   * The number of columns to be rendered. This prop is required.
   * The component distributes items across columns using a shortest-column-first algorithm.
   *
   * @example
   * ```tsx
   * <VirtuosoMasonry columnCount={3} data={items} />
   * ```
   */
  columnCount: number
  /**
   * Additional data to be passed to the item content component. This prop is optional.
   */
  context?: Context
  /**
   * The data array to be rendered. This prop is required.
   * Each item will be passed to the {@link ItemContent} component for rendering.
   *
   * @example
   * ```tsx
   * const items = [
   *   { id: 1, title: 'Item 1', imageUrl: '...' },
   *   { id: 2, title: 'Item 2', imageUrl: '...' },
   * ]
   * <VirtuosoMasonry data={items} columnCount={3} />
   * ```
   */
  data: Data[]
  /**
   * Use this prop for SSR rendering of a pre-defined amount of items.
   */
  initialItemCount?: number
  /**
   * A React component that renders each individual item in the masonry grid.
   * Receives `data`, `index`, and `context` as props.
   *
   * @example
   * ```tsx
   * const MyItemContent: ItemContent<MyData> = ({ data, index }) => (
   *   <div style={{ padding: 8 }}>
   *     <img src={data.imageUrl} style={{ width: '100%' }} />
   *     <p>{data.title}</p>
   *   </div>
   * )
   *
   * <VirtuosoMasonry data={items} columnCount={3} ItemContent={MyItemContent} />
   * ```
   */
  ItemContent?: NoInfer<ItemContent<Data, Context>>
  /**
   * Set to true to make the component use the document scroller instead of creating an element with `overflow-y: auto`.
   */
  useWindowScroll?: boolean
}

/**
 * A React component for efficiently rendering large masonry/Pinterest-style layouts with variable-height items
 * distributed across multiple columns. Supports virtualization, window scrolling, and SSR.
 * @typeParam Data - The type of items in the data array passed to the component.
 * @typeParam Context - Optional contextual data passed to the ItemContent render callback.
 * @group VirtuosoMasonry
 */
export const VirtuosoMasonry = forwardRef<Record<string, never>, VirtuosoMasonryProps<unknown, unknown>>(
  (
    { columnCount, context, data, initialItemCount = 0, ItemContent = DefaultItemContent, useWindowScroll = false, ...scrollerProps },
    ref
  ) => {
    const realm = useMemo(() => {
      const r = new Realm()
      r.register(indexesInColumns$)
      r.register(masonryItemsState$)
      r.register(knownSizes$)
      r.pubIn({
        [columnCount$]: columnCount,
        [context$]: context,
        [data$]: data.slice(),
        [initialItemCount$]: initialItemCount,
        [itemContent$]: ItemContent,
        [useWindowScroll$]: useWindowScroll,
      })

      return r
      // oxlint-disable-next-line exhaustive-deps
    }, [])

    useImperativeHandle(ref, () => ({}), [])

    useEffect(() => {
      realm.pubIn({
        [columnCount$]: columnCount,
        [context$]: context,
        [data$]: data.slice(),
      })
    })

    return (
      <RealmContext.Provider value={realm}>
        <VirtuosoScroller {...scrollerProps} />
      </RealmContext.Provider>
    )
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- generic forwardRef pattern requires cast
) as <Data, Context>(props: VirtuosoMasonryProps<Data, Context> & { ref?: NoInfer<React.Ref<Record<string, never>>> }) => React.ReactElement

// @ts-expect-error not typing this
VirtuosoMasonry.displayName = 'VirtuosoMasonry'

const SSRObserverShim = {
  observe: () => {},
  unobserve: () => {},
}

const VirtuosoScroller: React.FC<ScrollerProps> = ({ style: passedStyle, ...htmlProps }) => {
  const realm = useRealm()

  const [observer] = useState(() => {
    if (typeof ResizeObserver === 'undefined') {
      if (typeof window !== 'undefined') {
        throw new TypeError('ResizeObserver not found. Please ensure that you have a polyfill installed.')
      }
      return SSRObserverShim
    }

    return new ResizeObserver((entries) => {
      const length = entries.length
      const columnCount = realm.getValue(columnCount$)
      const useWindowScroll = realm.getValue(useWindowScroll$)

      const results: SizeRange[][] = Array.from({ length: columnCount }, () => [])
      const absoluteSizes: Record<number, number> = {}

      const pubPayload: Record<symbol, unknown> = {}

      for (let i = 0; i < length; i++) {
        const entry = entries[i]!
        // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
        const element = entry.target as HTMLDivElement

        if (element === scrollerRef.current) {
          const theWindow = element.ownerDocument.defaultView!

          pubPayload[scrollHeight$] = useWindowScroll ? theWindow.document.documentElement.scrollHeight : element.scrollHeight
          pubPayload[scrollTop$] = useWindowScroll ? theWindow.scrollY : element.scrollTop
          pubPayload[viewportHeight$] = useWindowScroll ? theWindow.innerHeight : entry.contentRect.height
          pubPayload[viewportWidth$] = useWindowScroll ? theWindow.innerWidth : element.clientWidth
          if (!useWindowScroll) {
            pubPayload[listOffset$] = entry.contentRect.top
            pubPayload[scrollHeight$] = element.scrollHeight
          }
          continue
        }
        if (element.dataset.role === 'column') {
          if (scrollerRef.current) {
            pubPayload[scrollHeight$] = scrollerRef.current.scrollHeight
          }
          continue
        }

        if (element.dataset.index === undefined) {
          continue
        }

        const index = Number.parseInt(element.dataset.index, 10)
        const knownSize = Number.parseFloat(element.dataset.knownSize ?? '')
        const size = entry.contentRect.height
        const columnIndex = Number.parseInt(element.dataset.columnIndex ?? '0', 10)
        const absoluteIndex = Number.parseInt(element.dataset.absoluteIndex ?? '0', 10)

        absoluteSizes[absoluteIndex] = size
        if (size === knownSize) {
          continue
        }

        const columnResults = results[columnIndex]!

        const lastResult = columnResults[columnResults.length - 1]
        if (columnResults.length === 0 || lastResult!.size !== size || lastResult!.endIndex !== index - 1) {
          columnResults.push({ endIndex: index, size, startIndex: index })
        } else {
          columnResults[columnResults.length - 1]!.endIndex++
        }
      }

      if (results.some((columnResult) => columnResult.length > 0)) {
        pubPayload[masonryRanges$] = results
      }

      if (Object.keys(absoluteSizes).length > 0) {
        pubPayload[absoluteSizes$] = absoluteSizes
      }

      realm.pubIn(pubPayload)
    })
  })

  const observe = useCallback(
    (element: HTMLElement) => {
      observer.observe(element)
    },
    [observer]
  )

  const unobserve = useCallback(
    (element: HTMLElement) => {
      observer.unobserve(element)
    },
    [observer]
  )

  const scrollerRef = useRef<HTMLElement | null>(null)
  const listRef = useRef<(HTMLElement | null)[]>([])

  const listCallbackRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      if (el) {
        listRef.current[index] = el
        observer.observe(el, { box: 'border-box' })
      } else {
        const current = listRef.current[index]
        if (current !== null && current !== undefined) {
          observer.unobserve(current)
          listRef.current[index] = null
        }
      }
    },
    [observer]
  )

  const onScroll = useCallback(() => {
    const element = scrollerRef.current
    if (element !== null) {
      realm.pub(scrollTop$, element.scrollTop)
    }
  }, [realm])

  const scrollerCallbackRef = useCallback(
    (el: HTMLElement | null) => {
      if (el) {
        scrollerRef.current = el
        el.addEventListener('scroll', onScroll)
        observer.observe(el, { box: 'border-box' })
      } else {
        if (scrollerRef.current) {
          scrollerRef.current.removeEventListener('scroll', onScroll)
          observer.unobserve(scrollerRef.current)
          scrollerRef.current = null
        }
      }
    },
    [observer, onScroll]
  )

  const [itemsState, ItemContent, useWindowScroll] = useCellValues(masonryItemsState$, itemContent$, useWindowScroll$)

  useEffect(() => {
    if (useWindowScroll) {
      const theWin = scrollerRef.current?.ownerDocument.defaultView!

      const handleWindowScroll = () => {
        realm.pubIn({
          [listOffset$]: scrollerRef.current?.getBoundingClientRect().top ?? 0,
          [scrollHeight$]: theWin.document.documentElement.scrollHeight,
          [scrollTop$]: theWin.scrollY,
          [viewportHeight$]: theWin.innerHeight,
        })
      }
      theWin.addEventListener('scroll', handleWindowScroll)
      handleWindowScroll()
      return () => {
        theWin.removeEventListener('scroll', handleWindowScroll)
      }
    }
    return undefined
  }, [useWindowScroll, realm])

  const builtInStyle: CSSProperties = useWindowScroll
    ? {
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
      }
    : {
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        overflowY: 'scroll',
      }

  return (
    <div
      {...htmlProps}
      data-testid="virtuoso-scroller"
      ref={scrollerCallbackRef}
      style={{
        ...builtInStyle,
        ...passedStyle,
      }}
    >
      {itemsState.columns.map((columnState, index) => (
        <div
          data-testid="virtuoso-list"
          // oxlint-disable-next-line no-array-index-key -- stable column layout
          key={`column-${index}`}
          ref={listCallbackRef(index)}
          style={{
            boxSizing: 'content-box',
            flexGrow: 1,
            height: columnState.totalHeight,
            overflowAnchor: 'none',
            position: 'relative',
          }}
        >
          {columnState.items.map((item) => {
            return <MasonryListItem item={item} ItemContent={ItemContent} key={item.index} mount={observe} unmount={unobserve} />
          })}
        </div>
      ))}
    </div>
  )
}

interface MasonryItemProps {
  item: MasonryItem<unknown>
  ItemContent: ItemContent<unknown, unknown>
  mount: (element: HTMLElement) => void
  unmount: (element: HTMLElement) => void
}

const MasonryListItem: React.FC<MasonryItemProps> = ({ item, ItemContent, mount, unmount }) => {
  const context = useCellValue(context$)
  const ref = useRef<HTMLDivElement | null>(null)

  const callbackRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) {
        ref.current = el
        mount(el)
      } else {
        if (ref.current) {
          unmount(ref.current)
          ref.current = null
        }
      }
    },
    [mount, unmount]
  )

  return (
    <div
      data-absolute-index={item.index}
      data-column-index={item.columnIndex}
      data-index={item.indexInColumn}
      data-known-size={item.height}
      ref={callbackRef}
      style={{
        boxSizing: 'border-box',
        overflowAnchor: 'none',
        position: 'absolute',
        top: item.offset,
        width: '100%',
      }}
    >
      <ItemContent context={context} data={item.data} index={item.index} />
    </div>
  )
}
