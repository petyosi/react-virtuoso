import { VirtuosoProps, VirtuosoState, VirtuosoPresentation, TItemContainer } from './Virtuoso'
import { TScrollLocation } from './EngineCommons'
import React, { ReactElement, PureComponent } from 'react'
import { VirtuosoStore } from './VirtuosoStore'
import { TRender } from './VirtuosoList'

type GroupedVirtuosoProps = Pick<VirtuosoProps, Exclude<keyof VirtuosoProps, 'totalCount' | 'topItems' | 'item'>> & {
  groupCounts: number[]
  group: (groupIndex: number) => ReactElement
  item: (index: number, groupIndex: number) => ReactElement
  groupIndices?: (indices: number[]) => void
  GroupContainer?: TItemContainer
}

export class GroupedVirtuoso extends PureComponent<GroupedVirtuosoProps, VirtuosoState> {
  public constructor(props: GroupedVirtuosoProps) {
    super(props)
    this.state = VirtuosoStore(props)
  }

  public static getDerivedStateFromProps(props: GroupedVirtuosoProps, state: VirtuosoState) {
    state.endReached(props.endReached)
    state.isScrolling(props.scrollingStateChange)
    state.groupCounts(props.groupCounts)
    state.groupIndices(props.groupIndices)
    return null
  }

  protected itemRender: TRender = (item, props) => {
    const ItemContainer = this.props.ItemContainer
    const GroupContainer = this.props.GroupContainer || ItemContainer
    if (item.type == 'group') {
      const children = this.props.group(item.groupIndex)
      if (GroupContainer) {
        return (
          <GroupContainer key={props.key} {...props}>
            {children}
          </GroupContainer>
        )
      } else {
        return <div {...props}>{children}</div>
      }
    } else {
      const children = this.props.item(item.transposedIndex, item.groupIndex)

      if (ItemContainer) {
        return (
          <ItemContainer key={props.key} {...props}>
            {children}
          </ItemContainer>
        )
      } else {
        return <div {...props}>{children}</div>
      }
    }
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
        FooterContainer={this.props.FooterContainer}
        ListContainer={this.props.ListContainer}
      />
    )
  }
}
