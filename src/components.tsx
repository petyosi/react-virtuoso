import React, { ForwardRefExoticComponent, ReactElement, Ref } from 'react'
import { Grid, GridHandle } from './Grid'
import {
  Components,
  ComputeItemKey,
  FollowOutput,
  GroupContent,
  GroupItemContent,
  IndexLocationWithAlign,
  ItemContent,
  ListItem,
  ListRange,
  ScrollSeekConfiguration,
} from './interfaces'
import { List, ListHandle } from './List'
type CompProps<T> = T extends React.ForwardRefExoticComponent<infer R> ? R : never
type ListProps = CompProps<typeof List>
type GridProps = CompProps<typeof Grid>

export interface VirtuosoProps<D> extends Omit<ListProps, 'groupCounts' | 'groupContent'> {
  /**
   * The total amount of items to be rendered.
   */
  totalCount?: number

  /**
   * The data items to be rendered. If data is set, the total count will be inferred from the length of the array.
   */
  data?: readonly D[]

  /**
   * Increases the visual window which is used to calculate the rendered items with the specified **amount in pixels**.
   * Effectively, this makes the component "chunk" the rendering of new items by renderng more items than the necessary, but reducing the re-renders on scroll.
   * Setting { main: number, reverse: number } lets you extend the list in both the main and the reverse scrollable directions.
   */
  overscan?: number | { main: number; reverse: number }

  /**
   * Set the amount of items to remain fixed at the top of the list.
   *
   * For a header that scrolls away when scrolling, check the `components.Header` property.
   */
  topItemCount?: number

  /**
   * Set to a value between 0 and totalCount - 1 to make the list start scrolled to that item.
   */
  initialTopMostItemIndex?: number

  /**
   * Set this value to offset the initial location of the list.
   * Warning: using this property will still run a render cycle at the scrollTop: 0 list window.
   * If possible, avoid using it and stick to `initialTopMostItemIndex` instead.
   */
  initialScrollTop?: number

  /**
   * Use for server-side rendering - if set, the list will render the specified amount of items
   * regardless of the container / item size.
   */
  initialItemCount?: number

  /**
   * Use the `components` property for advanced customization of the elements rendered by the list.
   */
  components?: Components

  /**
   * Set the callback to specify the contents of the item.
   */
  itemContent?: ItemContent<D>

  /**
   * If specified, the component will use the function to generate the `key` property for each list item.
   */
  computeItemKey?: ComputeItemKey

  /**
   * By default, the component assumes the default item height from the first rendered item (rendering it as a "probe").
   *
   * If the first item turns out to be an outlier (very short or tall), the rest of the rendering will be slower,
   * as multiple passes of rendering should happen for the list to fill the viewport.
   *
   * Setting `defaultItemHeight` causes the component to skip the "probe" rendering and use the property
   * value as default height instead.
   */
  defaultItemHeight?: number

  /**
   * Can be used to improve performance if the rendered items are of known size.
   * Setting it causes the component to skip item measurements.
   */
  fixedItemHeight?: number

  /**
   * Use to display placeholders if the user scrolls fast through the list.
   *
   * Set `components.ScrollSeekPlaceholder` to change the placeholder content.
   */
  scrollSeekConfiguration?: ScrollSeekConfiguration | false

  /**
   * If set to true, the list automatically scrolls to bottom if the total count is changed.
   * Pass "smooth" to have animated scrolling to.
   */
  followOutput?: FollowOutput

  /**
   * Set to customize the wrapper tag for the header and footer components (default is `div`).
   */
  headerFooterTag?: string

  /**
   * Use when implementing inverse infinite scrolling - decrease the value this property
   * in combination with  `data` or `totalCount` to prepend items to the top of the list.
   *
   * Warning: the firstItemIndex should **be a positive number**, based on the total amount of items to be displayed.
   */
  firstItemIndex?: number

  /**
   * Called when the list starts/stops scrolling.
   */
  isScrolling?: (isScrolling: boolean) => void

  /**
   * Gets called when the user scrolls to the end of the list.
   * Receives the last item index as an argument. Can be used to implement endless scrolling.
   */
  endReached?: (index: number) => void

  /**
   * Called when the user scrolls to the start of the list.
   */
  startReached?: (index: number) => void

  /**
   * Called with the new set of items each time the list items are rendered due to scrolling.
   */
  rangeChanged?: (range: ListRange) => void

  /**
   * Called with true / false when the list has reached the bottom / gets scrolled up.
   * Can be used to load newer items, like `tail -f`.
   */
  atBottomStateChange?: (atBottom: boolean) => void

  /**
   * Called with `true` / `false` when the list has reached the top / gets scrolled down.
   */
  atTopStateChange?: (atTop: boolean) => void

  /**
   * Called when the total list height is changed due to new items or viewport resize.
   */
  totalListHeightChanged?: (height: number) => void

  /**
   * Called with the new set of items each time the list items are rendered due to scrolling.
   */
  itemsRendered?: (items: ListItem<D>[]) => void

  /**
   * Setting `alignToBottom` to `true` aligns the items to the bottom of the list if the list is shorter than the viewport.
   * Use `followOutput` property to keep the list aligned when new items are appended.
   */
  alignToBottom?: boolean

  /**
   * Experimental - uses the document scroller rather than wrapping the list in its own.
   */
  useWindowScroll?: boolean

  /**
   * Provides access to the root DOM element
   */
  scrollerRef?: (ref: HTMLElement | null) => any
}

export interface GroupedVirtuosoProps<D>
  extends Omit<VirtuosoProps<D>, 'totalCount' | 'itemContent'>,
    Pick<ListProps, 'groupCounts' | 'groupContent'> {
  /**
   * Specifies the amount of items in each group (and, actually, how many groups are there).
   * For example, passing [20, 30] will display 2 groups with 20 and 30 items each.
   */
  groupCounts?: number[]

  /**
   * Specifies how each each group header gets rendered. The callback receives the zero-based index of the group.
   */
  groupContent?: GroupContent

  /**
   * Specifies how each each item gets rendered.
   */
  itemContent?: GroupItemContent<D>
}

export interface VirtuosoGridProps extends GridProps {
  /**
   * The total amount of items to be rendered.
   */
  totalCount: GridProps['totalCount']

  /**
   * Set the callback to specify the contents of the item.
   */
  itemContent?: GridProps['itemContent']

  /**
   * Use the `components` property for advanced customization of the elements rendered by the list.
   */
  components?: GridProps['components']

  /**
   * Set the overscan property to make the component "chunk" the rendering of new items on scroll.
   * The property causes the component to render more items than the necessary, but reduces the re-renders on scroll.
   * Setting { main: number, reverse: number } lets you extend the list in both the main and the reverse scrollable directions.
   */
  overscan?: number | { main: number; reverse: number }

  /**
   * If specified, the component will use the function to generate the `key` property for each list item.
   */
  computeItemKey?: ComputeItemKey

  /**
   * Use to display placeholders if the user scrolls fast through the list.
   *
   * Set `components.ScrollSeekPlaceholder` to change the placeholder content.
   */
  scrollSeekConfiguration?: ScrollSeekConfiguration | false

  /**
   * Called when the list starts/stops scrolling.
   */
  isScrolling?: (isScrolling: boolean) => void

  /**
   * Gets called when the user scrolls to the end of the list.
   * Receives the last item index as an argument. Can be used to implement endless scrolling.
   */
  endReached?: (index: number) => void

  /**
   * Called when the user scrolls to the start of the list.
   */
  startReached?: (index: number) => void

  /**
   * Called with the new set of items each time the list items are rendered due to scrolling.
   */
  rangeChanged?: (range: ListRange) => void

  /**
   * Called with true / false when the list has reached the bottom / gets scrolled up.
   * Can be used to load newer items, like `tail -f`.
   */
  atBottomStateChange?: (atBottom: boolean) => void

  /**
   * Called with `true` / `false` when the list has reached the top / gets scrolled down.
   */
  atTopStateChange?: (atTop: boolean) => void

  /**
   * Provides access to the root DOM element
   */
  scrollerRef?: (ref: HTMLElement | null) => any
}

export interface VirtuosoHandle extends ListHandle {
  /**
   * Scrolls the component to the specified item index. See {{IndexLocationWithAlign}} for more options.
   */
  scrollToIndex(location: number | IndexLocationWithAlign): void
  /**
   * Scrolls the component to the specified location. See [ScrollToOptions (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions)
   */
  scrollTo(location: ScrollToOptions): void
  /**
   * Scrolls the component with the specified amount. See [ScrollToOptions (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions)
   */
  scrollBy(location: ScrollToOptions): void
}

export interface GroupedVirtuosoHandle extends ListHandle {
  scrollToIndex(location: number | IndexLocationWithAlign): void
  scrollTo(location: ScrollToOptions): void
  scrollBy(location: ScrollToOptions): void
}

export interface VirtuosoGridHandle extends GridHandle {
  scrollToIndex(location: number | IndexLocationWithAlign): void
  scrollTo(location: ScrollToOptions): void
  scrollBy(location: ScrollToOptions): void
}

export const Virtuoso = List as <D extends unknown = any>(props: VirtuosoProps<D> & { ref?: Ref<VirtuosoHandle> }) => ReactElement
export const GroupedVirtuoso = List as <D extends unknown = any>(
  props: GroupedVirtuosoProps<D> & { ref?: Ref<GroupedVirtuosoHandle> }
) => ReactElement
export const VirtuosoGrid: ForwardRefExoticComponent<VirtuosoGridProps> = Grid
