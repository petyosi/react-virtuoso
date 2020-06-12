import React, { CSSProperties, ReactElement } from 'react'
import { TSubscriber } from 'tinyrx'
import { VirtuosoGridEngine } from './VirtuosoGridEngine'
import { VirtuosoScroller, TScrollContainer } from './VirtuosoScroller'
import { useOutput, useSize } from './Utils'
import { viewportStyle } from './Style'
import { TScrollLocation } from './EngineCommons'
import { ListRange } from './engines/scrollSeekEngine'

type TContainer =
  | React.ComponentType<{ className: string; style?: CSSProperties; key?: number }>
  | keyof JSX.IntrinsicElements

export interface VirtuosoGridProps {
  totalCount: number
  overscan?: number
  item: (index: number) => ReactElement
  style?: CSSProperties
  className?: string
  ScrollContainer?: TScrollContainer
  ListContainer?: TContainer
  ItemContainer?: TContainer
  listClassName?: string
  itemClassName?: string
  scrollingStateChange?: (isScrolling: boolean) => void
  endReached?: (index: number) => void
  initialItemCount?: number
  rangeChanged?: TSubscriber<ListRange>
  computeItemKey?: (index: number) => number
}

type VirtuosoGridState = ReturnType<typeof VirtuosoGridEngine>

type VirtuosoGridFCProps = Omit<VirtuosoGridProps, 'overscan' | 'totalCount'> & { engine: VirtuosoGridState }

type TItemBuilder = (
  range: [number, number],
  item: (index: number) => ReactElement,
  itemClassName: string,
  ItemContainer: TContainer,
  computeItemKey: (index: number) => number
) => ReactElement[]

export class VirtuosoGrid extends React.PureComponent<VirtuosoGridProps, VirtuosoGridState> {
  public state = VirtuosoGridEngine(this.props.initialItemCount)

  public static getDerivedStateFromProps(props: VirtuosoGridProps, engine: VirtuosoGridState) {
    engine.overscan(props.overscan || 0)
    engine.totalCount(props.totalCount)
    engine.isScrolling(props.scrollingStateChange)
    engine.endReached(props.endReached)
    engine.rangeChanged(props.rangeChanged)
    return null
  }

  public scrollToIndex(location: TScrollLocation) {
    this.state.scrollToIndex(location)
  }

  public render() {
    return <VirtuosoGridFC {...this.props} engine={this.state} />
  }
}

const buildItems: TItemBuilder = ([startIndex, endIndex], item, itemClassName, ItemContainer, computeItemKey) => {
  const items = []
  for (let index = startIndex; index <= endIndex; index++) {
    const key = computeItemKey(index)
    items.push(
      React.createElement(
        ItemContainer,
        {
          key,
          className: itemClassName,
        },
        item(index)
      )
    )
  }

  return items
}

const VirtuosoGridFC: React.FC<VirtuosoGridFCProps> = ({
  ScrollContainer,
  ItemContainer = 'div',
  ListContainer = 'div',
  className,
  item,
  itemClassName = 'virtuoso-grid-item',
  listClassName = 'virtuoso-grid-list',
  engine,
  style = { height: '40rem' },
  computeItemKey = key => key,
}) => {
  const { itemRange, listOffset, remainingHeight, gridDimensions, scrollTo, scrollTop } = engine

  const fillerHeight = useOutput<number>(remainingHeight, 0)
  const translate = useOutput<number>(listOffset, 0)
  const listStyle = { paddingTop: `${translate}px`, paddingBottom: `${fillerHeight}px` }
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
        {React.createElement(
          ListContainer,
          {
            style: listStyle,
            className: listClassName,
          },
          buildItems(itemIndexRange, item, itemClassName, ItemContainer, computeItemKey)
        )}
      </div>
    </VirtuosoScroller>
  )
}
