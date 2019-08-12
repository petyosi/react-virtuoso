import React, { CSSProperties, PureComponent, ReactElement, FC, useEffect } from 'react'
import { VirtuosoContext } from './VirtuosoContext'
import { TScrollLocation } from './EngineCommons'
import { VirtuosoStore } from './VirtuosoStore'
import { TScrollContainer, VirtuosoView, TListContainer, DefaultListContainer, TFooterContainer } from './VirtuosoView'
import { TRender, TRenderProps } from './VirtuosoList'
import { TSubscription, TSubscriber } from 'tinyrx'
import { ListItem } from './GroupIndexTransposer'

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
  itemsInView?: TSubscriber<ListItem[]>
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
  itemsInView?: TSubscriber<ListItem[]>
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
  itemsInView,
  ScrollContainer,
  ListContainer,
  FooterContainer,
}) => {
  useEffect(() => {
    let dispose: TSubscription
    if (itemsInView) {
      dispose = contextValue.inView$.subscribe(itemsInView)
    }
    return () => {
      if (dispose) {
        dispose()
      }
    }
  }, [itemsInView])
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
        ListContainer={ListContainer || DefaultListContainer}
      />
    </VirtuosoContext.Provider>
  )
}

export class Virtuoso extends PureComponent<VirtuosoProps, VirtuosoState> {
  unsubscribeitemsInView?: TSubscription

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

  public render() {
    return (
      <VirtuosoPresentation
        itemsInView={this.props.itemsInView}
        contextValue={this.state}
        style={this.props.style}
        className={this.props.className}
        item={this.itemRender}
        footer={this.props.footer}
        itemHeight={this.props.itemHeight}
        ScrollContainer={this.props.ScrollContainer}
        FooterContainer={this.props.FooterContainer}
        ListContainer={this.props.ListContainer}
      />
    )
  }
}
