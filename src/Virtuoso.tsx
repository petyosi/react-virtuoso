import React, { ReactElement, PureComponent } from 'react'
import { VirtuosoStore } from './VirtuosoStore'
import { VirtuosoContext } from './VirtuosoContext'
import { VirtuosoView } from './VirtuosoView'

export type VirtuosoState = ReturnType<typeof VirtuosoStore>

interface VirtuosoProps {
  /**
   * The total amount of items to project
   */
  totalCount: number

  /**
   * The amount in (pixels) to add in addition to the screen size
   * @default 0
   */
  overscan?: number

  /**
   * The amount of items to pin at the top of the scroll
   * @default 0
   */
  topItems?: number

  /**
   * Content to be displayed at the bottom of the list
   */
  footer?: () => ReactElement

  /**
   * Item renderer prop - accepts the item index. To increase performance, use React.memo for the child contents.
   */
  item: (index: number) => ReactElement

  /**
   * Optional, use for performance boost. Sets the height of the each item to a fixed amount,
   * causing the list to skip the measurement operations.
   * Use this only if you are certain that the items will stay the same size regardless of their content, the screen size, etc.
   * Notice: If you don't get that right, the items won't overlap each other, but the list may not render fully
   * or the total scroll size might be wrong, causing some items to be hidden.
   * @default undefined
   */
  itemHeight?: number

  endReached?: (index: number) => void
}

export class Virtuoso extends PureComponent<VirtuosoProps, VirtuosoState> {
  public static defaultProps = {
    topItems: 0,
  }

  public constructor(props: VirtuosoProps) {
    super(props)

    this.state = VirtuosoStore(props)

    if (props.endReached) {
      this.state.endReached$.subscribe(props.endReached)
    }
  }

  public static getDerivedStateFromProps(props: VirtuosoProps, state: VirtuosoState) {
    state.totalCount$.next(props.totalCount)
    return null
  }

  public render() {
    return (
      <VirtuosoContext.Provider value={this.state}>
        <VirtuosoView
          item={this.props.item}
          footer={this.props.footer}
          topItemCount={this.props.topItems!}
          fixedItemHeight={this.props.itemHeight !== undefined}
        />
      </VirtuosoContext.Provider>
    )
  }
}

export default Virtuoso
