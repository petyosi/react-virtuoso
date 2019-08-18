import React, { CSSProperties, FC, PureComponent, ReactElement } from 'react'
import { TSubscriber } from 'tinyrx'
import { TScrollLocation } from './EngineCommons'
import { ListItem } from './GroupIndexTransposer'
import { VirtuosoContext } from './VirtuosoContext'
import { TRender, TRenderProps } from './VirtuosoList'
import { VirtuosoStore } from './VirtuosoStore'
import { DefaultListContainer, TFooterContainer, TListContainer, TScrollContainer, VirtuosoView } from './VirtuosoView'
import { TInput } from 'rxio'

export type VirtuosoState = ReturnType<typeof VirtuosoStore>

export type TItemContainer = React.FC<TRenderProps>

export interface VirtuosoProps {
  totalCount: number
  overscan?: number
  topItems?: number
  footer?: () => ReactElement
  item: (index: number) => ReactElement
  computeItemKey?: (index: number) => number
  itemHeight?: number
  endReached?: (index: number) => void
  scrollingStateChange?: (isScrolling: boolean) => void
  itemsRendered?: TSubscriber<ListItem[]>
  heightObserver?: TSubscriber<number>
  heightObserverTest: TInput<number>
  style?: CSSProperties
  className?: string
  initialItemCount?: number
  ScrollContainer?: TScrollContainer
  FooterContainer?: TFooterContainer
  ListContainer?: TListContainer
  ItemContainer?: TItemContainer
}

interface TVirtuosoPresentationProps {
  contextValue: VirtuosoState
  item: TRender
  footer?: () => ReactElement
  style?: CSSProperties
  className?: string
  itemHeight?: number
  heightObserverTest: TInput<number>
  ScrollContainer?: TScrollContainer
  FooterContainer?: TFooterContainer
  ListContainer?: TListContainer
}

export { TScrollContainer, TListContainer }

export const VirtuosoPresentation: FC<TVirtuosoPresentationProps> = ({
  contextValue,
  style,
  className,
  item,
  footer,
  itemHeight,
  ScrollContainer,
  ListContainer,
  heightObserverTest,
  FooterContainer,
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
        FooterContainer={FooterContainer}
        heightObserverTest={heightObserverTest}
        ListContainer={ListContainer || DefaultListContainer}
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
    props.initialItemCount && state.initialItemCount(props.initialItemCount)
    state.itemsRendered(props.itemsRendered)
    state.heightObserver(props.heightObserver)
    return null
  }

  private itemRender: TRender = (item, { key, ...props }) => {
    const { computeItemKey, item: itemRender, ItemContainer = 'div' } = this.props
    if (computeItemKey) {
      key = computeItemKey(item.index)
    }

    return React.createElement(ItemContainer, { ...props, key }, itemRender(item.index))
  }

  public scrollToIndex(location: TScrollLocation) {
    this.state.scrollToIndex(location)
  }

  public componentWillUnmount() {
    this.state.itemsRendered(undefined)
    this.state.heightObserver(undefined)
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
        heightObserverTest={this.props.heightObserverTest}
        ScrollContainer={this.props.ScrollContainer}
        FooterContainer={this.props.FooterContainer}
        ListContainer={this.props.ListContainer}
      />
    )
  }
}
