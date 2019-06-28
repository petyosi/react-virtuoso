import React, { CSSProperties, ReactElement } from 'react'
import { VirtuosoGridEngine } from './VirtuosoGridEngine'
import { VirtuosoScroller, TScrollContainer } from './VirtuosoScroller'
import { useOutput, useSize } from './Utils'
import { viewportStyle } from './Style'
import { VirtuosoFiller } from './VirtuosoFiller'
import { TScrollLocation } from './EngineCommons'

export interface VirtuosoGridProps {
  totalCount: number
  overscan?: number
  item: (index: number) => ReactElement
  style?: CSSProperties
  className?: string
  ScrollContainer?: TScrollContainer
  listClassName?: string
  itemClassName?: string
  scrollingStateChange?: (isScrolling: boolean) => void
  endReached?: (index: number) => void
}

type VirtuosoGridState = ReturnType<typeof VirtuosoGridEngine>

type VirtuosoGridFCProps = Omit<VirtuosoGridProps, 'overscan' | 'totalCount'> & { engine: VirtuosoGridState }

type TItemBuilder = (
  range: [number, number],
  item: (index: number) => ReactElement,
  itemClassName: string
) => ReactElement[]

export class VirtuosoGrid extends React.PureComponent<VirtuosoGridProps, VirtuosoGridState> {
  public state = VirtuosoGridEngine()

  public static getDerivedStateFromProps(props: VirtuosoGridProps, engine: VirtuosoGridState) {
    engine.overscan(props.overscan || 0)
    engine.totalCount(props.totalCount)
    engine.isScrolling(props.scrollingStateChange)
    engine.endReached(props.endReached)
    return null
  }

  public scrollToIndex(location: TScrollLocation) {
    this.state.scrollToIndex(location)
  }

  public render() {
    return <VirtuosoGridFC {...this.props} engine={this.state} />
  }
}

const buildItems: TItemBuilder = ([startIndex, endIndex], item, itemClassName) => {
  const items = []
  for (let index = startIndex; index <= endIndex; index++) {
    items.push(
      <div key={index} className={itemClassName}>
        {item(index)}
      </div>
    )
  }

  return items
}

const VirtuosoGridFC: React.FC<VirtuosoGridFCProps> = ({
  ScrollContainer,
  className,
  item,
  itemClassName = 'virtuoso-grid-item',
  listClassName = 'virtuoso-grid-list',
  engine,
  style = { height: '40rem' },
}) => {
  const { itemRange, listOffset, totalHeight, gridDimensions, scrollTo, scrollTop } = engine

  const fillerHeight = useOutput<number>(totalHeight, 0)
  const translate = useOutput<number>(listOffset, 0)
  const listStyle = { marginTop: `${translate}px` }
  const itemIndexRange = useOutput(itemRange, [0, 0] as [number, number])

  const viewportCallbackRef = useSize(({ element, width, height }) => {
    const firstItem = element.firstChild!.firstChild as HTMLElement
    gridDimensions([width, height, firstItem.offsetWidth, firstItem.offsetHeight])
  })

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
          {buildItems(itemIndexRange, item, itemClassName)}
        </div>
      </div>

      <VirtuosoFiller height={fillerHeight} />
    </VirtuosoScroller>
  )
}
