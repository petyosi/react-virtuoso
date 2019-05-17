import React, { CSSProperties, PureComponent, ReactElement, FC } from 'react'
import { VirtuosoContext } from './VirtuosoContext'
import { VirtuosoStore } from './VirtuosoStore'
import { VirtuosoView } from './VirtuosoView'
import { Subscription } from 'rxjs'
import { ListItem } from './GroupIndexTransposer'
import { TRender } from './VirtuosoList'

export type VirtuosoState = ReturnType<typeof VirtuosoStore>

export interface VirtuosoProps {
  totalCount: number
  overscan?: number
  topItems?: number
  footer?: () => ReactElement
  item: (index: number) => ReactElement
  itemHeight?: number
  endReached?: (index: number) => void
  scrollingStateChange?: (isScrolling: boolean) => void
  style?: CSSProperties
}

interface TVirtuosoPresentationProps {
  contextValue: VirtuosoState
  item: TRender
  footer?: () => ReactElement
  style?: CSSProperties
  itemHeight?: number
}

export const VirtuosoPresentation: FC<TVirtuosoPresentationProps> = ({
  contextValue,
  style,
  item,
  footer,
  itemHeight,
}) => {
  return (
    <VirtuosoContext.Provider value={contextValue}>
      <VirtuosoView style={style || {}} item={item} footer={footer} fixedItemHeight={itemHeight !== undefined} />
    </VirtuosoContext.Provider>
  )
}

export class Virtuoso extends PureComponent<VirtuosoProps, VirtuosoState> {
  public constructor(props: VirtuosoProps) {
    super(props)
    this.state = Virtuoso.getDerivedStateFromProps(this.props, VirtuosoStore(props))
  }

  public static getDerivedStateFromProps(props: VirtuosoProps, state: VirtuosoState) {
    state.subscriptions.unsubscribe()

    const nextSubscriptions = new Subscription()

    if (props.endReached) {
      nextSubscriptions.add(state.endReached$.subscribe(props.endReached))
    }

    if (props.scrollingStateChange) {
      nextSubscriptions.add(state.isScrolling$.subscribe(props.scrollingStateChange))
    }

    if (props.topItems) {
      state.topItemCount$.next(props.topItems)
    }

    state.totalCount$.next(props.totalCount)
    return { ...state, subscriptions: nextSubscriptions }
  }

  private itemRenderer = (item: ListItem) => {
    return this.props.item(item.index)
  }

  public render() {
    return (
      <VirtuosoPresentation
        contextValue={this.state}
        style={this.props.style}
        item={this.itemRenderer}
        footer={this.props.footer}
        itemHeight={this.props.itemHeight}
      />
    )
  }
}
