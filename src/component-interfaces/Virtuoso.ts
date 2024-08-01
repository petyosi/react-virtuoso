import type {
  Components,
  ComputeItemKey,
  FlatIndexLocationWithAlign,
  FlatScrollIntoViewLocation,
  FollowOutput,
  GroupContent,
  GroupItemContent,
  IndexLocationWithAlign,
  ItemContent,
  ListItem,
  ListRange,
  ListRootProps,
  ScrollIntoViewLocation,
  ScrollSeekConfiguration,
  SizeFunction,
  StateSnapshot,
  StateCallback,
} from '../interfaces'
import { LogLevel } from '../loggerSystem'

export interface VirtuosoProps<D, C> extends ListRootProps {
  /**
   * The total amount of items to be rendered.
   */
  totalCount?: number

  /**
   * The data items to be rendered. If data is set, the total count will be inferred from the length of the array.
   */
  data?: readonly D[]

  /**
   * Additional context available in the custom components and content callbacks
   */
  context?: C

  /**
   * *The property accepts pixel values.*
   *
   * Set the overscan property to make the component "chunk" the rendering of new items on scroll.
   * The property causes the component to render more items than the necessary, but reduces the re-renders on scroll.
   * Setting `{ main: number, reverse: number }` lets you extend the list in both the main and the reverse scrollable directions.
   * See the `increaseViewportBy` property for a similar behavior (equivalent to the `overscan` in react-window).
   *
   */
  overscan?: number | { main: number; reverse: number }

  /**
   *
   * *The property accepts pixel values.*
   *
   * Set the increaseViewportBy property to artificially increase the viewport size, causing items to be rendered before outside of the viewport.
   * The property causes the component to render more items than the necessary, but can help with slow loading content.
   * Using `{ top?: number, bottom?: number }` lets you set the increase for each end separately.
   *
   */
  increaseViewportBy?: number | { top: number; bottom: number }

  /**
   * Set the amount of items to remain fixed at the top of the list.
   *
   * For a header that scrolls away when scrolling, check the `components.Header` property.
   */
  topItemCount?: number

  /**
   * Set to a value between 0 and totalCount - 1 to make the list start scrolled to that item.
   * Pass in an object to achieve additional effects similar to `scrollToIndex`.
   */
  initialTopMostItemIndex?: number | IndexLocationWithAlign

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
  components?: Components<D, C>

  /**
   * Set the callback to specify the contents of the item.
   */
  itemContent?: ItemContent<D, C>

  /**
   * If specified, the component will use the function to generate the `key` property for each list item.
   */
  computeItemKey?: ComputeItemKey<D, C>

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
   * Allows customizing the height/width calculation of `Item` elements.
   *
   * The default implementation reads `el.getBoundingClientRect().height` and `el.getBoundingClientRect().width`.
   */
  itemSize?: SizeFunction

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
   * Uses the document scroller rather than wrapping the list in its own.
   */
  useWindowScroll?: boolean

  /**
   * Pass a reference to a scrollable parent element, so that the list won't wrap in its own.
   */
  customScrollParent?: HTMLElement

  /**
   * Provides access to the root DOM element
   */
  scrollerRef?: (ref: HTMLElement | Window | null) => any

  /**
   * *The property accepts pixel values.*
   *
   * By default `0`. Redefine to change how much away from the top the scroller can be before the list is not considered not at top.
   */
  atTopThreshold?: number

  /**
   * *The property accepts pixel values.*
   *
   * By default `4`. Redefine to change how much away from the bottom the scroller can be before the list is not considered not at bottom.
   */
  atBottomThreshold?: number

  /**
   * set to LogLevel.DEBUG to enable various diagnostics in the console, the most useful being the item measurement reports.
   *
   * Ensure that you have "all levels" enabled in the browser console too see the messages.
   */
  logLevel?: LogLevel

  /**
   * pass a state obtained from the getState() method to restore the list state - this includes the previously measured item sizes and the scroll location.
   * Notice that you should still pass the same data and totalCount properties as before, so that the list can match the data with the stored measurements.
   * This is useful when you want to keep the list state when the component is unmounted and remounted, for example when navigating to a different page.
   */
  restoreStateFrom?: StateSnapshot

  /**
   * When set, turns the scroller into a horizontal list. The items are positioned with `inline-block`.
   */
  horizontalDirection?: boolean

  /**
   * When set, the resize observer used to measure the items will not use `requestAnimationFrame` to report the size changes.
   * Setting this to true will improve performance and reduce flickering, but will cause benign errors to be reported in the console if the size of the items changes while they are being measured.
   * See https://github.com/petyosi/react-virtuoso/issues/1049 for more information.
   */
  skipAnimationFrameInResizeObserver?: boolean
}

export interface GroupedVirtuosoProps<D, C> extends Omit<VirtuosoProps<D, C>, 'totalCount' | 'itemContent'> {
  /**
   * Specifies the amount of items in each group (and, actually, how many groups are there).
   * For example, passing [20, 30] will display 2 groups with 20 and 30 items each.
   */
  groupCounts?: number[]

  /**
   * Specifies how each each group header gets rendered. The callback receives the zero-based index of the group.
   */
  groupContent?: GroupContent<C>

  /**
   * Specifies how each each item gets rendered.
   */
  itemContent?: GroupItemContent<D, C>

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
}

export interface VirtuosoHandle {
  /**
   * Scrolls the component to the specified item index. See {@link IndexLocationWithAlign} for more options.
   */
  scrollToIndex(location: number | FlatIndexLocationWithAlign): void
  /**
   * Scrolls the item into view if necessary. See [the website example](http://virtuoso.dev/keyboard-navigation/) for an implementation.
   */
  scrollIntoView(location: FlatScrollIntoViewLocation): void
  /**
   * Scrolls the component to the specified location. See [ScrollToOptions (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions)
   */
  scrollTo(location: ScrollToOptions): void
  /**
   * Scrolls the component with the specified amount. See [ScrollToOptions (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions)
   */
  scrollBy(location: ScrollToOptions): void
  /**
   * Use this with combination with follow output if you have images loading in the list. Listen to the image loading and call the method.
   */
  autoscrollToBottom(): void

  /**
   * Obtains the internal size state of the component, so that it can be restored later. This does not include the data items.
   */
  getState(stateCb: StateCallback): void
}

export interface GroupedVirtuosoHandle {
  scrollToIndex(location: number | IndexLocationWithAlign): void
  scrollIntoView(location: number | ScrollIntoViewLocation): void
  scrollTo(location: ScrollToOptions): void
  scrollBy(location: ScrollToOptions): void
  autoscrollToBottom(): void

  /**
   * Obtains the internal size state of the component, so that it can be restored later. This does not include the data items.
   */
  getState(stateCb: StateCallback): void
}
