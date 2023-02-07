import React from 'react'
export interface ListRange {
  startIndex: number
  endIndex: number
}

export interface ItemContent<D, C> {
  (index: number, data: D, context: C): React.ReactNode
}

export type FixedHeaderContent = (() => React.ReactNode) | null

export type FixedFooterContent = (() => React.ReactNode) | null
export interface GroupItemContent<D, C> {
  (index: number, groupIndex: number, data: D, context: C): React.ReactNode
}

export interface GroupContent {
  (index: number): React.ReactNode
}

export type ItemProps<D> = Pick<React.ComponentPropsWithRef<'div'>, 'style' | 'children'> & {
  'data-index': number
  'data-item-index': number
  'data-item-group-index'?: number
  'data-known-size': number
  item: D
}

export type GroupProps = Pick<React.ComponentPropsWithRef<'div'>, 'style' | 'children'> & {
  'data-index': number
  'data-item-index': number
  'data-known-size': number
}

export type TopItemListProps = Pick<React.ComponentPropsWithRef<'div'>, 'style' | 'children'>
export type TableProps = Pick<React.ComponentPropsWithRef<'table'>, 'style' | 'children'>

/**
 * Passed to the Components.TableBody custom component
 */
export type TableBodyProps = Pick<React.ComponentPropsWithRef<'tbody'>, 'style' | 'children' | 'ref' | 'className'> & {
  'data-test-id': string
}

/**
 * Passed to the Components.List custom component
 */
export type ListProps = Pick<React.ComponentPropsWithRef<'div'>, 'style' | 'children' | 'ref'> & { 'data-test-id': string }

/**
 * Passed to the Components.List custom component
 */
export type GridListProps = Pick<React.ComponentPropsWithRef<'div'>, 'style' | 'children' | 'ref' | 'className'> & {
  'data-test-id': string
}

/**
 * Passed to the Components.Scroller custom component
 */
export type ScrollerProps = Pick<React.ComponentPropsWithRef<'div'>, 'style' | 'children' | 'tabIndex' | 'ref'> & {
  'data-test-id'?: string
  'data-virtuoso-scroller'?: boolean
}

/**
 * Passed to the Components.ScrollSeekPlaceholder custom component
 */
export interface ScrollSeekPlaceholderProps {
  index: number
  height: number
  groupIndex?: number
  type: 'group' | 'item'
}
/**
 * Passed to the Components.FillerRow custom component
 */
export interface FillerRowProps {
  height: number
}

/**
 * Passed to the GridComponents.ScrollSeekPlaceholder custom component
 */
export interface GridScrollSeekPlaceholderProps {
  index: number
  height: number
  width: number
}

/**
 * Customize the Virtuoso rendering by passing a set of custom components.
 */
export interface Components<Data = unknown, Context = unknown> {
  /**
   * Set to render a component at the top of the list.
   *
   * The header remains above the top items and does not remain sticky.
   */
  Header?: React.ComponentType<{ context?: Context }>
  /**
   * Set to render a component at the bottom of the list.
   */
  Footer?: React.ComponentType<{ context?: Context }>
  /**
   * Set to customize the item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Item?: React.ComponentType<ItemProps<Data> & { context?: Context }>
  /**
   * Set to customize the group item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Group?: React.ComponentType<GroupProps & { context?: Context }>

  /**
   * Set to customize the top list item wrapping element. Use if you would like to render list from elements different than a `div`
   * or you want to set a custom z-index for the sticky position.
   */
  TopItemList?: React.ComponentType<TopItemListProps & { context?: Context }>

  /**
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: React.ComponentType<ScrollerProps & { context?: Context }>

  /**
   * Set to customize the items wrapper. Use only if you would like to render list from elements different than a `div`.
   */
  List?: React.ComponentType<ListProps & { context?: Context }>

  /**
   * Set to render a custom UI when the list is empty.
   */
  EmptyPlaceholder?: React.ComponentType<{ context?: Context }>

  /**
   * Set to render an item placeholder when the user scrolls fast.  See the `scrollSeek` property for more details.
   */
  ScrollSeekPlaceholder?: React.ComponentType<ScrollSeekPlaceholderProps & { context?: Context }>
}

/**
 * Customize the TableVirtuoso rendering by passing a set of custom components.
 */
export interface TableComponents<Data = unknown, Context = unknown> {
  /**
   * Set to customize the wrapping `table` element.
   *
   */
  Table?: React.ComponentType<TableProps & { context?: Context }>

  /**
   * Set to render a fixed header at the top of the table (`thead`). use [[fixedHeaderHeight]] to set the contents
   *
   */
  TableHead?: React.ComponentType<Pick<React.ComponentPropsWithRef<'thead'>, 'style' | 'ref'> & { context?: Context }>

  /**
   * Set to render a fixed footer at the bottom of the table (`tfoot`). use [[fixedFooterContent]] to set the contents
   */
  TableFoot?: React.ComponentType<Pick<React.ComponentPropsWithRef<'tfoot'>, 'style' | 'ref'> & { context?: Context }>

  /**
   * Set to customize the item wrapping element. Default is `tr`.
   */
  TableRow?: React.ComponentType<ItemProps<Data> & { context?: Context }>

  /**
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: React.ComponentType<ScrollerProps & { context?: Context }>

  /**
   * Set to customize the items wrapper. Default is `tbody`.
   */
  TableBody?: React.ComponentType<TableBodyProps & { context?: Context }>

  /**
   * Set to render a custom UI when the list is empty.
   */
  EmptyPlaceholder?: React.ComponentType<{ context?: Context }>

  /**
   * Set to render an item placeholder when the user scrolls fast.  See the `scrollSeek` property for more details.
   */
  ScrollSeekPlaceholder?: React.ComponentType<ScrollSeekPlaceholderProps & { context?: Context }>

  /**
   * Set to render an empty item placeholder.
   */
  FillerRow?: React.ComponentType<FillerRowProps & { context?: Context }>
}

export interface ComputeItemKey<D, C> {
  (index: number, item: D, context: C): React.Key
}

export interface ScrollSeekToggle {
  (velocity: number, range: ListRange): boolean
}

export interface ScrollSeekConfiguration {
  /**
   * Callback to determine if the list should enter "scroll seek" mode.
   */
  enter: ScrollSeekToggle
  /**
   * called during scrolling in scroll seek mode - use to display a hint where the list is.
   */
  change?: (velocity: number, range: ListRange) => void
  /**
   * Callback to determine if the list should enter "scroll seek" mode.
   */
  exit: ScrollSeekToggle
}

export type FollowOutputScalarType = boolean | 'smooth' | 'auto'
export type FollowOutputCallback = (isAtBottom: boolean) => FollowOutputScalarType
export type FollowOutput = FollowOutputCallback | FollowOutputScalarType

export interface Item<D> {
  index: number
  offset: number
  size: number
  data?: D
}
export interface RecordItem<D> extends Item<D> {
  type?: undefined
  groupIndex?: number
  originalIndex?: number
  data?: D
}

export interface GroupItem<D> extends Item<D> {
  type: 'group'
  originalIndex?: number
}

export type ListItem<D> = RecordItem<D> | GroupItem<D>

export interface LocationOptions {
  /**
   * How to position the item in the viewport.
   */
  align?: 'start' | 'center' | 'end'
  /**
   * Set 'smooth' to have an animated transition to the specified location.
   */
  behavior?: 'smooth' | 'auto'
  /**
   * The offset to scroll.
   */
  offset?: number
}

export interface FlatIndexLocationWithAlign extends LocationOptions {
  /**
   * The index of the item to scroll to.
   */
  index: number | 'LAST'
}

export interface GroupIndexLocationWithAlign extends LocationOptions {
  /**
   * The group index of the item to scroll to.
   */
  groupIndex: number
}

export type IndexLocationWithAlign = FlatIndexLocationWithAlign | GroupIndexLocationWithAlign

export type ListRootProps = Omit<React.HTMLProps<HTMLDivElement>, 'ref' | 'data'>
export type TableRootProps = Omit<React.HTMLProps<HTMLTableElement>, 'ref' | 'data'>
export type GridRootProps = Omit<React.HTMLProps<HTMLDivElement>, 'ref' | 'data'>

export interface GridItem<D> {
  index: number
  data?: D
}

export interface GridItemProps {
  'data-index': number
  className?: string
}

export interface GridComponents<Context = any> {
  /**
   * Set to customize the item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Item?: React.ComponentType<GridItemProps & { context?: Context }>

  /**
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: React.ComponentType<ScrollerProps & { context?: Context }>

  /**
   * Set to customize the items wrapper. Use only if you would like to render list from elements different than a `div`.
   */
  List?: React.ComponentType<GridListProps & { context?: Context }>

  /**
   * Set to render a component at the top of the list.
   *
   * The header remains above the top items and does not remain sticky.
   */
  Header?: React.ComponentType<{ context?: Context }>

  /**
   * Set to render a component at the bottom of the list.
   */
  Footer?: React.ComponentType<{ context?: Context }>

  /**
   * Set to render an item placeholder when the user scrolls fast.
   * See the `scrollSeekConfiguration` property for more details.
   */
  ScrollSeekPlaceholder?: React.ComponentType<GridScrollSeekPlaceholderProps & { context?: Context }>
}

export interface GridComputeItemKey<D, C> {
  (index: number, item: D, context: C): React.Key
}

export interface GridItemContent<D, C> {
  (index: number, data: D, context: C): React.ReactNode
}

export interface WindowViewportInfo {
  offsetTop: number
  visibleHeight: number
  visibleWidth: number
}

export interface CalculateViewLocationParams {
  itemTop: number
  itemBottom: number
  viewportTop: number
  viewportBottom: number
  locationParams: {
    align?: 'start' | 'center' | 'end'
    behavior?: 'auto' | 'smooth'
  } & ({ index: number } | { groupIndex: number })
}

export type CalculateViewLocation = (params: CalculateViewLocationParams) => IndexLocationWithAlign | number | null

export interface ScrollIntoViewLocationOptions {
  align?: 'start' | 'center' | 'end'
  behavior?: 'auto' | 'smooth'
  /**
   * Will be called when the scroll is done, or immediately if no scroll is needed.
   */
  done?: () => void
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
}

export interface FlatScrollIntoViewLocation extends ScrollIntoViewLocationOptions {
  index: number
}

export interface GroupedScrollIntoViewLocation extends ScrollIntoViewLocationOptions {
  groupIndex: number
}

export type ScrollIntoViewLocation = FlatScrollIntoViewLocation | GroupedScrollIntoViewLocation

export interface ScrollContainerState {
  scrollHeight: number
  scrollTop: number
  viewportHeight: number
}

/** Calculates the height of `el`, which will be the `Item` element in the DOM. */
export type SizeFunction = (el: HTMLElement, field: 'offsetHeight' | 'offsetWidth') => number
