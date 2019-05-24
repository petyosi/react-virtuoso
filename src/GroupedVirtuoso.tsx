import { VirtuosoProps, VirtuosoState, VirtuosoPresentation } from './Virtuoso'
import React, { ReactElement, PureComponent } from 'react'
import { VirtuosoStore, TScrollLocation } from './VirtuosoStore'
import { ListItem } from 'GroupIndexTransposer'

type GroupedVirtuosoProps = Pick<VirtuosoProps, Exclude<keyof VirtuosoProps, 'totalCount' | 'topItems' | 'item'>> & {
  groupCounts: number[]
  group: (groupIndex: number) => ReactElement
  item: (index: number, groupIndex: number) => ReactElement
  groupIndices?: (indices: number[]) => void
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

  protected itemRender = (item: ListItem): ReactElement => {
    if (item.type == 'group') {
      return this.props.group(item.groupIndex)
    } else {
      return this.props.item(item.transposedIndex, item.groupIndex)
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
      />
    )
  }
}
