import { ReactElement, Ref } from 'react'
import { Grid, GridHandle } from '../Grid'
import {
  GridComponents,
  GridComputeItemKey,
  GridItemContent,
  IndexLocationWithAlign,
  ListRange,
  ScrollSeekConfiguration,
} from '../interfaces'
import { CompProps } from './CompProps'

type GridProps = CompProps<typeof Grid>

export interface VirtuosoGridProps<C extends unknown = unknown> extends GridProps {
  /**
   * The total amount of items to be rendered.
   */
  totalCount: number

  /**
   * Set the callback to specify the contents of the item.
   */
  itemContent?: GridItemContent<C>

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
  computeItemKey?: GridComputeItemKey

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

  /**
   * Sets the className for the list DOM element
   */
  listClassName?: string

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
}

export interface VirtuosoGridHandle extends GridHandle {
  scrollToIndex(location: number | IndexLocationWithAlign): void

  scrollTo(location: ScrollToOptions): void

  scrollBy(location: ScrollToOptions): void
}

export const VirtuosoGrid = Grid as <Context extends unknown = any>(
  props: VirtuosoGridProps<Context> & { ref?: Ref<VirtuosoGridHandle> }
) => ReactElement
