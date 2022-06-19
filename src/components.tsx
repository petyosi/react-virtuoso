import { ReactElement, Ref } from 'react'

import {
  Components,
  ComputeItemKey,
  FollowOutput,
  GridComponents,
  GridComputeItemKey,
  GridItemContent,
  GroupContent,
  GroupItemContent,
  IndexLocationWithAlign,
  ItemContent,
  ListItem,
  ListRange,
  ScrollSeekConfiguration,
  TableComponents,
  FixedHeaderContent,
  ScrollIntoViewLocation,
  ListRootProps,
  GridRootProps,
  FlatIndexLocationWithAlign,
  FlatScrollIntoViewLocation,
} from './interfaces'
import { List } from './List'
import { Grid } from './Grid'
import { Table } from './Table'

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
  components?: Components<C>

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
  itemSize?: (el: HTMLElement, field: 'offsetHeight' | 'offsetWidth') => number

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
   * By default `0`. Redefine to change how much away from the top the scroller can be before the list is not considered not at top.
   */
  atTopThreshold?: number

  /**
   * By default `4`. Redefine to change how much away from the bottom the scroller can be before the list is not considered not at bottom.
   */
  atBottomThreshold?: number

  /**
   * No longer necessary after 2.10.2. component should work out of the box.
   */
  react18ConcurrentRendering?: boolean
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
  groupContent?: GroupContent

  /**
   * Specifies how each each item gets rendered.
   */
  itemContent?: GroupItemContent<D, C>
}

export interface TableVirtuosoProps<D, C> extends Omit<VirtuosoProps<D, C>, 'components' | 'headerFooterTag' | 'topItemCount'> {
  /**
   * Use the `components` property for advanced customization of the elements rendered by the table.
   */
  components?: TableComponents<C>
  /**
   * Set the contents of the table header.
   */
  fixedHeaderContent?: FixedHeaderContent

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
  itemSize?: (el: HTMLElement, field: 'offsetHeight' | 'offsetWidth') => number

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

  /**
   * No longer necessary after 2.10.2. component should work out of the box.
   */
  react18ConcurrentRendering?: boolean
}

export interface VirtuosoGridProps<C = unknown> extends GridRootProps {
  /**
   * The total amount of items to be rendered.
   */
  totalCount: number

  /**
   * Use for server-side rendering - if set, the list will render the specified amount of items
   * regardless of the container / item size.
   */
  initialItemCount?: number

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
}

export interface GroupedVirtuosoHandle {
  scrollToIndex(location: number | IndexLocationWithAlign): void
  scrollIntoView(location: number | ScrollIntoViewLocation): void
  scrollTo(location: ScrollToOptions): void
  scrollBy(location: ScrollToOptions): void
}

export interface VirtuosoGridHandle {
  scrollToIndex(location: number | IndexLocationWithAlign): void
  scrollTo(location: ScrollToOptions): void
  scrollBy(location: ScrollToOptions): void
}

export interface TableVirtuosoHandle {
  scrollIntoView(location: number | FlatScrollIntoViewLocation): void
  scrollToIndex(location: number | FlatIndexLocationWithAlign): void
  scrollTo(location: ScrollToOptions): void
  scrollBy(location: ScrollToOptions): void
}

export const Virtuoso = List as <ItemData = any, Context = any>(
  props: VirtuosoProps<ItemData, Context> & { ref?: Ref<VirtuosoHandle> }
) => ReactElement

export const GroupedVirtuoso = List as <ItemData = any, Context = any>(
  props: GroupedVirtuosoProps<ItemData, Context> & { ref?: Ref<GroupedVirtuosoHandle> }
) => ReactElement

export const TableVirtuoso = Table as <ItemData = any, Context = any>(
  props: TableVirtuosoProps<ItemData, Context> & { ref?: Ref<TableVirtuosoHandle> }
) => ReactElement

export const VirtuosoGrid = Grid as <Context = any>(props: VirtuosoGridProps<Context> & { ref?: Ref<VirtuosoGridHandle> }) => ReactElement
