import { ForwardRefExoticComponent } from 'react'
import { ListHandle, List, ItemContent, GroupItemContent } from './List'
import { GridHandle, Grid } from './Grid'
type CompProps<T> = T extends React.ForwardRefExoticComponent<infer R> ? R : never
type ListProps = CompProps<typeof List>
type GridProps = CompProps<typeof Grid>

export interface VirtuosoProps extends Omit<ListProps, 'groupCounts' | 'groupContent'> {
  /**
   * the total amount of items to be rendered.
   */
  totalCount?: ListProps['totalCount']

  /**
   * the data items to be rendered.
   *
   * If data is set, the total count will be inferred from the length of the array.
   */
  data?: ListProps['data']

  /**
   * Set the overscan property to make the component "chunk" the rendering of new items on scroll.
   * The property causes the component to render more items than the necessary, but reduces the re-renders on scroll.
   * Setting { main: number, reverse: number } lets you extend the list in both the main and the reverse scrollable directions.
   */
  overscan?: ListProps['overscan']

  /**
   * Set the amount of items to remain fixed at the top of the list.
   *
   * For a header that scrolls away when scrolling, check the `components.Header` property.
   */
  topItemCount?: ListProps['topItemCount']

  /**
   * Set to a value between 0 and totalCount - 1 to make the list start scrolled to that item.
   */
  initialTopMostItemIndex?: ListProps['initialTopMostItemIndex']

  /**
   * Use for server-side rendering - if set, the list will render the specified amount of items
   * regardless of the container / item size.
   */
  initialItemCount?: ListProps['initialItemCount']

  /**
   * Use the `components` property for advanced customization of the elements rendered by the list.
   */
  components?: ListProps['components']

  /**
   * Set the callback to specify the contents of the item.
   */
  itemContent?: ItemContent

  /**
   * If specified, the component will use the function to generate the `key` property for each list item.
   */
  computeItemKey?: ListProps['computeItemKey']

  /**
   * By default, the component assumes the default item height from the first rendered item (rendering it as a "probe").
   *
   * If the first item turns out to be an outlier (very short or tall), the rest of the rendering will be slower,
   * as multiple passes of rendering should happen for the list to fill the viewport.
   *
   * Setting `defaultItemHeight` causes the component to skip the "probe" rendering and use the property
   * value as default height instead.
   */
  defaultItemHeight?: ListProps['defaultItemHeight']

  /**
   * Can be used to improve performance if the rendered items are of known size.
   * Setting it causes the component to skip item measurements.
   */
  fixedItemHeight?: ListProps['fixedItemHeight']

  /**
   * Use to display placeholders if the user scrolls fast through the list.
   *
   * Set `components.ScrollSeekPlaceholder` to change the placeholder content.
   */
  scrollSeekConfiguration?: ListProps['scrollSeekConfiguration']

  /**
   * If set to true, the list automatically scrolls to bottom if the total count is changed.
   */
  followOutput?: ListProps['followOutput']

  /**
   * Set to customize the wrapper tag for the header and footer components (default is `div`).
   */
  headerFooterTag?: ListProps['headerFooterTag']

  /**
   * Use when implementing inverse infinite scrolling - decrease the value this property
   * in combination with  `data` or `totalCount` to prepend items to the top of the list.
   */
  firstItemIndex?: ListProps['firstItemIndex']

  /**
   * Called when the list starts/stops scrolling.
   */
  isScrolling?: ListProps['isScrolling']

  /**
   * Gets called when the user scrolls to the end of the list.
   * Receives the last item index as an argument. Can be used to implement endless scrolling.
   */
  endReached?: ListProps['endReached']

  /**
   * Called when the user scrolls to the start of the list.
   */
  startReached?: ListProps['startReached']

  /**
   * Called with the new set of items each time the list items are rendered due to scrolling.
   */
  rangeChanged?: ListProps['rangeChanged']

  /**
   * Called with true / false when the list has reached the bottom / gets scrolled up.
   * Can be used to load newer items, like `tail -f`.
   */
  atBottomStateChange?: ListProps['atBottomStateChange']

  /**
   * Called with `true` / `false` when the list has reached the top / gets scrolled down.
   */
  atTopStateChange?: ListProps['atTopStateChange']

  /**
   * Called when the total list height is changed due to new items or viewport resize.
   */
  totalListHeightChanged?: ListProps['totalListHeightChanged']

  /**
   * Called with the new set of items each time the list items are rendered due to scrolling.
   */
  itemsRendered?: ListProps['itemsRendered']
}

export interface GroupedVirtuosoProps
  extends Omit<VirtuosoProps, 'totalCount' | 'itemContent'>,
    Pick<ListProps, 'groupCounts' | 'groupContent'> {
  /**
   * Specifies the amount of items in each group (and, actually, how many groups are there).
   * For example, passing [20, 30] will display 2 groups with 20 and 30 items each.
   */
  groupCounts: ListProps['groupCounts']

  /**
   * Specifies how each each group header gets rendered. The callback receives the zero-based index of the group.
   */
  groupContent?: ListProps['groupContent']

  /**
   * Specifies how each each item gets rendered.
   */
  itemContent?: GroupItemContent
}

export interface VirtuosoGridProps
  extends Pick<
      VirtuosoProps,
      | 'overscan'
      | 'computeItemKey'
      | 'initialItemCount'
      | 'scrollSeekConfiguration'
      | 'isScrolling'
      | 'endReached'
      | 'startReached'
      | 'rangeChanged'
      | 'atBottomStateChange'
      | 'atTopStateChange'
    >,
    GridProps {
  /**
   * the total amount of items to be rendered.
   */
  totalCount: GridProps['totalCount']

  /**
   * Set the callback to specify the contents of the item.
   */
  itemContent?: GridProps['itemContent']

  /**
   * Use the `components` property for advanced customization of the elements rendered by the list.
   */
  components: GridProps['components']
}

export type VirtuosoHandle = ListHandle
export type GroupedVirtuosoHandle = ListHandle
export type VirtuosoGridHandle = GridHandle

export const Virtuoso: ForwardRefExoticComponent<VirtuosoProps> = List
export const GroupedVirtuoso: ForwardRefExoticComponent<GroupedVirtuosoProps> = List
export const VirtuosoGrid: ForwardRefExoticComponent<VirtuosoGridProps> = Grid
