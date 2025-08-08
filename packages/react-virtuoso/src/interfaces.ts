import React from 'react'
export type CalculateViewLocation = (params: CalculateViewLocationParams) => IndexLocationWithAlign | null | number

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

export interface ContextProp<C> {
  context: C
}

/**
 * Customize the Virtuoso rendering by passing a set of custom components.
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

export type ComputeItemKey<D, C> = (index: number, item: D, context: C) => React.Key
/**
 * Passed to the Components.FillerRow custom component
 */
export interface FillerRowProps {
  height: number
}

export type FixedFooterContent = (() => React.ReactNode) | null

export type FixedHeaderContent = (() => React.ReactNode) | null

export interface FlatIndexLocationWithAlign extends LocationOptions {
  /**
   * The index of the item to scroll to.
   */
  index: 'LAST' | number
}

export interface FlatScrollIntoViewLocation extends ScrollIntoViewLocationOptions {
  index: number
}
export type FollowOutput = FollowOutputCallback | FollowOutputScalarType

export type FollowOutputCallback = (isAtBottom: boolean) => FollowOutputScalarType

export type FollowOutputScalarType = 'auto' | 'smooth' | boolean

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

export type GridComputeItemKey<D, C> = (index: number, item: D, context: C) => React.Key

export type GridIndexLocation = FlatIndexLocationWithAlign | number

export interface GridItem<D> {
  data?: D
  index: number
}
export type GridItemContent<D, C> = (index: number, data: D, context: C) => React.ReactNode

/**
 * Passed to the Components.Item custom component
 */
export type GridItemProps = Pick<React.ComponentProps<'div'>, 'children' | 'className' | 'style'> &
  React.RefAttributes<HTMLDivElement> & {
    'data-index': number
  }

/**
 * Passed to the Components.List custom component
 */
export type GridListProps = Pick<React.ComponentProps<'div'>, 'children' | 'className' | 'style'> &
  React.RefAttributes<HTMLDivElement> & {
    'data-testid': string
  }

export type GridRootProps = Omit<React.HTMLProps<HTMLDivElement>, 'data' | 'ref'>

/**
 * Passed to the GridComponents.ScrollSeekPlaceholder custom component
 */
export interface GridScrollSeekPlaceholderProps {
  height: number
  index: number
  width: number
}

export type GroupContent<C> = (index: number, context: C) => React.ReactNode

export interface GroupedScrollIntoViewLocation extends ScrollIntoViewLocationOptions {
  groupIndex: number
}

export interface GroupIndexLocationWithAlign extends LocationOptions {
  /**
   * The group index of the item to scroll to.
   */
  groupIndex: number
}
export interface GroupItem<D> extends Item<D> {
  originalIndex?: number
  type: 'group'
}
export type GroupItemContent<D, C> = (index: number, groupIndex: number, data: D, context: C) => React.ReactNode

export type GroupProps = Pick<React.ComponentProps<'div'>, 'children' | 'style'> & {
  'data-index': number
  'data-item-index': number
  'data-known-size': number
}
export type IndexLocationWithAlign = FlatIndexLocationWithAlign | GroupIndexLocationWithAlign

export interface Item<D> {
  data?: D
  index: number
  offset: number
  size: number
}

export type ItemContent<D, C> = (index: number, data: D, context: C) => React.ReactNode

export type ItemProps<D> = Pick<React.ComponentProps<'div'>, 'children' | 'style'> & {
  'data-index': number
  'data-item-group-index'?: number
  'data-item-index': number
  'data-known-size': number
  item: D
}

export type ListItem<D> = GroupItem<D> | RecordItem<D>

/**
 * Passed to the Components.List custom component
 */
export type ListProps = Pick<React.ComponentProps<'div'>, 'children' | 'style'> &
  React.RefAttributes<HTMLDivElement> & {
    'data-testid': string
  }

export interface ListRange {
  endIndex: number
  startIndex: number
}

export type ListRootProps = Omit<React.HTMLProps<HTMLDivElement>, 'data' | 'ref'>

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
export interface RecordItem<D> extends Item<D> {
  data?: D
  groupIndex?: number
  originalIndex?: number
  type?: undefined
}
export interface ScrollContainerState {
  scrollHeight: number
  scrollTop: number
  viewportHeight: number
}

/**
 * Passed to the Components.Scroller custom component
 */
export type ScrollerProps = Pick<React.ComponentProps<'div'>, 'children' | 'style' | 'tabIndex'> &
  React.RefAttributes<HTMLDivElement> & {
    'data-testid'?: string
    'data-virtuoso-scroller'?: boolean
  }

export type ScrollIntoViewLocation = FlatScrollIntoViewLocation | GroupedScrollIntoViewLocation

export interface ScrollIntoViewLocationOptions {
  align?: 'center' | 'end' | 'start'
  behavior?: 'auto' | 'smooth'
  /**
   * Use this function for the scroll to be initiated directly after the next update of data/totalCount.
   * The index provided therefore should be consistent with the data/totalCount set.
   * It is only currently designed to be used with behavior: 'auto'.
   */
  targetsNextRefresh?: boolean
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
 */
export interface ScrollSeekPlaceholderProps {
  groupIndex?: number
  height: number
  index: number
  type: 'group' | 'item'
}

export type ScrollSeekToggle = (velocity: number, range: ListRange) => boolean

/** Calculates the height of `el`, which will be the `Item` element in the DOM. */
export type SizeFunction = (el: HTMLElement, field: 'offsetHeight' | 'offsetWidth') => number

export interface SizeRange {
  endIndex: number
  size: number
  startIndex: number
}

export type StateCallback = (state: StateSnapshot) => void

export interface StateSnapshot {
  ranges: SizeRange[]
  scrollTop: number
}

/**
 * Passed to the Components.TableBody custom component
 */
export type TableBodyProps = Pick<React.ComponentProps<'tbody'>, 'children' | 'className' | 'style'> &
  React.RefAttributes<HTMLTableSectionElement> & {
    'data-testid': string
  }

/**
 * Customize the TableVirtuoso rendering by passing a set of custom components.
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

export type TableProps = Pick<React.ComponentProps<'table'>, 'children' | 'style'>

export type TableRootProps = Omit<React.HTMLProps<HTMLTableElement>, 'data' | 'ref'>

export type TopItemListProps = Pick<React.ComponentProps<'div'>, 'children' | 'style'>

export interface WindowViewportInfo {
  offsetTop: number
  visibleHeight: number
  visibleWidth: number
}
