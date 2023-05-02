import type {
  GridComponents,
  GridComputeItemKey,
  GridItemContent,
  GridRootProps,
  IndexLocationWithAlign,
  ListRange,
  ScrollSeekConfiguration,
} from '../interfaces'
import { LogLevel } from '../loggerSystem'

export interface VirtuosoGridProps<D, C = unknown> extends GridRootProps {
  /**
   * The total amount of items to be rendered.
   */
  totalCount?: number | undefined

  /**
   * The data items to be rendered. If data is set, the total count will be inferred from the length of the array.
   */
  data?: readonly D[] | undefined

  /**
   * Additional context available in the custom components and content callbacks
   */
  context?: C | undefined

  /**
   * Use for server-side rendering - if set, the list will render the specified amount of items
   * regardless of the container / item size.
   */
  initialItemCount?: number | undefined

  /**
   * Set the callback to specify the contents of the item.
   */
  itemContent?: GridItemContent<D, C> | undefined

  /**
   * Use the `components` property for advanced customization of the elements rendered by the list.
   */
  components?: GridComponents<C> | undefined

  /**
   * Set the overscan property to make the component "chunk" the rendering of new items on scroll.
   * The property causes the component to render more items than the necessary, but reduces the re-renders on scroll.
   * Setting `{ main: number, reverse: number }` lets you extend the list in both the main and the reverse scrollable directions.
   */
  overscan?: number | { main: number; reverse: number } | undefined

  /**
   * If specified, the component will use the function to generate the `key` property for each list item.
   */
  computeItemKey?: GridComputeItemKey<D, C> | undefined

  /**
   * Use to display placeholders if the user scrolls fast through the list.
   *
   * Set `components.ScrollSeekPlaceholder` to change the placeholder content.
   */
  scrollSeekConfiguration?: ScrollSeekConfiguration | false | undefined

  /**
   * Called when the list starts/stops scrolling.
   */
  isScrolling?: (isScrolling: boolean) => void | undefined

  /**
   * Gets called when the user scrolls to the end of the list.
   * Receives the last item index as an argument. Can be used to implement endless scrolling.
   */
  endReached?: (index: number) => void | undefined

  /**
   * Called when the user scrolls to the start of the list.
   */
  startReached?: (index: number) => void | undefined

  /**
   * Called with the new set of items each time the list items are rendered due to scrolling.
   */
  rangeChanged?: (range: ListRange) => void | undefined

  /**
   * Called with true / false when the list has reached the bottom / gets scrolled up.
   * Can be used to load newer items, like `tail -f`.
   */
  atBottomStateChange?: (atBottom: boolean) => void | undefined

  /**
   * Called with `true` / `false` when the list has reached the top / gets scrolled down.
   */
  atTopStateChange?: (atTop: boolean) => void | undefined

  /**
   * Provides access to the root DOM element
   */
  scrollerRef?: (ref: HTMLElement | null) => any | undefined

  /**
   * Sets the className for the list DOM element
   */
  listClassName?: string | undefined

  /**
   * Sets the grid items' className
   */
  itemClassName?: string | undefined

  /**
   * Uses the document scroller rather than wrapping the grid in its own.
   */
  useWindowScroll?: boolean | undefined

  /**
   * Pass a reference to a scrollable parent element, so that the grid won't wrap in its own.
   */
  customScrollParent?: HTMLElement | undefined

  /**
   * set to LogLevel.DEBUG to enable various diagnostics in the console, the most useful being the item measurement reports.
   *
   * Ensure that you have "all levels" enabled in the browser console too see the messages.
   */
  logLevel?: LogLevel | undefined
}

export interface VirtuosoGridHandle {
  scrollToIndex(location: number | IndexLocationWithAlign): void
  scrollTo(location: ScrollToOptions): void
  scrollBy(location: ScrollToOptions): void
}
