import type {
  GridComponents,
  GridComputeItemKey,
  GridIndexLocation,
  GridItemContent,
  GridRootProps,
  ListRange,
  ScrollSeekConfiguration,
} from '../interfaces'
import { LogLevel } from '../loggerSystem'

export interface Gap {
  row: number
  column: number
}

export interface ElementDimensions {
  width: number
  height: number
}

export interface GridStateSnapshot {
  viewport: ElementDimensions
  item: ElementDimensions
  gap: Gap
  scrollTop: number
}

export interface VirtuosoGridProps<D, C = unknown> extends GridRootProps {
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
   * Use for server-side rendering - if set, the list will render the specified amount of items
   * regardless of the container / item size.
   */
  initialItemCount?: number

  /**
   * Set the callback to specify the contents of the item.
   */
  itemContent?: GridItemContent<D, C>

  /**
   * Use the `components` property for advanced customization of the elements rendered by the list.
   */
  components?: GridComponents<C>

  /**
   * Set the overscan property to make the component "chunk" the rendering of new items on scroll.
   * The property causes the component to render more items than the necessary, but reduces the re-renders on scroll.
   * Setting `{ main: number, reverse: number }` lets you extend the list in both the main and the reverse scrollable directions.
   */
  overscan?: number | { main: number; reverse: number }

  /**
   * If specified, the component will use the function to generate the `key` property for each list item.
   */
  computeItemKey?: GridComputeItemKey<D, C>

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
   * reports when the grid state changes. The reported value can be stored and passed back to `restoreStateFrom` to restore the grid to the same state.
   */
  stateChanged?: (state: GridStateSnapshot) => void

  restoreStateFrom?: GridStateSnapshot | undefined | null
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

  /**
   * Sets the className for the list DOM element
   */
  listClassName?: string

  /**
   * Whether to disable the re-rendering of the grid list on scroll, resize etc.
   * This is needed for elements like fullscreen video mode which affects element sizes even when you don't want it to.
   */
  shouldDisableIntersectionObserverCallback?: (el: HTMLElement) => boolean

  /**
   * Sets the grid items' className
   */
  itemClassName?: string

  /**
   * Uses the document scroller rather than wrapping the grid in its own.
   */
  useWindowScroll?: boolean

  /**
   * Pass a reference to a scrollable parent element, so that the grid won't wrap in its own.
   */
  customScrollParent?: HTMLElement

  /**
   * set to LogLevel.DEBUG to enable various diagnostics in the console, the most useful being the item measurement reports.
   *
   * Ensure that you have "all levels" enabled in the browser console too see the messages.
   */
  logLevel?: LogLevel

  /*
   * Set to a value between 0 and totalCount - 1 to make the grid start scrolled to that item.
   * Pass in an object to achieve additional effects similar to `scrollToIndex`.
   */
  initialTopMostItemIndex?: GridIndexLocation
}

export interface VirtuosoGridHandle {
  scrollToIndex(location: GridIndexLocation): void
  scrollTo(location: ScrollToOptions): void
  scrollBy(location: ScrollToOptions): void
}
