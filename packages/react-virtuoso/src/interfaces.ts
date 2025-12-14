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
 *
 * @typeParam Data - The type of data items in the list
 * @typeParam Context - The type of additional context passed to components
 *
 * @example
 * ```tsx
 * const components: Components<User, AppContext> = {
 *   Item: ({ children, context }) => <div className="item">{children}</div>,
 *   Header: ({ context }) => <div>Header</div>,
 *   Footer: ({ context }) => <div>Footer</div>,
 * }
 * <Virtuoso components={components} />
 * ```
 *
 * @see {@link VirtuosoProps.components} for usage in Virtuoso
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
 * Callback type for computing unique keys for list items.
 *
 * @typeParam D - The type of the data item
 * @typeParam C - The type of context passed from the component
 *
 * @see {@link VirtuosoProps.computeItemKey} for usage in Virtuoso
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
 * Callback type for rendering fixed footer content in a table.
 * The footer remains visible at the bottom of the viewport.
 *
 * @example
 * ```tsx
 * const fixedFooterContent: FixedFooterContent = () => (
 *   <tr><td>Total: 100 items</td></tr>
 * )
 * <TableVirtuoso fixedFooterContent={fixedFooterContent} />
 * ```
 *
 * @see {@link TableVirtuosoProps.fixedFooterContent} for usage
 * @group TableVirtuoso
 */
export type FixedFooterContent = (() => React.ReactNode) | null

/**
 * Callback type for rendering fixed header content in a table.
 * The header remains visible at the top of the viewport.
 *
 * @example
 * ```tsx
 * const fixedHeaderContent: FixedHeaderContent = () => (
 *   <tr><th>Name</th><th>Email</th></tr>
 * )
 * <TableVirtuoso fixedHeaderContent={fixedHeaderContent} />
 * ```
 *
 * @see {@link TableVirtuosoProps.fixedHeaderContent} for usage
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
 *
 * @typeParam Context - The type of additional context passed to components
 *
 * @example
 * ```tsx
 * const components: GridComponents<AppContext> = {
 *   Item: ({ children, className }) => <div className={className}>{children}</div>,
 *   Header: ({ context }) => <div>Header</div>,
 * }
 * <VirtuosoGrid components={components} />
 * ```
 *
 * @see {@link VirtuosoGridProps.components} for usage in VirtuosoGrid
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
 * Callback type for computing unique keys for grid items.
 *
 * @typeParam D - The type of the data item
 * @typeParam C - The type of context passed from the component
 *
 * @see {@link VirtuosoGridProps.computeItemKey} for usage
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
 * Callback type for rendering item content in a VirtuosoGrid.
 *
 * @typeParam D - The type of the data item
 * @typeParam C - The type of context passed from the component
 *
 * @example
 * ```tsx
 * const itemContent: GridItemContent<Product, AppContext> = (index, product, context) => (
 *   <div className="grid-item">{product.name}</div>
 * )
 * <VirtuosoGrid itemContent={itemContent} data={products} />
 * ```
 *
 * @see {@link VirtuosoGridProps.itemContent} for usage
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
 * Callback type for rendering group header content in GroupedVirtuoso.
 *
 * @typeParam C - The type of context passed from the component
 *
 * @example
 * ```tsx
 * const groupContent: GroupContent<AppContext> = (index, context) => (
 *   <div className="group-header">Group {index}</div>
 * )
 * <GroupedVirtuoso groupContent={groupContent} />
 * ```
 *
 * @see {@link GroupedVirtuosoProps.groupContent} for usage
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
 * Callback type for rendering item content in a GroupedVirtuoso list.
 * Similar to ItemContent but includes the group index.
 *
 * @typeParam D - The type of the data item
 * @typeParam C - The type of context passed from the component
 *
 * @example
 * ```tsx
 * const itemContent: GroupItemContent<User, AppContext> = (index, groupIndex, user, context) => (
 *   <div>{user.name} (Group {groupIndex})</div>
 * )
 * <GroupedVirtuoso itemContent={itemContent} />
 * ```
 *
 * @see {@link GroupedVirtuosoProps.itemContent} for usage
 * @see {@link ItemContent} for non-grouped list variant
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
 * Callback type for rendering item content in a Virtuoso list.
 *
 * @typeParam D - The type of the data item
 * @typeParam C - The type of context passed from the component
 *
 * @example
 * ```tsx
 * const itemContent: ItemContent<User, AppContext> = (index, user, context) => (
 *   <div>{user.name}</div>
 * )
 * <Virtuoso itemContent={itemContent} data={users} />
 * ```
 *
 * @see {@link VirtuosoProps.itemContent} for usage in Virtuoso
 * @see {@link GroupItemContent} for grouped list variant
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
 * Union type representing either a regular item or a group header item in the list.
 *
 * @typeParam D - The type of the data item
 *
 * @see {@link RecordItem} for regular items
 * @see {@link GroupItem} for group header items
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
 * Represents a range of items in the list by their indices.
 * Used to track which items are currently visible in the viewport.
 *
 * @see {@link VirtuosoProps.rangeChanged} for visibility change events
 * @group Common
 */
export interface ListRange {
  /** The index of the last visible item */
  endIndex: number
  /** The index of the first visible item */
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
 * Configuration for scroll seek mode, which renders placeholders during fast scrolling.
 * This improves performance when users scroll rapidly through large lists.
 *
 * @example
 * ```tsx
 * const scrollSeekConfiguration: ScrollSeekConfiguration = {
 *   enter: (velocity) => Math.abs(velocity) > 200,
 *   exit: (velocity) => Math.abs(velocity) < 30,
 *   change: (velocity, range) => console.log('Scrolling', range),
 * }
 * <Virtuoso scrollSeekConfiguration={scrollSeekConfiguration} />
 * ```
 *
 * @see {@link VirtuosoProps.scrollSeekConfiguration} for usage
 * @see {@link Components.ScrollSeekPlaceholder} for custom placeholder rendering
 * @group Common
 */
export interface ScrollSeekConfiguration {
  /**
   * Called during scrolling in scroll seek mode - use to display a hint where the list is.
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
 * Custom function for calculating item sizes.
 * Override to account for margins, padding, or other layout considerations.
 *
 * @see {@link VirtuosoProps.itemSize} for usage
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
 * Callback type for receiving state snapshots for persistence.
 *
 * @see {@link VirtuosoProps.getState} for usage
 * @see {@link StateSnapshot} for the snapshot structure
 * @group Common
 */
export type StateCallback = (state: StateSnapshot) => void

/**
 * A snapshot of the virtuoso state that can be saved and restored.
 * Use this to persist scroll position and item sizes across page reloads.
 *
 * @see {@link VirtuosoProps.restoreStateFrom} for restoring state
 * @see {@link VirtuosoHandle.getState} for capturing state
 * @group Common
 */
export interface StateSnapshot {
  /** The measured size ranges of items */
  ranges: SizeRange[]
  /** The scroll position in pixels */
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
 *
 * @typeParam Data - The type of data items in the table
 * @typeParam Context - The type of additional context passed to components
 *
 * @example
 * ```tsx
 * const components: TableComponents<User, AppContext> = {
 *   Table: ({ children, style }) => <table style={style}>{children}</table>,
 *   TableRow: ({ children, item }) => <tr>{children}</tr>,
 * }
 * <TableVirtuoso components={components} />
 * ```
 *
 * @see {@link TableVirtuosoProps.components} for usage in TableVirtuoso
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
