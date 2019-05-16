import { VirtuosoProps, VirtuosoState, VirtuosoPresentation } from './Virtuoso'
import React, { ReactElement, PureComponent } from 'react'
import { VirtuosoStore } from './VirtuosoStore'
import { Subscription } from 'rxjs'

type GroupedVirtuosoProps = Pick<VirtuosoProps, Exclude<keyof VirtuosoProps, 'totalCount' | 'topItems' | 'item'>> & {
  groupCounts: number[]
  group: (groupIndex: number) => ReactElement
  item: (index: number, groupIndex: number) => ReactElement
}

export class GroupedVirtuoso extends PureComponent<GroupedVirtuosoProps, VirtuosoState> {
  public constructor(props: GroupedVirtuosoProps) {
    super(props)

    this.state = GroupedVirtuoso.getDerivedStateFromProps(this.props, VirtuosoStore(props))
  }

  public static getDerivedStateFromProps(props: GroupedVirtuosoProps, state: VirtuosoState) {
    state.subscriptions.unsubscribe()

    const nextSubscriptions = new Subscription()

    if (props.endReached) {
      nextSubscriptions.add(state.endReached$.subscribe(props.endReached))
    }

    if (props.scrollingStateChange) {
      nextSubscriptions.add(state.isScrolling$.subscribe(props.scrollingStateChange))
    }

    state.groupCounts$.next(props.groupCounts)

    return { ...state, subscriptions: nextSubscriptions }
  }

  protected itemRender = (index: number): ReactElement => {
    const item = this.state.groupIndexTranspose(index)
    if (item.type == 'group') {
      return this.props.group(item.index)
    } else {
      return this.props.item(item.index, item.groupIndex)
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
