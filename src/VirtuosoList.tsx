import React, { useContext, useCallback, ReactElement, useRef, useLayoutEffect, CSSProperties } from 'react'
import { useObservable } from './Utils'
import { VirtuosoState } from './Virtuoso'
import { VirtuosoContext } from './VirtuosoContext'
import { Item } from './OffsetList'
import { ItemHeightPublisher } from './ItemHeightPublisher'

type TListProps = Pick<VirtuosoState, 'list$'> & {
  transform?: string
  render: (index: number) => ReactElement
  fixedItemHeight: boolean
}

interface TInnerListProps {
  items: Item[]
  transform?: string
  render: (index: number) => ReactElement
  itemAttributes?: (item: Item) => { [key: string]: any }
  getStyle: (index: number) => CSSProperties
}

interface TItemRendererParams {
  items: Item[]
  render: (index: number) => ReactElement
  itemAttributes?: (item: Item) => { [key: string]: any }
  getStyle: (index: number) => CSSProperties
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

const VirtuosoVariableList: React.FC<TInnerListProps> = React.memo(({ items, render, getStyle }) => {
  const { itemHeights$ } = useContext(VirtuosoContext)!
  const heightPublisher = useRef(new ItemHeightPublisher(itemHeights$))

  useLayoutEffect(() => {
    heightPublisher.current.init()
    return () => {
      heightPublisher.current.destroy()
    }
  }, [items])

  return <>{itemRenderer({ items, render, itemAttributes: heightPublisher.current.getItemAttributes(), getStyle })}</>
})

const VirtuosoStaticList: React.FC<TInnerListProps> = React.memo(({ items, render, getStyle }) => {
  return <>{itemRenderer({ items, render, getStyle })}</>
})

export const VirtuosoList: React.FC<TListProps> = React.memo(({ list$, transform = '', render, fixedItemHeight }) => {
  const { stickyItems$ } = useContext(VirtuosoContext)!
  const items = useObservable<Item[]>(list$, [])
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

  if (items.length === 0) {
    return null
  }

  return fixedItemHeight ? (
    <VirtuosoStaticList {...{ items, render, getStyle }} />
  ) : (
    <VirtuosoVariableList {...{ items, render, getStyle }} />
  )
})
