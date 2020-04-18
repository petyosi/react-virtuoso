import React, {
  ComponentType,
  CSSProperties,
  FC,
  forwardRef,
  ReactElement,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from 'react'
import { TScrollLocation } from './EngineCommons'
import { ListRange, ScrollSeekToggle } from './engines/scrollSeekEngine'
import { ListItem } from './GroupIndexTransposer'
import { TSubscriber } from './tinyrx'
import { VirtuosoContext } from './VirtuosoContext'
import { TRender, TRenderProps } from './VirtuosoList'
import { VirtuosoStore } from './VirtuosoStore'
import { DefaultListContainer, TFooterContainer, TListContainer, TScrollContainer, VirtuosoView } from './VirtuosoView'

export type VirtuosoState = ReturnType<typeof VirtuosoStore>

export type TItemContainer = React.FC<Omit<TRenderProps, 'renderPlaceholder' | 'scrollVelocity'>>

type TSeekPlaceholder = ComponentType<{ height: number; index: number }>

export interface VirtuosoProps {
  totalCount: number
  overscan?: number
  topItems?: number
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
  FooterContainer?: TFooterContainer
  ListContainer?: TListContainer
  ItemContainer?: TItemContainer
  maxHeightCacheSize?: number
  scrollSeek?: {
    enter: ScrollSeekToggle
    change: (velocity: number, range: ListRange) => void
    exit: ScrollSeekToggle
    placeholder: TSeekPlaceholder
  }
}

export interface TVirtuosoPresentationProps {
  contextValue: VirtuosoState
  item: TRender
  footer?: () => ReactElement
  style?: CSSProperties
  className?: string
  itemHeight?: number
  ScrollContainer?: TScrollContainer
  FooterContainer?: TFooterContainer
  ListContainer?: TListContainer
}

export { TScrollContainer, TListContainer }

const DEFAULT_STYLE = {}
export const VirtuosoPresentation: FC<TVirtuosoPresentationProps> = React.memo(
  ({ contextValue, style, className, item, footer, itemHeight, ScrollContainer, ListContainer, FooterContainer }) => {
    return (
      <VirtuosoContext.Provider value={contextValue}>
        <VirtuosoView
          style={style || DEFAULT_STYLE}
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
)

export interface VirtuosoMethods {
  scrollToIndex(location: TScrollLocation): void
  adjustForPrependedItems(count: number): void
}

export const Virtuoso = forwardRef<VirtuosoMethods, VirtuosoProps>((props, ref) => {
  const [state] = useState(VirtuosoStore(props))
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

  useLayoutEffect(() => {
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
  ])

  const { scrollSeek, computeItemKey, dataKey, item: theItem, ItemContainer = 'div' } = props

  const itemRender: TRender = useCallback(
    (item, { key, renderPlaceholder, ...itemProps }) => {
      if (computeItemKey) {
        key = computeItemKey(item.index)
      }

      let children: ReactElement
      if (scrollSeek && renderPlaceholder) {
        children = React.createElement(scrollSeek.placeholder, {
          height: itemProps['data-known-size'],
          index: item.index,
        })
      } else {
        children = theItem(item.index)
      }

      return React.createElement(ItemContainer, { ...itemProps, key }, children)
    },
    [theItem, scrollSeek, computeItemKey, ItemContainer, dataKey]
  )

  return (
    <VirtuosoPresentation
      contextValue={state}
      style={props.style}
      className={props.className}
      item={itemRender}
      footer={props.footer}
      itemHeight={props.itemHeight}
      ScrollContainer={props.ScrollContainer}
      FooterContainer={props.FooterContainer}
      ListContainer={props.ListContainer}
    />
  )
})

Virtuoso.displayName = 'Virtuoso'
