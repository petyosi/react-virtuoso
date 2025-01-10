import { Realm, RealmContext, useCellValue, useCellValues, useRealm } from '@virtuoso.dev/gurx'
import { type CSSProperties, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { DefaultItemContent, itemContent$ } from './content'
import { context$, data$ } from './data'
import { listOffset$, scrollHeight$, scrollTop$, useWindowScroll$, viewportHeight$, viewportWidth$ } from './dom'
import type { ItemContent, ScrollerProps, SizeRange } from './interfaces'
import { type MasonryItem, masonryItemsState$ } from './masonry-item-state'
import { absoluteSizes$, columnCount$, indexesInColumns$, initialItemCount$, knownSizes$, masonryRanges$ } from './masonry-sizes'

export interface VirtuosoMasonryProps<Data, Context> extends ScrollerProps {
  columnCount: number
  data: Data[]
  context?: Context
  initialItemCount?: number
  /**
   * A React component that's used to render the individual item. See {@link ItemContent} for further details on the accepted props.
   */
  ItemContent?: NoInfer<ItemContent<Data, Context>>
  useWindowScroll?: boolean
}

export const VirtuosoMasonry = forwardRef<Record<string, never>, VirtuosoMasonryProps<unknown, unknown>>(
  (
    { initialItemCount = 0, data, context, columnCount, useWindowScroll = false, ItemContent = DefaultItemContent, ...scrollerProps },
    ref
  ) => {
    // biome-ignore lint/correctness/useExhaustiveDependencies: we need to run this only once
    const realm = useMemo(() => {
      const r = new Realm()
      r.register(indexesInColumns$)
      r.register(masonryItemsState$)
      r.register(knownSizes$)
      r.pubIn({
        [data$]: data.slice(),
        [context$]: context,
        [columnCount$]: columnCount,
        [itemContent$]: ItemContent,
        [initialItemCount$]: initialItemCount,
        [useWindowScroll$]: useWindowScroll,
      })

      return r
    }, [])

    useImperativeHandle(ref, () => ({}), [])

    useEffect(() => {
      realm.pubIn({
        [data$]: data.slice(),
        [context$]: context,
        [columnCount$]: columnCount,
      })
    })

    return (
      <RealmContext.Provider value={realm}>
        <VirtuosoScroller {...scrollerProps} />
      </RealmContext.Provider>
    )
  }
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
        throw new Error('ResizeObserver not found. Please ensure that you have a polyfill installed.')
      }
      return SSRObserverShim
    }

    return new ResizeObserver((entries) => {
      const length = entries.length
      const columnCount = realm.getValue(columnCount$)
      const useWindowScroll = realm.getValue(useWindowScroll$)

      const results: SizeRange[][] = Array.from({ length: columnCount }, () => [])
      const absoluteSizes: Record<number, number> = {}

      let pubPayload = {}

      for (let i = 0; i < length; i++) {
        const entry = entries[i]
        const element = entry.target as HTMLDivElement

        if (element === scrollerRef.current) {
          pubPayload = {
            ...pubPayload,
            [scrollTop$]: useWindowScroll ? window.scrollY : element.scrollTop,
            [scrollHeight$]: useWindowScroll ? document.documentElement.scrollHeight : element.scrollHeight,
            [viewportHeight$]: useWindowScroll ? window.innerHeight : entry.contentRect.height,
            [viewportWidth$]: useWindowScroll ? window.innerWidth : element.clientWidth,
            ...(useWindowScroll ? {} : { [scrollHeight$]: element.scrollHeight, [listOffset$]: entry.contentRect.top }),
          }
          continue
        }
        if (element.dataset.role === 'column') {
          if (scrollerRef.current) {
            pubPayload = {
              ...pubPayload,
              [scrollHeight$]: scrollerRef.current.scrollHeight,
            }
          }
          continue
        }

        if (element.dataset.index === undefined) {
          continue
        }

        const index = Number.parseInt(element.dataset.index)
        const knownSize = Number.parseFloat(element.dataset.knownSize ?? '')
        const size = entry.contentRect.height
        const columnIndex = Number.parseInt(element.dataset.columnIndex ?? '0')
        const absoluteIndex = Number.parseInt(element.dataset.absoluteIndex ?? '0')

        absoluteSizes[absoluteIndex] = size
        if (size === knownSize) {
          continue
        }

        const columnResults = results[columnIndex]

        const lastResult = columnResults[columnResults.length - 1]
        if (columnResults.length === 0 || lastResult.size !== size || lastResult.endIndex !== index - 1) {
          columnResults.push({ endIndex: index, size: size, startIndex: index })
        } else {
          columnResults[columnResults.length - 1].endIndex++
        }
      }

      if (results.some((columnResult) => columnResult.length > 0)) {
        pubPayload = {
          ...pubPayload,
          [masonryRanges$]: results,
        }
      }

      if (Object.keys(absoluteSizes).length > 0) {
        pubPayload = {
          ...pubPayload,
          [absoluteSizes$]: absoluteSizes,
        }
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
        if (current != null) {
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
      const onScroll = () => {
        realm.pubIn({
          [scrollTop$]: window.scrollY,
          [scrollHeight$]: document.documentElement.scrollHeight,
          [viewportHeight$]: window.innerHeight,
          [listOffset$]: scrollerRef.current?.getBoundingClientRect().top ?? 0,
        })
      }
      window.addEventListener('scroll', onScroll)
      onScroll()
      return () => {
        window.removeEventListener('scroll', onScroll)
      }
    }
  }, [useWindowScroll, realm])

  const builtInStyle: CSSProperties = useWindowScroll
    ? {
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
      }
    : {
        overflowY: 'scroll',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
      }

  return (
    <>
      <div
        {...htmlProps}
        ref={scrollerCallbackRef}
        data-testid="virtuoso-scroller"
        style={{
          ...builtInStyle,
          ...passedStyle,
        }}
      >
        {itemsState.columns.map((columnState, index) => (
          <div
            key={`column-${
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              index
            }`}
            ref={listCallbackRef(index)}
            data-testid="virtuoso-list"
            style={{
              flexGrow: 1,
              boxSizing: 'content-box',
              height: columnState.totalHeight,
              overflowAnchor: 'none',
              position: 'relative',
            }}
          >
            {columnState.items.map((item) => {
              return <MasonryListItem ItemContent={ItemContent} item={item} mount={observe} unmount={unobserve} key={item.index} />
            })}
          </div>
        ))}
      </div>
    </>
  )
}

interface MasonryItemProps {
  item: MasonryItem<unknown>
  mount: (element: HTMLElement) => void
  unmount: (element: HTMLElement) => void
  ItemContent: ItemContent<unknown, unknown>
}

const MasonryListItem: React.FC<MasonryItemProps> = ({ item, mount, unmount, ItemContent }) => {
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
      ref={callbackRef}
      data-column-index={item.columnIndex}
      data-index={item.indexInColumn}
      data-absolute-index={item.index}
      data-known-size={item.height}
      style={{
        boxSizing: 'border-box',
        overflowAnchor: 'none',
        position: 'absolute',
        width: '100%',
        top: item.offset,
      }}
    >
      <ItemContent data={item.data} index={item.index} context={context} />
    </div>
  )
}
