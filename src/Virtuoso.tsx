import React, { CSSProperties, PureComponent, ReactElement, FC } from 'react'
import { VirtuosoContext } from './VirtuosoContext'
import { VirtuosoStore, TScrollLocation } from './VirtuosoStore'
import { TScrollContainer, VirtuosoView } from './VirtuosoView'
import { ListItem } from './GroupIndexTransposer'
import { TRender } from './VirtuosoList'

export type VirtuosoState = ReturnType<typeof VirtuosoStore>

export interface VirtuosoProps {
  totalCount: number
  overscan?: number
  topItems?: number
  footer?: () => ReactElement
  item: (index: number) => ReactElement
  itemHeight?: number
  endReached?: (index: number) => void
  scrollingStateChange?: (isScrolling: boolean) => void
  style?: CSSProperties
  className?: string
  ScrollContainer?: TScrollContainer
}

interface TVirtuosoPresentationProps {
  contextValue: VirtuosoState
  item: TRender
  footer?: () => ReactElement
  style?: CSSProperties
  className?: string
  itemHeight?: number
  ScrollContainer?: TScrollContainer
}

export { TScrollContainer }

export const VirtuosoPresentation: FC<TVirtuosoPresentationProps> = ({
  contextValue,
  style,
  className,
  item,
  footer,
  itemHeight,
  ScrollContainer,
}) => {
  return (
    <VirtuosoContext.Provider value={contextValue}>
      <VirtuosoView
        style={style || {}}
        className={className}
        item={item}
        footer={footer}
        fixedItemHeight={itemHeight !== undefined}
        ScrollContainer={ScrollContainer}
      />
    </VirtuosoContext.Provider>
  )
}

export class Virtuoso extends PureComponent<VirtuosoProps, VirtuosoState> {
  public constructor(props: VirtuosoProps) {
    super(props)
    this.state = VirtuosoStore(props)
  }

  public static getDerivedStateFromProps(props: VirtuosoProps, state: VirtuosoState) {
    state.isScrolling(props.scrollingStateChange)
    state.endReached(props.endReached)
    state.topItemCount(props.topItems || 0)
    state.totalCount(props.totalCount)
    return null
  }

  private itemRender = (item: ListItem) => {
    return this.props.item(item.index)
  }

  public scrollToIndex(location: TScrollLocation) {
    this.state.scrollToIndex(location)
  }

  public render() {
    return (
      <VirtuosoPresentation
        contextValue={this.state}
        style={this.props.style}
        className={this.props.className}
        item={this.itemRender}
        footer={this.props.footer}
        itemHeight={this.props.itemHeight}
        ScrollContainer={this.props.ScrollContainer}
      />
    )
  }
}
