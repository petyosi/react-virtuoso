import { ComponentPropsWithRef, ComponentType, Key, ReactNode, CSSProperties } from 'react'
export interface ListRange {
  startIndex: number
  endIndex: number
}

export interface ItemContent<D> {
  (index: number, data: D): ReactNode
}

export interface GroupItemContent<D> {
  (index: number, groupIndex: number, data: D): ReactNode
}

export interface GroupContent {
  (index: number): ReactNode
}

export interface ItemProps {
  'data-index': number
  'data-item-index': number
  'data-item-group-index'?: number
  'data-known-size': number
}

export interface GroupProps {
  'data-index': number
  'data-item-index': number
  'data-known-size': number
}

export type TopItemListProps = Pick<ComponentPropsWithRef<'div'>, 'style' | 'children'>

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
export type ScrollerProps = Pick<ComponentPropsWithRef<'div'>, 'style' | 'children' | 'tabIndex' | 'ref'>

/**
 * Passed to the Components.ScrollSeekPlaceholder custom component
 */
export interface ScrollSeekPlaceholderProps {
  index: number
  height: number
}

/**
 * Customize the Virtuoso rendering by passing a set of custom components.
 */
export interface Components {
  /**
   * Set to render a component at the top of the list.
   *
   * The header remains above the top items and does not remain sticky.
   */
  Header?: ComponentType
  /**
   * Set to render a component at the bottom of the list.
   */
  Footer?: ComponentType
  /**
   * Set to customize the item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Item?: ComponentType<ItemProps>
  /**
   * Set to customize the group item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Group?: ComponentType<GroupProps>

  /**
   * Set to customize the top list item wrapping element. Use if you would like to render list from elements different than a `div`
   * or you want to set a custom z-index for the sticky position.
   */
  TopItemList?: ComponentType<TopItemListProps>

  /**
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: ComponentType<ScrollerProps>

  /**
   * Set to customize the items wrapper. Use only if you would like to render list from elements different than a `div`.
   */
  List?: ComponentType<ListProps>

  /**
   * Set to render a custom UI when the list is empty.
   */
  EmptyPlaceholder?: ComponentType

  /**
   * Set to render an item placeholder when the user scrolls fast.  See the `scrollSeek` property for more details.
   */
  ScrollSeekPlaceholder?: ComponentType<ScrollSeekPlaceholderProps>
}

export interface ComputeItemKey<D> {
  (index: number, item: D): Key
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

export interface IndexLocationWithAlign {
  /**
   * The index of the item to scroll to.
   */
  index: number
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

export type ListRootProps = Omit<React.HTMLProps<'div'>, 'ref' | 'data'>
export type GridRootProps = Omit<React.HTMLProps<'div'>, 'ref' | 'data'>

export interface GridItem {
  'data-index': number
  className?: string
}

export interface GridComponents {
  /**
   * Set to customize the item wrapping element. Use only if you would like to render list from elements different than a `div`.
   */
  Item?: ComponentType<GridItem>

  /**
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: ComponentType<ScrollerProps>

  /**
   * Set to customize the items wrapper. Use only if you would like to render list from elements different than a `div`.
   */
  List?: ComponentType<GridListProps>

  /**
   * Set to render an item placeholder when the user scrolls fast.
   * See the `scrollSeekConfiguration` property for more details.
   */
  ScrollSeekPlaceholder?: ComponentType<{ style: CSSProperties }>
}

export interface GridComputeItemKey {
  (index: number): Key
}

export interface GridItemContent {
  (index: number): ReactNode
}

export interface WindowViewportInfo {
  offsetTop: number
  visibleHeight: number
  visibleWidth: number
}
