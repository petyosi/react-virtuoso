import React, { CSSProperties, useState, ReactElement } from 'react'
import { VirtuosoGridEngine } from './VirtuosoGridEngine'
import { VirtuosoScroller, TScrollContainer } from './VirtuosoScroller'
import { useOutput, useSize } from './Utils'
import { viewportStyle } from './Style'
import { VirtuosoFiller } from './VirtuosoFiller'

export interface VirtuosoGridProps {
  totalCount: number
  overscan?: number
  item: (index: number) => ReactElement
  style?: CSSProperties
  className?: string
  ScrollContainer?: TScrollContainer
  listClassName?: string
  itemClassName?: string

  // TODO
  endReached?: (index: number) => void
  scrollingStateChange?: (isScrolling: boolean) => void
  // ListContainer?: TListContainer
  // ItemContainer?: TItemContainer
}

export const VirtuosoGrid: React.FC<VirtuosoGridProps> = ({
  ScrollContainer,
  className,
  item,
  itemClassName = 'virtuoso-grid-item',
  listClassName = 'virtuoso-grid-list',
  overscan = 0,
  style = { height: '40rem' },
  totalCount,
}) => {
  const [engine] = useState(VirtuosoGridEngine)

  // get these from the props
  engine.overscan(overscan)
  engine.totalCount(totalCount)

  const { itemRange, listOffset, totalHeight, gridDimensions, scrollTo, scrollTop } = engine

  const fillerHeight = useOutput<number>(totalHeight, 0)
  const translate = useOutput<number>(listOffset, 0)
  const listStyle = { marginTop: `${translate}px` }
  const itemIndexRange = useOutput(itemRange, [0, 0] as [number, number])

  const viewportCallbackRef = useSize(({ element, width, height }) => {
    const firstItem = element.firstChild!.firstChild as HTMLElement
    gridDimensions([width, height, firstItem.offsetWidth, firstItem.offsetHeight])
  })

  const items = []
  for (let index = itemIndexRange[0]; index <= itemIndexRange[1]; index++) {
    items.push(
      <div key={index} className={itemClassName}>
        {item(index)}
      </div>
    )
  }

  return (
    <VirtuosoScroller
      style={style}
      ScrollContainer={ScrollContainer}
      className={className}
      scrollTo={scrollTo}
      scrollTop={scrollTop}
    >
      <div ref={viewportCallbackRef} style={viewportStyle}>
        <div style={listStyle} className={listClassName}>
          {items}
        </div>
      </div>

      <VirtuosoFiller height={fillerHeight} />
    </VirtuosoScroller>
  )
}
