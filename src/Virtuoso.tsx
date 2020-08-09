import React, { CSSProperties, FC, forwardRef, ReactElement, useImperativeHandle, useEffect, useState } from 'react'
import { TScrollLocation } from './EngineCommons'
import { ListRange, ScrollSeekConfiguration } from './engines/scrollSeekEngine'
import { ListItem } from './GroupIndexTransposer'
import { TSubscriber } from './tinyrx'
import { VirtuosoContext } from './VirtuosoContext'
import { TRenderProps } from './VirtuosoList'
import { VirtuosoStore } from './VirtuosoStore'
import {
  DefaultListContainer,
  THeaderContainer,
  TFooterContainer,
  TListContainer,
  TScrollContainer,
  VirtuosoView,
} from './VirtuosoView'

export type VirtuosoState = ReturnType<typeof VirtuosoStore>

export type TItemContainer = React.FC<Omit<TRenderProps, 'renderPlaceholder' | 'scrollVelocity'>>

export interface VirtuosoProps {
  totalCount: number
  overscan?: number
  topItems?: number
  header?: () => ReactElement
  footer?: () => ReactElement
  item: (index: number) => ReactElement
  computeItemKey?: (index: number) => React.Key
  prependItemCount?: number
  itemHeight?: number
  defaultItemHeight?: number
  endReached?: (index: number) => void
  scrollingStateChange?: TSubscriber<boolean>
  atBottomStateChange?: TSubscriber<boolean>
  itemsRendered?: TSubscriber<ListItem[]>
  rangeChanged?: TSubscriber<ListRange>
  totalListHeightChanged?: TSubscriber<number>
  style?: CSSProperties
  dataKey?: string
  className?: string
  initialItemCount?: number
  initialTopMostItemIndex?: number
  followOutput?: boolean
  ScrollContainer?: TScrollContainer
  HeaderContainer?: THeaderContainer
  FooterContainer?: TFooterContainer
  ListContainer?: TListContainer
  ItemContainer?: TItemContainer
  maxHeightCacheSize?: number
  scrollSeek?: ScrollSeekConfiguration
  emptyComponent?: React.ReactNode
}

export interface TVirtuosoPresentationProps {
  contextValue: VirtuosoState
  header?: () => ReactElement
  footer?: () => ReactElement
  style?: CSSProperties
  className?: string
  itemHeight?: number
  ScrollContainer?: TScrollContainer
  HeaderContainer?: THeaderContainer
  FooterContainer?: TFooterContainer
  ListContainer?: TListContainer
  emptyComponent?: React.ReactNode
}

export { TScrollContainer, TListContainer }

const DEFAULT_STYLE = {}
export const VirtuosoPresentation: FC<TVirtuosoPresentationProps> = React.memo(
  ({
    contextValue,
    style,
    className,
    header,
    footer,
    itemHeight,
    ScrollContainer,
    ListContainer,
    HeaderContainer,
    FooterContainer,
    emptyComponent,
  }) => {
    return (
      <VirtuosoContext.Provider value={contextValue}>
        <VirtuosoView
          style={style || DEFAULT_STYLE}
          className={className}
          header={header}
          footer={footer}
          fixedItemHeight={itemHeight !== undefined}
          ScrollContainer={ScrollContainer}
          HeaderContainer={HeaderContainer}
          FooterContainer={FooterContainer}
          ListContainer={ListContainer || DefaultListContainer}
          emptyComponent={emptyComponent}
        />
      </VirtuosoContext.Provider>
    )
  }
)

export interface VirtuosoMethods {
  scrollToIndex(location: TScrollLocation): void
  adjustForPrependedItems(count: number): void
}

export const Virtuoso = forwardRef<VirtuosoMethods, VirtuosoProps>((props, ref) => {
  const [state] = useState(() => VirtuosoStore(props))
  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (location: TScrollLocation) => {
        state.scrollToIndex(location)
      },

      adjustForPrependedItems: (count: number) => {
        state.adjustForPrependedItems(count)
      },
    }),
    [state]
  )

  useEffect(() => {
    state.isScrolling(props.scrollingStateChange)
    state.atBottomStateChange(props.atBottomStateChange)
    state.endReached(props.endReached)
    state.topItemCount(props.topItems || 0)
    state.totalCount(props.totalCount)
    props.initialItemCount && state.initialItemCount(props.initialItemCount)
    state.itemsRendered(props.itemsRendered)
    state.totalListHeightChanged(props.totalListHeightChanged)
    state.followOutput(!!props.followOutput)
    state.maxRangeSize(props.maxHeightCacheSize || Infinity)
    state.rangeChanged(props.rangeChanged)
    state.scrollSeekConfiguration(props.scrollSeek)
    state.computeItemKey(props.computeItemKey || (key => key))
    state.itemContainer(props.ItemContainer || 'div')
    state.renderProp(props.item)
    state.dataKey(props.dataKey)

    return () => {
      state.itemsRendered(undefined)
      state.totalListHeightChanged(undefined)
    }
  }, [
    state,
    props.scrollingStateChange,
    props.atBottomStateChange,
    props.endReached,
    props.topItems,
    props.totalCount,
    props.initialItemCount,
    props.itemsRendered,
    props.totalListHeightChanged,
    props.followOutput,
    props.maxHeightCacheSize,
    props.rangeChanged,
    props.scrollSeek,
    props.item,
    props.ItemContainer,
    props.computeItemKey,
    props.dataKey,
  ])

  return (
    <VirtuosoPresentation
      contextValue={state}
      style={props.style}
      className={props.className}
      header={props.header}
      footer={props.footer}
      itemHeight={props.itemHeight}
      ScrollContainer={props.ScrollContainer}
      HeaderContainer={props.HeaderContainer}
      FooterContainer={props.FooterContainer}
      ListContainer={props.ListContainer}
      emptyComponent={props.emptyComponent}
    />
  )
})

Virtuoso.displayName = 'Virtuoso'
