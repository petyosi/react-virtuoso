import type {
  ComputeItemKey,
  FixedFooterContent,
  FixedHeaderContent,
  FlatIndexLocationWithAlign,
  FlatScrollIntoViewLocation,
  FollowOutput,
  GroupContent,
  GroupItemContent,
  IndexLocationWithAlign,
  ItemContent,
  ListItem,
  ListRange,
  ScrollIntoViewLocationOptions,
  ScrollSeekConfiguration,
  SizeFunction,
  StateCallback,
  StateSnapshot,
  TableComponents,
} from '../interfaces'
import type { VirtuosoProps } from './Virtuoso'

/**
 * @internal
 */
interface BaseTableVirtuosoHandle {
  /**
   * Obtains the internal size state of the component, so that it can be restored later. This does not include the data items.
   */
  getState(stateCb: StateCallback): void
  scrollBy(location: ScrollToOptions): void
  scrollTo(location: ScrollToOptions): void
}

/**
 * Exposes the TableVirtuoso component methods for imperative control.
 * Access via ref on the TableVirtuoso component.
 *
 * @see {@link TableVirtuoso} for the component
 * @see {@link TableVirtuosoProps} for available props
 * @group TableVirtuoso
 */
export interface TableVirtuosoHandle extends BaseTableVirtuosoHandle {
  scrollIntoView(location: FlatScrollIntoViewLocation | number): void
  scrollToIndex(location: FlatIndexLocationWithAlign | number): void
}

/**
 * Exposes the GroupedTableVirtuoso component methods for imperative control.
 * Access via ref on the GroupedTableVirtuoso component.
 *
 * @see {@link GroupedTableVirtuoso} for the component
 * @see {@link GroupedTableVirtuosoProps} for available props
 * @group GroupedTableVirtuoso
 */
export interface GroupedTableVirtuosoHandle extends BaseTableVirtuosoHandle {
  scrollIntoView(location: ScrollIntoViewLocationOptions): void
  scrollToIndex(location: IndexLocationWithAlign | number): void
}

/**
 * The props for the TableVirtuoso component.
 *
 * @typeParam D - The type of data items in the table
 * @typeParam C - The type of additional context passed to callbacks
 *
 * @see {@link TableVirtuoso} for the component
 * @see {@link TableVirtuosoHandle} for imperative methods
 * @see {@link TableComponents} for customizing table elements
 * @group TableVirtuoso
 */
export interface TableVirtuosoProps<D, C> extends Omit<VirtuosoProps<D, C>, 'components' | 'headerFooterTag'> {
  /**
   * Setting `alignToBottom` to `true` aligns the items to the bottom of the list if the list is shorter than the viewport.
   * Use `followOutput` property to keep the list aligned when new items are appended.
   */
  alignToBottom?: boolean

  /**
   * Called with true / false when the list has reached the bottom / gets scrolled up.
   * Can be used to load newer items, like `tail -f`.
   */
  atBottomStateChange?: (atBottom: boolean) => void

  /**
   * By default `4`. Redefine to change how much away from the bottom the scroller can be before the list is not considered not at bottom.
   */
  atBottomThreshold?: number

  /**
   * Called with `true` / `false` when the list has reached the top / gets scrolled down.
   */
  atTopStateChange?: (atTop: boolean) => void

  /**
   * By default `0`. Redefine to change how much away from the top the scroller can be before the list is not considered not at top.
   */
  atTopThreshold?: number

  /**
   * Use the `components` property for advanced customization of the elements rendered by the table.
   */
  components?: TableComponents<D, C>

  /**
   * If specified, the component will use the function to generate the `key` property for each list item.
   */
  computeItemKey?: ComputeItemKey<D, C>

  /**
   * Pass a reference to a scrollable parent element, so that the table won't wrap in its own.
   */
  customScrollParent?: HTMLElement

  /**
   * The data items to be rendered. If data is set, the total count will be inferred from the length of the array.
   */
  data?: readonly D[]

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
   * Gets called when the user scrolls to the end of the list.
   * Receives the last item index as an argument. Can be used to implement endless scrolling.
   */
  endReached?: (index: number) => void

  /**
   * Use when implementing inverse infinite scrolling - decrease the value this property
   * in combination with  `data` or `totalCount` to prepend items to the top of the list.
   *
   * Warning: the firstItemIndex should **be a positive number**, based on the total amount of items to be displayed.
   */
  firstItemIndex?: number

  /**
   * Set the contents of the table footer.
   */
  fixedFooterContent?: FixedFooterContent

  /**
   * Set the contents of the table header.
   */
  fixedHeaderContent?: FixedHeaderContent

  /**
   * Can be used to improve performance if the rendered items are of known size.
   * Setting it causes the component to skip item measurements.
   */
  fixedItemHeight?: number

  /**
   * If set to `true`, the list automatically scrolls to bottom if the total count is changed.
   * Set to `"smooth"` for an animated scrolling.
   *
   * By default, `followOutput` scrolls down only if the list is already at the bottom.
   * To implement an arbitrary logic behind that, pass a function:
   *
   * ```tsx
   * <Virtuoso
   *  followOutput={(isAtBottom: boolean) => {
   *    if (expression) {
   *      return 'smooth' // can be 'auto' or false to avoid scrolling
   *    } else {
   *      return false
   *    }
   *  }} />
   * ```
   */
  followOutput?: FollowOutput

  /**
   * Set the increaseViewportBy property to artificially increase the viewport size, causing items to be rendered before outside of the viewport.
   * The property causes the component to render more items than the necessary, but can help with slow loading content.
   * Using `{ top?: number, bottom?: number }` lets you set the increase for each end separately.
   */
  increaseViewportBy?: number | { bottom: number; top: number }

  /**
   * Set the minimum number of items to render before and after the visible viewport boundaries.
   * This is useful when rendering items with dynamic or very tall content, where the pixel-based
   * `increaseViewportBy` may not be sufficient to prevent empty areas during rapid resizing or scrolling.
   * Using `{ top?: number, bottom?: number }` lets you set the count for each end separately.
   */
  minOverscanItemCount?: number | { bottom: number; top: number }

  /**
   * Use for server-side rendering - if set, the list will render the specified amount of items
   * regardless of the container / item size.
   */
  initialItemCount?: number

  /**
   * Set this value to offset the initial location of the list.
   * Warning: using this property will still run a render cycle at the scrollTop: 0 list window.
   * If possible, avoid using it and stick to `initialTopMostItemIndex` instead.
   */
  initialScrollTop?: number

  /**
   * Set to a value between 0 and totalCount - 1 to make the list start scrolled to that item.
   * Pass in an object to achieve additional effects similar to `scrollToIndex`.
   */
  initialTopMostItemIndex?: IndexLocationWithAlign | number

  /**
   * Called when the list starts/stops scrolling.
   */
  isScrolling?: (isScrolling: boolean) => void

  /**
   * Set the callback to specify the contents of the item.
   */
  itemContent?: ItemContent<D, C>

  /**
   * Allows customizing the height/width calculation of `Item` elements.
   *
   * The default implementation reads `el.getBoundingClientRect().height` and `el.getBoundingClientRect().width`.
   */
  itemSize?: SizeFunction

  /**
   * Called with the new set of items each time the list items are rendered due to scrolling.
   */
  itemsRendered?: (items: ListItem<D>[]) => void

  /**
   * Set the overscan property to make the component "chunk" the rendering of new items on scroll.
   * The property causes the component to render more items than the necessary, but reduces the re-renders on scroll.
   * Setting `{ main: number, reverse: number }` lets you extend the list in both the main and the reverse scrollable directions.
   * See the `increaseViewportBy` property for a similar behavior (equivalent to the `overscan` in `react-window`).
   */
  overscan?: number | { main: number; reverse: number }

  /**
   * Called with the new set of items each time the list items are rendered due to scrolling.
   */
  rangeChanged?: (range: ListRange) => void

  /**
   * pass a state obtained from the getState() method to restore the list state - this includes the previously measured item sizes and the scroll location.
   * Notice that you should still pass the same data and totalCount properties as before, so that the list can match the data with the stored measurements.
   * This is useful when you want to keep the list state when the component is unmounted and remounted, for example when navigating to a different page.
   */
  restoreStateFrom?: StateSnapshot

  /**
   * Provides access to the root DOM element
   */
  scrollerRef?: (ref: HTMLElement | null | Window) => any

  /**
   * Use to display placeholders if the user scrolls fast through the list.
   *
   * Set `components.ScrollSeekPlaceholder` to change the placeholder content.
   */
  scrollSeekConfiguration?: false | ScrollSeekConfiguration

  /**
   * Called when the user scrolls to the start of the list.
   */
  startReached?: (index: number) => void

  /**
   * Set the amount of items to remain fixed at the top of the table.
   */
  topItemCount?: number

  /**
   * The total amount of items to be rendered.
   */
  totalCount?: number

  /**
   * Called when the total list height is changed due to new items or viewport resize.
   */
  totalListHeightChanged?: (height: number) => void
  /**
   * Uses the document scroller rather than wrapping the list in its own.
   */
  useWindowScroll?: boolean
}

/**
 * The props for the GroupedTableVirtuoso component.
 *
 * @typeParam D - The type of data items in the table
 * @typeParam C - The type of additional context passed to callbacks
 *
 * @see {@link GroupedTableVirtuoso} for the component
 * @see {@link GroupedTableVirtuosoHandle} for imperative methods
 * @group GroupedTableVirtuoso
 */
export interface GroupedTableVirtuosoProps<D, C> extends Omit<TableVirtuosoProps<D, C>, 'itemContent' | 'totalCount'> {
  /**
   * Use when implementing inverse infinite scrolling, decrease the value this property
   * in combination with a change in `groupCounts` to prepend groups items to the top of the list.
   * Both new groups and extending the top group is supported.
   *
   * The delta of the firstItemIndex should equal the amount of new items introduced, without the group themselves.
   * As an example, if you prepend 2 groups with 20 and 30 items each, the firstItemIndex should be decreased with 50.
   *
   * You can also prepend more items to the first group, for example:
   * `{ groupCounts: [20, 30], firstItemIndex: 1000 }` can become `{ groupCounts: [10, 30, 30], firstItemIndex: 980 }`
   *
   * Warning: the firstItemIndex should **be a positive number**, based on the total amount of items to be displayed.
   */
  firstItemIndex?: number

  /**
   * Specifies how each each group header gets rendered. The callback receives the zero-based index of the group.
   */
  groupContent?: GroupContent<C>

  /**
   * Specifies the amount of items in each group (and, actually, how many groups are there).
   * For example, passing [20, 30] will display 2 groups with 20 and 30 items each.
   */
  groupCounts?: number[]

  /**
   * Specifies how each each item gets rendered.
   */
  itemContent?: GroupItemContent<D, C>
}
