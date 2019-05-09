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
  transform: string
  render: (index: number) => ReactElement
  itemAttributes?: (item: Item) => { [key: string]: any }
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

const itemRenderer = ({ items, itemAttributes, transform, render }: TItemRendererParams) => {
  const style: CSSProperties = {
    transform,
    zIndex: transform !== '' ? 2 : undefined,
    position: transform !== '' ? 'relative' : undefined,
  }
  return items.map(item => {
    return (
      <div key={item.index} {...itemAttributes && itemAttributes(item)} style={style}>
        {render(item.index)}
      </div>
    )
  })
}

export const VirtuosoList: React.FC<ListObservables> = React.memo(({ list$, transform = '', item: itemRenderProp }) => {
  const { itemHeights$ } = useContext(VirtuosoContext)!
  const items = useObservable<Item[]>(list$, [])
  const itemRefs = useRef<HTMLElement[]>([])

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

  return <>{itemRenderer({ items, transform, render: itemRenderProp, itemAttributes })}</>
})

export const VirtuosoFixedList: React.FC<ListObservables> = React.memo(
  ({ list$, transform = '', item: itemRenderProp }) => {
    const items = useObservable<Item[]>(list$, [])

    return <>{itemRenderer({ items, transform, render: itemRenderProp })}</>
  }
)
