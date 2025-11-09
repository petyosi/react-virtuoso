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

/**
 * @group VirtuosoGrid
 */
export interface ElementDimensions {
  height: number
  width: number
}

/**
 * @group VirtuosoGrid
 */
export interface Gap {
  column: number
  row: number
}

/**
 * @group VirtuosoGrid
 */
export interface GridStateSnapshot {
  gap: Gap
  item: ElementDimensions
  scrollTop: number
  viewport: ElementDimensions
}

/**
 * Exposes the VirtuosoGrid component methods.
 * @group VirtuosoGrid
 */
export interface VirtuosoGridHandle {
  scrollBy(location: ScrollToOptions): void
  scrollTo(location: ScrollToOptions): void
  scrollToIndex(location: GridIndexLocation): void
}

/**
 * The props for the VirtuosoGrid component.
 * @group VirtuosoGrid
 */
export interface VirtuosoGridProps<D, C = unknown> extends GridRootProps {
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
   * Use the `components` property for advanced customization of the elements rendered by the list.
   */
  components?: GridComponents<C>

  /**
   * If specified, the component will use the function to generate the `key` property for each list item.
   */
  computeItemKey?: GridComputeItemKey<D, C>

  /**
   * Additional context available in the custom components and content callbacks
   */
  context?: C

  /**
   * Pass a reference to a scrollable parent element, so that the grid won't wrap in its own.
   */
  customScrollParent?: HTMLElement

  /**
   * The data items to be rendered. If data is set, the total count will be inferred from the length of the array.
   */
  data?: readonly D[]

  /**
   * Gets called when the user scrolls to the end of the list.
   * Receives the last item index as an argument. Can be used to implement endless scrolling.
   */
  endReached?: (index: number) => void

  /**
   *
   * *The property accepts pixel values.*
   *
   * Set the increaseViewportBy property to artificially increase the viewport size, causing items to be rendered before outside of the viewport.
   * The property causes the component to render more items than the necessary, but can help with slow loading content.
   * Using `{ top?: number, bottom?: number }` lets you set the increase for each end separately.
   *
   */
  increaseViewportBy?: number | { bottom: number; top: number }

  /**
   * Use for server-side rendering - if set, the list will render the specified amount of items
   * regardless of the container / item size.
   */
  initialItemCount?: number

  /*
   * Set to a value between 0 and totalCount - 1 to make the grid start scrolled to that item.
   * Pass in an object to achieve additional effects similar to `scrollToIndex`.
   */
  initialTopMostItemIndex?: GridIndexLocation

  /**
   * Called when the list starts/stops scrolling.
   */
  isScrolling?: (isScrolling: boolean) => void

  /**
   * Sets the grid items' className
   */
  itemClassName?: string

  /**
   * Set the callback to specify the contents of the item.
   */
  itemContent?: GridItemContent<D, C>

  /**
   * Sets the className for the list DOM element
   */
  listClassName?: string

  /**
   * set to LogLevel.DEBUG to enable various diagnostics in the console, the most useful being the item measurement reports.
   *
   * Ensure that you have "all levels" enabled in the browser console too see the messages.
   */
  logLevel?: LogLevel
  /**
   * Set the overscan property to make the component "chunk" the rendering of new items on scroll.
   * The property causes the component to render more items than the necessary, but reduces the re-renders on scroll.
   * Setting `{ main: number, reverse: number }` lets you extend the grid in both the main and the reverse scrollable directions.
   * See the `increaseViewportBy` property for a similar behavior (equivalent to the `overscan` in react-window).
   */
  overscan?: number | { main: number; reverse: number }

  /**
   * Called with the new set of items each time the list items are rendered due to scrolling.
   */
  rangeChanged?: (range: ListRange) => void

  /**
   * invoked with true after the grid has done the initial render and the items have been measured.
   */
  readyStateChanged?: (ready: boolean) => void

  restoreStateFrom?: GridStateSnapshot | null | undefined

  /**
   * Provides access to the root DOM element
   */
  scrollerRef?: (ref: HTMLElement | null) => any

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
   * reports when the grid state changes. The reported value can be stored and passed back to `restoreStateFrom` to restore the grid to the same state.
   */
  stateChanged?: (state: GridStateSnapshot) => void

  /**
   * The total amount of items to be rendered.
   */
  totalCount?: number

  /**
   * Uses the document scroller rather than wrapping the grid in its own.
   */
  useWindowScroll?: boolean
}
