import React, { forwardRef, ReactElement, useImperativeHandle, useState, useEffect } from 'react'
import { TScrollLocation } from './EngineCommons'
import { TItemContainer, VirtuosoPresentation, VirtuosoProps } from './Virtuoso'
import { VirtuosoStore } from './VirtuosoStore'

type GroupedVirtuosoProps = Pick<VirtuosoProps, Exclude<keyof VirtuosoProps, 'totalCount' | 'topItems' | 'item'>> & {
  groupCounts: number[]
  group: (groupIndex: number) => ReactElement
  item: (index: number, groupIndex?: number) => ReactElement
  groupIndices?: (indices: number[]) => void
  GroupContainer?: TItemContainer
}

export interface GroupedVirtuosoMethods {
  scrollToIndex(location: TScrollLocation): void
}

export const GroupedVirtuoso = forwardRef<GroupedVirtuosoMethods, GroupedVirtuosoProps>((props, ref) => {
  const [state] = useState(VirtuosoStore(props))
  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (location: TScrollLocation) => {
        state.scrollToIndex(location)
      },
    }),
    [state]
  )

  useEffect(() => {
    state.endReached(props.endReached)
    state.rangeChanged(props.rangeChanged)
    state.atBottomStateChange(props.atBottomStateChange)
    state.isScrolling(props.scrollingStateChange)
    state.groupCounts(props.groupCounts)
    state.groupIndices(props.groupIndices)
    state.itemsRendered(props.itemsRendered)
    state.totalListHeightChanged(props.totalListHeightChanged)
    state.renderProp(props.item)
    state.groupRenderProp(props.group)
    state.itemContainer(props.ItemContainer || 'div')
    state.groupContainer(props.GroupContainer || 'div')

    return () => {
      state.itemsRendered(undefined)
      state.totalListHeightChanged(undefined)
    }
  }, [
    state,
    props.endReached,
    props.rangeChanged,
    props.atBottomStateChange,
    props.scrollingStateChange,
    props.groupCounts,
    props.groupIndices,
    props.itemsRendered,
    props.totalListHeightChanged,
    props.item,
    props.group,
    props.GroupContainer,
    props.ItemContainer,
  ])

  return (
    <VirtuosoPresentation
      contextValue={state}
      style={props.style}
      className={props.className}
      footer={props.footer}
      itemHeight={props.itemHeight}
      ScrollContainer={props.ScrollContainer}
      FooterContainer={props.FooterContainer}
      ListContainer={props.ListContainer}
    />
  )
})

GroupedVirtuoso.displayName = 'GroupedVirtuoso'
