import type {
  ComputeItemKey,
  FixedHeaderContent,
  FixedFooterContent,
  FlatIndexLocationWithAlign,
  FlatScrollIntoViewLocation,
  FollowOutput,
  ItemContent,
  ListItem,
  ListRange,
  ScrollSeekConfiguration,
  SizeFunction,
  TableComponents,
} from '../interfaces'
import type { VirtuosoProps } from './Virtuoso'

export interface TableVirtuosoProps<D, C> extends Omit<VirtuosoProps<D, C>, 'components' | 'headerFooterTag' | 'topItemCount'> {
  /**
   * Use the `components` property for advanced customization of the elements rendered by the table.
   */
  components?: TableComponents<D, C>

  /**
   * Set the contents of the table header.
   */
  fixedHeaderContent?: FixedHeaderContent

  /**
   * Set the contents of the table footer.
   */
  fixedFooterContent?: FixedFooterContent

  /**
   * The total amount of items to be rendered.
   */
  totalCount?: number

  /**
   * The data items to be rendered. If data is set, the total count will be inferred from the length of the array.
   */
  data?: readonly D[]

  /**
   * Set the overscan property to make the component "chunk" the rendering of new items on scroll.
   * The property causes the component to render more items than the necessary, but reduces the re-renders on scroll.
   * Setting `{ main: number, reverse: number }` lets you extend the list in both the main and the reverse scrollable directions.
   * See the `increaseViewportBy` property for a similar behavior (equivalent to the `overscan` in `react-window`).
   */
  overscan?: number | { main: number; reverse: number }

  /**
   * Set the increaseViewportBy property to artificially increase the viewport size, causing items to be rendered before outside of the viewport.
   * The property causes the component to render more items than the necessary, but can help with slow loading content.
   * Using `{ top?: number, bottom?: number }` lets you set the increase for each end separately.
   */
  increaseViewportBy?: number | { top: number; bottom: number }

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
   * Pass a reference to a scrollable parent element, so that the table won't wrap in its own.
   */
  customScrollParent?: HTMLElement

  /**
   * Provides access to the root DOM element
   */
  scrollerRef?: (ref: HTMLElement | Window | null) => any

  /**
   * By default `0`. Redefine to change how much away from the top the scroller can be before the list is not considered not at top.
   */
  atTopThreshold?: number

  /**
   * By default `4`. Redefine to change how much away from the bottom the scroller can be before the list is not considered not at bottom.
   */
  atBottomThreshold?: number
}

export interface TableVirtuosoHandle {
  scrollIntoView(location: number | FlatScrollIntoViewLocation): void
  scrollToIndex(location: number | FlatIndexLocationWithAlign): void
  scrollTo(location: ScrollToOptions): void
  scrollBy(location: ScrollToOptions): void
}
