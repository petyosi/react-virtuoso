import { ReactElement, Ref } from 'react'
import { GroupContent, GroupItemContent, IndexLocationWithAlign } from '../interfaces'
import { List, ListHandle } from '../List'
import { ListProps, VirtuosoProps } from './Virtuoso'

export interface GroupedVirtuosoProps<D, C>
  extends Omit<VirtuosoProps<D, C>, 'totalCount' | 'itemContent'>,
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
  itemContent?: GroupItemContent<D, C>
}

export interface GroupedVirtuosoHandle extends ListHandle {
  scrollToIndex(location: number | IndexLocationWithAlign): void

  scrollTo(location: ScrollToOptions): void

  scrollBy(location: ScrollToOptions): void
}

export const GroupedVirtuoso = List as <ItemData extends unknown = any, Context extends unknown = any>(
  props: GroupedVirtuosoProps<ItemData, Context> & { ref?: Ref<GroupedVirtuosoHandle> }
) => ReactElement
