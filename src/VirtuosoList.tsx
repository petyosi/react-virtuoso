import React, { useContext, useCallback, ReactElement, useRef, useLayoutEffect, CSSProperties } from 'react'
import { CallbackRefParam, useObservable } from './Utils'
import { VirtuosoState } from './Virtuoso'
import { VirtuosoContext } from './VirtuosoContext'
import { Item } from './OffsetList'
import ResizeObserver from 'resize-observer-polyfill'

type ListObservables = Pick<VirtuosoState, 'list$'> & {
  transform?: string
  item: (index: number) => ReactElement
}

interface TItemSize {
  start: number
  end: number
  size: number
}

type TbuildSizes = (items: HTMLElement[]) => TItemSize[]

interface TItemRendererParams {
  items: Item[]
  render: (index: number) => ReactElement
  itemAttributes?: (item: Item) => { [key: string]: any }
  getStyle: (index: number) => CSSProperties
}

const buildSizes: TbuildSizes = items => {
  const results: TItemSize[] = []
  for (const item of items) {
    const index = parseInt(item.dataset.index!)
    const size = item.offsetHeight
    if (results.length === 0 || results[results.length - 1].size !== size) {
      results.push({ start: index, end: index, size })
    } else {
      results[results.length - 1].end++
    }
  }
  return results
}

const itemRenderer = ({ items, itemAttributes, render, getStyle }: TItemRendererParams) => {
  return items.map(item => {
    return (
      <div key={item.index} {...itemAttributes && itemAttributes(item)} style={getStyle(item.index)}>
        {render(item.index)}
      </div>
    )
  })
}

export const VirtuosoList: React.FC<ListObservables> = React.memo(({ list$, transform = '', item: itemRenderProp }) => {
  const { stickyItems$, itemHeights$ } = useContext(VirtuosoContext)!
  const items = useObservable<Item[]>(list$, [])
  const itemRefs = useRef<HTMLElement[]>([])

  const stickyItems = useObservable<number[]>(stickyItems$, [])

  const getStyle = useCallback(
    (index): CSSProperties => {
      const pinned = stickyItems.some(stickyItemIndex => stickyItemIndex === index)

      const style: CSSProperties = {
        transform,
        zIndex: pinned ? 2 : undefined,
        position: pinned ? 'relative' : undefined,
      }

      return style
    },
    [stickyItems, transform]
  )

  useLayoutEffect(() => {
    let observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      itemHeights$.next(buildSizes(entries.map(({ target }) => target as HTMLElement)))
    })

    itemHeights$.next(buildSizes(itemRefs.current))

    itemRefs.current.map(item => {
      observer.observe(item)
    })

    return () => {
      itemRefs.current = []
      observer.disconnect()
    }
  }, [items])

  const itemCallbackRef = useCallback<(ref: CallbackRefParam) => void>(
    ref => {
      if (ref) {
        itemRefs.current.push(ref)
      }
    },
    [items]
  )

  const itemAttributes = (item: Item) => {
    return {
      'data-index': item.index,
      'data-known-size': item.size,
      ref: itemCallbackRef,
    }
  }

  return <>{itemRenderer({ items, render: itemRenderProp, itemAttributes, getStyle })}</>
})

export const VirtuosoFixedList: React.FC<ListObservables> = React.memo(({ list$, item: itemRenderProp, transform }) => {
  const items = useObservable<Item[]>(list$, [])
  const { stickyItems$ } = useContext(VirtuosoContext)!

  const stickyItems = useObservable<number[]>(stickyItems$, [])

  const getStyle = useCallback(
    (index): CSSProperties => {
      const pinned = stickyItems.some(stickyItemIndex => stickyItemIndex === index)

      const style: CSSProperties = {
        transform,
        zIndex: pinned ? 2 : undefined,
        position: pinned ? 'relative' : undefined,
      }

      return style
    },
    [stickyItems, transform]
  )

  return <>{itemRenderer({ items, render: itemRenderProp, getStyle })}</>
})
