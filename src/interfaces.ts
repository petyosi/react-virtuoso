import { ComponentType, CSSProperties, HTMLAttributes, Key, ReactNode, Ref } from 'react'
export interface ListRange {
  startIndex: number
  endIndex: number
}

export interface ItemContent {
  (index: number, data?: any): ReactNode
}

export interface GroupItemContent {
  (index: number, groupIndex: number, data?: any): ReactNode
}

export interface GroupContent {
  (index: number): ReactNode
}

export type HTMLProps = HTMLAttributes<HTMLDivElement>

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
   * Set to customize the outermost scrollable element. This should not be necessary in general,
   * as the component passes its HTML attribute props to it.
   */
  Scroller?: ComponentType<HTMLProps & { ref: Ref<HTMLDivElement> }>

  /**
   * Set to customize the items wrapper. Use only if you would like to render list from elements different than a `div`.
   */
  List?: ComponentType<{ ref: Ref<HTMLDivElement>; style: CSSProperties }>

  /**
   * Set to render a custom UI when the list is empty.
   */
  EmptyPlaceholder?: ComponentType

  /** Set to render an item placeholder when the user scrolls fast.  See the `scrollSeek` property for more details.  */
  ScrollSeekPlaceholder?: ComponentType<{ index: number; height: number }>
}

export interface ComputeItemKey {
  (index: number): Key
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

export type FollowOutput = boolean | 'smooth' | 'auto'

export interface Item {
  index: number
  offset: number
  size: number
  data?: any
}
export interface RecordItem extends Item {
  type?: undefined
  groupIndex?: number
  originalIndex?: number
  data?: any
}

export interface GroupItem extends Item {
  type: 'group'
  originalIndex?: number
}

export type ListItem = RecordItem | GroupItem

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
}
