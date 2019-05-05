import React, { ReactElement, PureComponent } from 'react';
import { VirtuosoStore } from './VirtuosoStore';
import { VirtuosoContext } from './VirtuosoContext';
import { VirtuosoView } from './VirtuosoView';

export type VirtuosoState = ReturnType<typeof VirtuosoStore>;

interface VirtuosoProps {
  /**
   * The total amount of items to project
   */
  totalCount: number;
  /**
   * The amount in (pixels) to add in addition to the screen size
   */
  overscan: number;
  /**
   * @default 0
   */
  topItems?: number;
  /**
   * The footer to display
   */
  footer?: () => ReactElement;

  item: (index: number) => ReactElement;

  maxIndex?: (index: number) => void;
}

export class Virtuoso extends PureComponent<VirtuosoProps, VirtuosoState> {
  public constructor(props: VirtuosoProps) {
    super(props);
    const { overscan, totalCount, topItems = 0 } = props;

    this.state = VirtuosoStore(overscan, totalCount, topItems);

    if (props.maxIndex) {
      this.state.biggestIndex$.subscribe(props.maxIndex);
    }
  }

  public static getDerivedStateFromProps(
    props: VirtuosoProps,
    state: VirtuosoState
  ) {
    state.totalCount$.next(props.totalCount);
    return null;
  }

  public render() {
    return (
      <VirtuosoContext.Provider value={this.state}>
        <VirtuosoView item={this.props.item} footer={this.props.footer} />
      </VirtuosoContext.Provider>
    );
  }
}
