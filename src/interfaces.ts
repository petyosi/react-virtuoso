import { ComponentPropsWithRef, ComponentType, Key, ReactNode } from 'react'
export interface ListRange {
  startIndex: number
  endIndex: number
}

export interface ItemContent<D, C> {
  (index: number, data: D, context: C): ReactNode
}

export type FixedHeaderContent = (() => React.ReactNode) | null

export interface GroupItemContent<D, C> {
  (index: number, groupIndex: number, data: D, context: C): ReactNode
}

export interface GroupContent {
  (index: number): ReactNode
}

export type ItemProps = Pick<ComponentPropsWithRef<'div'>, 'style' | 'children'> & {
  'data-index': number
  'data-item-index': number
  'data-item-group-index'?: number
  'data-known-size': number
}

export type GroupProps = Pick<ComponentPropsWithRef<'div'>, 'style' | 'children'> & {
  'data-index': number
  'data-item-index': number
  'data-known-size': number
}

export type TopItemListProps = Pick<ComponentPropsWithRef<'div'>, 'style' | 'children'>
export type TableProps = Pick<ComponentPropsWithRef<'table'>, 'style'>

/**
 * Passed to the Components.TableBody custom component
 */
export type TableBodyProps = Pick<ComponentPropsWithRef<'tbody'>, 'style' | 'children' | 'ref' | 'className'> & { 'data-test-id': string }

/**
 * Passed to the Components.List custom component
 */
export type ListProps = Pick<ComponentPropsWithRef<'div'>, 'style' | 'children' | 'ref'> & { 'data-test-id': string }

/**
 * Passed to the Components.List custom component
 */
export type GridListProps = Pick<ComponentPropsWithRef<'div'>, 'style' | 'children' | 'ref' | 'className'>

/**
 * Passed to the Components.Scroller custom component
 */
export type ScrollerProps = Pick<ComponentPropsWithRef<'div'>, 'style' | 'children' | 'tabIndex' | 'ref'> & {
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
export interface Components<Context = unknown> {
  /**
   * Set to render a component at the top of the list.
   *
   * The header remains above the top items and does not remain sticky.
   */
  Header?: ComponentType<{ context?: Context }>
  /**
   * Set to render a component at the bottom of the list.
   */
  Footer?: ComponentType<{ context?: Context }>
  /**
   * Set to customize the item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Item?: ComponentType<ItemProps & { context?: Context }>
  /**
   * Set to customize the group item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Group?: ComponentType<GroupProps & { context?: Context }>

  /**
   * Set to customize the top list item wrapping element. Use if you would like to render list from elements different than a `div`
   * or you want to set a custom z-index for the sticky position.
   */
  TopItemList?: ComponentType<TopItemListProps & { context?: Context }>

  /**
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: ComponentType<ScrollerProps & { context?: Context }>

  /**
   * Set to customize the items wrapper. Use only if you would like to render list from elements different than a `div`.
   */
  List?: ComponentType<ListProps & { context?: Context }>

  /**
   * Set to render a custom UI when the list is empty.
   */
  EmptyPlaceholder?: ComponentType<{ context?: Context }>

  /**
   * Set to render an item placeholder when the user scrolls fast.  See the `scrollSeek` property for more details.
   */
  ScrollSeekPlaceholder?: ComponentType<ScrollSeekPlaceholderProps & { context?: Context }>
}

/**
 * Customize the TableVirtuoso rendering by passing a set of custom components.
 */
export interface TableComponents<Context = unknown> {
  /**
   * Set to customize the wrapping `table` element.
   *
   */
  Table?: ComponentType<TableProps & { context?: Context }>

  /**
   * Set to render a fixed header at the top of the table (`thead`). use [[fixedHeaderHeight]] to set the contents
   *
   */
  TableHead?: ComponentType<{ context?: Context }>

  /**
   * Set to customize the item wrapping element. Default is `tr`.
   */
  TableRow?: ComponentType<ItemProps & { context?: Context }>

  /**
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: ComponentType<ScrollerProps & { context?: Context }>

  /**
   * Set to customize the items wrapper. Default is `tbody`.
   */
  TableBody?: ComponentType<TableBodyProps & { context?: Context }>

  /**
   * Set to render a custom UI when the list is empty.
   */
  EmptyPlaceholder?: ComponentType<{ context?: Context }>

  /**
   * Set to render an item placeholder when the user scrolls fast.  See the `scrollSeek` property for more details.
   */
  ScrollSeekPlaceholder?: ComponentType<ScrollSeekPlaceholderProps & { context?: Context }>

  /**
   * Set to render an empty item placeholder.
   */
  FillerRow?: ComponentType<FillerRowProps & { context?: Context }>
}

export interface ComputeItemKey<D, C> {
  (index: number, item: D, context: C): Key
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

export type ListRootProps = Omit<React.HTMLProps<'div'>, 'ref' | 'data'>
export type TableRootProps = Omit<React.HTMLProps<'table'>, 'ref' | 'data'>
export type GridRootProps = Omit<React.HTMLProps<'div'>, 'ref' | 'data'>

export interface GridItem {
  'data-index': number
  className?: string
}

export interface GridComponents<Context = any> {
  /**
   * Set to customize the item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Item?: ComponentType<GridItem & { context?: Context }>

  /**
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: ComponentType<ScrollerProps & { context?: Context }>

  /**
   * Set to customize the items wrapper. Use only if you would like to render list from elements different than a `div`.
   */
  List?: ComponentType<GridListProps & { context?: Context }>

  /**
   * Set to render an item placeholder when the user scrolls fast.
   * See the `scrollSeekConfiguration` property for more details.
   */
  ScrollSeekPlaceholder?: ComponentType<GridScrollSeekPlaceholderProps & { context?: Context }>
}

export interface GridComputeItemKey {
  (index: number): Key
}

export interface GridItemContent<C> {
  (index: number, context: C): ReactNode
}

export interface WindowViewportInfo {
  offsetTop: number
  visibleHeight: number
  visibleWidth: number
}

export interface ScrollIntoViewLocationOptions {
  behavior?: 'auto' | 'smooth'
  done?: () => void
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
