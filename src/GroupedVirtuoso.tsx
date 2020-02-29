import React, { forwardRef, ReactElement, useCallback, useImperativeHandle, useLayoutEffect, useState } from 'react'
import { TScrollLocation } from './EngineCommons'
import { TItemContainer, VirtuosoPresentation, VirtuosoProps } from './Virtuoso'
import { TRender } from './VirtuosoList'
import { VirtuosoStore } from './VirtuosoStore'

type GroupedVirtuosoProps = Pick<VirtuosoProps, Exclude<keyof VirtuosoProps, 'totalCount' | 'topItems' | 'item'>> & {
  groupCounts: number[]
  group: (groupIndex: number) => ReactElement
  item: (index: number, groupIndex: number) => ReactElement
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

  useLayoutEffect(() => {
    state.endReached(props.endReached)
    state.isScrolling(props.scrollingStateChange)
    state.groupCounts(props.groupCounts)
    state.groupIndices(props.groupIndices)
    state.itemsRendered(props.itemsRendered)
    state.totalListHeightChanged(props.totalListHeightChanged)
    return () => {
      state.itemsRendered(undefined)
      state.totalListHeightChanged(undefined)
    }
  }, [
    state,
    props.endReached,
    props.scrollingStateChange,
    props.groupCounts,
    props.groupIndices,
    props.itemsRendered,
    props.totalListHeightChanged,
  ])

  const itemRender: TRender = useCallback(
    (item, { renderPlaceholder: _renderPlaceholder, ...itemProps }) => {
      const ItemContainer = props.ItemContainer
      const GroupContainer = props.GroupContainer || ItemContainer
      if (item.type === 'group') {
        const children = props.group(item.groupIndex)
        if (GroupContainer) {
          return <GroupContainer {...itemProps}>{children}</GroupContainer>
        } else {
          return <div {...itemProps}>{children}</div>
        }
      } else {
        const children = props.item(item.transposedIndex, item.groupIndex)

        if (ItemContainer) {
          return <ItemContainer {...itemProps}>{children}</ItemContainer>
        } else {
          return <div {...itemProps}>{children}</div>
        }
      }
    },
    [props]
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

GroupedVirtuoso.displayName = 'GroupedVirtuoso'
