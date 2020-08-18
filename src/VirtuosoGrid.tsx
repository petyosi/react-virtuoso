import * as React from 'react'
import { CSSProperties, ReactElement } from 'react'
import { TSubscriber } from './tinyrx'
import { VirtuosoGridEngine } from './VirtuosoGridEngine'
import { VirtuosoScroller, TScrollContainer } from './VirtuosoScroller'
import { useOutput, useSize } from './Utils'
import { viewportStyle } from './Style'
import { TScrollLocation, TContainer } from './EngineCommons'
import { ListRange, ScrollSeekConfiguration } from './engines/scrollSeekEngine'

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
  scrollSeek?: ScrollSeekConfiguration
}

type VirtuosoGridState = ReturnType<typeof VirtuosoGridEngine>

type VirtuosoGridFCProps = Omit<VirtuosoGridProps, 'overscan' | 'totalCount'> & { engine: VirtuosoGridState }

export class VirtuosoGrid extends React.PureComponent<VirtuosoGridProps, VirtuosoGridState> {
  public state = VirtuosoGridEngine(this.props.initialItemCount)

  public static getDerivedStateFromProps(props: VirtuosoGridProps, engine: VirtuosoGridState) {
    engine.overscan(props.overscan || 0)
    engine.totalCount(props.totalCount)
    engine.isScrolling(props.scrollingStateChange)
    engine.endReached(props.endReached)
    engine.rangeChanged(props.rangeChanged)
    engine.scrollSeekConfiguration(props.scrollSeek)
    return null
  }

  public scrollToIndex(location: TScrollLocation) {
    this.state.scrollToIndex(location)
  }

  public render() {
    return <VirtuosoGridFC {...this.props} engine={this.state} />
  }
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
  style = { height: '100%' },
  computeItemKey = key => key,
}) => {
  const { listOffsets, gridDimensions, scrollTo, scrollTop, itemsRender } = engine

  const { top, bottom } = useOutput(listOffsets, { top: 0, bottom: 0 })
  const render = useOutput(itemsRender, false)

  const listStyle = { paddingTop: `${top}px`, paddingBottom: `${bottom}px` }

  const viewportCallbackRef = useSize(({ element, width, height }) => {
    const firstItem = element.firstChild!.firstChild as HTMLElement
    const firstItemContent = firstItem!.firstChild as HTMLElement
    gridDimensions([
      width,
      height,
      firstItem.offsetWidth,
      firstItem.offsetHeight,
      firstItemContent.offsetWidth,
      firstItemContent.offsetHeight,
    ])
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
          render.render(item, itemClassName, ItemContainer, computeItemKey)
        )}
      </div>
    </VirtuosoScroller>
  )
}
