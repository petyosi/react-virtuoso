import { VirtuosoProps, VirtuosoState, VirtuosoPresentation } from './Virtuoso'
import React, { ReactElement, PureComponent } from 'react'
import { VirtuosoStore } from './VirtuosoStore'
import { ListItem } from 'GroupIndexTransposer'

type GroupedVirtuosoProps = Pick<VirtuosoProps, Exclude<keyof VirtuosoProps, 'totalCount' | 'topItems' | 'item'>> & {
  groupCounts: number[]
  group: (groupIndex: number) => ReactElement
  item: (index: number, groupIndex: number) => ReactElement
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

    return null
  }

  protected itemRender = (item: ListItem): ReactElement => {
    if (item.type == 'group') {
      return this.props.group(item.groupIndex)
    } else {
      return this.props.item(item.transposedIndex, item.groupIndex)
    }
  }

  public render() {
    return (
      <VirtuosoPresentation
        contextValue={this.state}
        style={this.props.style}
        item={this.itemRender}
        footer={this.props.footer}
        itemHeight={this.props.itemHeight}
      />
    )
  }
}
