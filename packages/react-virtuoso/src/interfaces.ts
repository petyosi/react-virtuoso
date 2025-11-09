import React from 'react'

/**
 * @group Common
 */
export type CalculateViewLocation = (params: CalculateViewLocationParams) => IndexLocationWithAlign | null | number

/**
 * @group Common
 */
export interface CalculateViewLocationParams {
  itemBottom: number
  itemTop: number
  locationParams: {
    align?: 'center' | 'end' | 'start'
    behavior?: 'auto' | 'smooth'
  } & ({ groupIndex: number } | { index: number })
  viewportBottom: number
  viewportTop: number
}

/**
 * @group Common
 */
export interface ContextProp<C> {
  context: C
}

/**
 * Customize the Virtuoso rendering by passing a set of custom components.
 * @group Virtuoso
 */
export interface Components<Data = unknown, Context = unknown> {
  /**
   * Set to render a custom UI when the list is empty.
   */
  EmptyPlaceholder?: React.ComponentType<ContextProp<Context>>
  /**
   * Set to render a component at the bottom of the list.
   */
  Footer?: React.ComponentType<ContextProp<Context>>
  /**
   * Set to customize the group item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Group?: React.ComponentType<GroupProps & ContextProp<Context>>
  /**
   * Set to render a component at the top of the list.
   *
   * The header remains above the top items and does not remain sticky.
   */
  Header?: React.ComponentType<ContextProp<Context>>

  /**
   * Set to customize the item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Item?: React.ComponentType<ItemProps<Data> & ContextProp<Context>>

  /**
   * Set to customize the items wrapper. Use only if you would like to render list from elements different than a `div`.
   */
  List?: React.ComponentType<ListProps & ContextProp<Context>>

  /**
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: React.ComponentType<ScrollerProps & ContextProp<Context>>

  /**
   * Set to render an item placeholder when the user scrolls fast.  See the `scrollSeek` property for more details.
   */
  ScrollSeekPlaceholder?: React.ComponentType<ScrollSeekPlaceholderProps & ContextProp<Context>>

  /**
   * Set to customize the top list item wrapping element. Use if you would like to render list from elements different than a `div`
   * or you want to set a custom z-index for the sticky position.
   */
  TopItemList?: React.ComponentType<TopItemListProps & ContextProp<Context>>
}

/**
 * @group Common
 */
export type ComputeItemKey<D, C> = (index: number, item: D, context: C) => React.Key

/**
 * Passed to the Components.FillerRow custom component
 * @group TableVirtuoso
 */
export interface FillerRowProps {
  height: number
}

/**
 * @group TableVirtuoso
 */
export type FixedFooterContent = (() => React.ReactNode) | null

/**
 * @group TableVirtuoso
 */
export type FixedHeaderContent = (() => React.ReactNode) | null

/**
 * @group Common
 */
export interface FlatIndexLocationWithAlign extends LocationOptions {
  /**
   * The index of the item to scroll to.
   */
  index: 'LAST' | number
}

/**
 * @group Common
 */
export interface FlatScrollIntoViewLocation extends ScrollIntoViewLocationOptions {
  index: number
}

/**
 * @group Common
 */
export type FollowOutput = FollowOutputCallback | FollowOutputScalarType

/**
 * @group Common
 */
export type FollowOutputCallback = (isAtBottom: boolean) => FollowOutputScalarType

/**
 * @group Common
 */
export type FollowOutputScalarType = 'auto' | 'smooth' | boolean

/**
 * Customize the VirtuosoGrid rendering by passing a set of custom components.
 * @group VirtuosoGrid
 */
export interface GridComponents<Context = any> {
  /**
   * Set to render a component at the bottom of the list.
   */
  Footer?: React.ComponentType<ContextProp<Context>>

  /**
   * Set to render a component at the top of the list.
   *
   * The header remains above the top items and does not remain sticky.
   */
  Header?: React.ComponentType<ContextProp<Context>>

  /**
   * Set to customize the item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Item?: React.ComponentType<GridItemProps & ContextProp<Context>>

  /**
   * Set to customize the items wrapper. Use only if you would like to render list from elements different than a `div`.
   */
  List?: React.ComponentType<GridListProps & ContextProp<Context>>

  /**
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: React.ComponentType<ScrollerProps & ContextProp<Context>>

  /**
   * Set to render an item placeholder when the user scrolls fast.
   * See the `scrollSeekConfiguration` property for more details.
   */
  ScrollSeekPlaceholder?: React.ComponentType<GridScrollSeekPlaceholderProps & ContextProp<Context>>
}

/**
 * @group VirtuosoGrid
 */
export type GridComputeItemKey<D, C> = (index: number, item: D, context: C) => React.Key

/**
 * @group VirtuosoGrid
 */
export type GridIndexLocation = FlatIndexLocationWithAlign | number

/**
 * @group VirtuosoGrid
 */
export interface GridItem<D> {
  data?: D
  index: number
}

/**
 * @group VirtuosoGrid
 */
export type GridItemContent<D, C> = (index: number, data: D, context: C) => React.ReactNode

/**
 * Passed to the GridComponents.Item custom component
 * @group VirtuosoGrid
 */
export type GridItemProps = Pick<React.ComponentProps<'div'>, 'children' | 'className' | 'style'> &
  React.RefAttributes<HTMLDivElement> & {
    'data-index': number
  }

/**
 * Passed to the GridComponents.List custom component
 * @group VirtuosoGrid
 */
export type GridListProps = Pick<React.ComponentProps<'div'>, 'children' | 'className' | 'style'> &
  React.RefAttributes<HTMLDivElement> & {
    'data-testid': string
  }

/**
 * @group VirtuosoGrid
 */
export type GridRootProps = Omit<React.HTMLProps<HTMLDivElement>, 'data' | 'ref'>

/**
 * Passed to the GridComponents.ScrollSeekPlaceholder custom component
 * @group VirtuosoGrid
 */
export interface GridScrollSeekPlaceholderProps {
  height: number
  index: number
  width: number
}

/**
 * @group GroupedVirtuoso
 */
export type GroupContent<C> = (index: number, context: C) => React.ReactNode

/**
 * @group GroupedVirtuoso
 */
export interface GroupedScrollIntoViewLocation extends ScrollIntoViewLocationOptions {
  groupIndex: number
}

/**
 * @group GroupedVirtuoso
 */
export interface GroupIndexLocationWithAlign extends LocationOptions {
  /**
   * The group index of the item to scroll to.
   */
  groupIndex: number
}

/**
 * @group GroupedVirtuoso
 */
export interface GroupItem<D> extends Item<D> {
  originalIndex?: number
  type: 'group'
}

/**
 * @group GroupedVirtuoso
 */
export type GroupItemContent<D, C> = (index: number, groupIndex: number, data: D, context: C) => React.ReactNode

/**
 * @group GroupedVirtuoso
 */
export type GroupProps = Pick<React.ComponentProps<'div'>, 'children' | 'style'> & {
  'data-index': number
  'data-item-index': number
  'data-known-size': number
}

/**
 * @group Common
 */
export type IndexLocationWithAlign = FlatIndexLocationWithAlign | GroupIndexLocationWithAlign

/**
 * @group Common
 */
export interface Item<D> {
  data?: D
  index: number
  offset: number
  size: number
}

/**
 * @group Virtuoso
 */
export type ItemContent<D, C> = (index: number, data: D, context: C) => React.ReactNode

/**
 * Passed to the Components.Item custom component
 * @group Virtuoso
 */
export type ItemProps<D> = Pick<React.ComponentProps<'div'>, 'children' | 'style'> & {
  'data-index': number
  'data-item-group-index'?: number
  'data-item-index': number
  'data-known-size': number
  item: D
}

/**
 * @group Common
 */
export type ListItem<D> = GroupItem<D> | RecordItem<D>

/**
 * Passed to the Components.List custom component
 * @group Virtuoso
 */
export type ListProps = Pick<React.ComponentProps<'div'>, 'children' | 'style'> &
  React.RefAttributes<HTMLDivElement> & {
    'data-testid': string
  }

/**
 * @group Common
 */
export interface ListRange {
  endIndex: number
  startIndex: number
}

/**
 * @group Virtuoso
 */
export type ListRootProps = Omit<React.HTMLProps<HTMLDivElement>, 'data' | 'ref'>

/**
 * @group Common
 */
export interface LocationOptions {
  /**
   * How to position the item in the viewport.
   */
  align?: 'center' | 'end' | 'start'
  /**
   * Set 'smooth' to have an animated transition to the specified location.
   */
  behavior?: 'auto' | 'smooth'
  /**
   * The offset to scroll.
   */
  offset?: number
}

/**
 * @group Common
 */
export interface RecordItem<D> extends Item<D> {
  data?: D
  groupIndex?: number
  originalIndex?: number
  type?: undefined
}

/**
 * @group Common
 */
export interface ScrollContainerState {
  scrollHeight: number
  scrollTop: number
  viewportHeight: number
}

/**
 * Passed to the Components.Scroller custom component
 * @group Common
 */
export type ScrollerProps = Pick<React.ComponentProps<'div'>, 'children' | 'style' | 'tabIndex'> &
  React.RefAttributes<HTMLDivElement> & {
    'data-testid'?: string
    'data-virtuoso-scroller'?: boolean
  }

/**
 * @group Common
 */
export type ScrollIntoViewLocation = FlatScrollIntoViewLocation | GroupedScrollIntoViewLocation

/**
 * @group Common
 */
export interface ScrollIntoViewLocationOptions {
  align?: 'center' | 'end' | 'start'
  behavior?: 'auto' | 'smooth'
  /**
   * Use this function to fine-tune the scrollIntoView behavior.
   * The function receives the item's top and bottom position in the viewport, and the viewport top/bottom.
   * Return an location object to scroll, or null to prevent scrolling.
   * Here's the default implementation:
   * ```ts
const defaultCalculateViewLocation: CalculateViewLocation = ({
  itemTop,
  itemBottom,
  viewportTop,
  viewportBottom,
  locationParams: { behavior, align, ...rest },
}) => {
  if (itemTop < viewportTop) {
    return { ...rest, behavior, align: align ?? 'start' }
  }
  if (itemBottom > viewportBottom) {
    return { ...rest, behavior, align: align ?? 'end' }
  }
  return null
}
   *```
   */
  calculateViewLocation?: CalculateViewLocation
  /**
   * Will be called when the scroll is done, or immediately if no scroll is needed.
   */
  done?: () => void
}

/**
 * @group Common
 */
export interface ScrollSeekConfiguration {
  /**
   * called during scrolling in scroll seek mode - use to display a hint where the list is.
   */
  change?: (velocity: number, range: ListRange) => void
  /**
   * Callback to determine if the list should enter "scroll seek" mode.
   */
  enter: ScrollSeekToggle
  /**
   * Callback to determine if the list should exit "scroll seek" mode.
   */
  exit: ScrollSeekToggle
}

/**
 * Passed to the Components.ScrollSeekPlaceholder custom component
 * @group Virtuoso
 */
export interface ScrollSeekPlaceholderProps {
  groupIndex?: number
  height: number
  index: number
  type: 'group' | 'item'
}

/**
 * @group Common
 */
export type ScrollSeekToggle = (velocity: number, range: ListRange) => boolean

/**
 * Calculates the height of `el`, which will be the `Item` element in the DOM.
 * @group Common
 */
export type SizeFunction = (el: HTMLElement, field: 'offsetHeight' | 'offsetWidth') => number

/**
 * @group Common
 */
export interface SizeRange {
  endIndex: number
  size: number
  startIndex: number
}

/**
 * @group Common
 */
export type StateCallback = (state: StateSnapshot) => void

/**
 * @group Common
 */
export interface StateSnapshot {
  ranges: SizeRange[]
  scrollTop: number
}

/**
 * Passed to the TableComponents.TableBody custom component
 * @group TableVirtuoso
 */
export type TableBodyProps = Pick<React.ComponentProps<'tbody'>, 'children' | 'className' | 'style'> &
  React.RefAttributes<HTMLTableSectionElement> & {
    'data-testid': string
  }

/**
 * Customize the TableVirtuoso rendering by passing a set of custom components.
 * @group TableVirtuoso
 */
export interface TableComponents<Data = unknown, Context = unknown> {
  /**
   * Set to render a custom UI when the list is empty.
   */
  EmptyPlaceholder?: React.ComponentType<ContextProp<Context>>

  /**
   * Set to render an empty item placeholder.
   */
  FillerRow?: React.ComponentType<FillerRowProps & ContextProp<Context>>

  /**
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: React.ComponentType<ScrollerProps & ContextProp<Context>>

  /**
   * Set to render an item placeholder when the user scrolls fast.  See the `scrollSeek` property for more details.
   */
  ScrollSeekPlaceholder?: React.ComponentType<ScrollSeekPlaceholderProps & ContextProp<Context>>

  /**
   * Set to customize the wrapping `table` element.
   *
   */
  Table?: React.ComponentType<TableProps & ContextProp<Context>>

  /**
   * Set to customize the items wrapper. Default is `tbody`.
   */
  TableBody?: React.ComponentType<TableBodyProps & ContextProp<Context>>

  /**
   * Set to customize the group item wrapping element. Use only if you would like to render list from elements different than a `tr`.
   */
  Group?: React.ComponentType<GroupProps & ContextProp<Context>>

  /**
   * Set to render a fixed footer at the bottom of the table (`tfoot`). use [[fixedFooterContent]] to set the contents
   */
  TableFoot?: React.ComponentType<
    Pick<React.ComponentProps<'tfoot'>, 'children' | 'style'> & React.RefAttributes<HTMLTableSectionElement> & ContextProp<Context>
  >

  /**
   * Set to render a fixed header at the top of the table (`thead`). use [[fixedHeaderContent]] to set the contents
   *
   */
  TableHead?: React.ComponentType<
    Pick<React.ComponentProps<'thead'>, 'children' | 'style'> & React.RefAttributes<HTMLTableSectionElement> & ContextProp<Context>
  >

  /**
   * Set to customize the item wrapping element. Default is `tr`.
   */
  TableRow?: React.ComponentType<ItemProps<Data> & ContextProp<Context>>
}

/**
 * @group TableVirtuoso
 */
export type TableProps = Pick<React.ComponentProps<'table'>, 'children' | 'style'>

/**
 * @group TableVirtuoso
 */
export type TableRootProps = Omit<React.HTMLProps<HTMLTableElement>, 'data' | 'ref'>

/**
 * @group Virtuoso
 */
export type TopItemListProps = Pick<React.ComponentProps<'div'>, 'children' | 'style'>

/**
 * @group Common
 */
export interface WindowViewportInfo {
  offsetTop: number
  visibleHeight: number
  visibleWidth: number
}
