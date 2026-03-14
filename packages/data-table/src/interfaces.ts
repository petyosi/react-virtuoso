/** @internal */
export interface OffsetPoint {
  offset: number
  height: number
  index: number
}

/** @internal */
export interface SizeRange {
  startIndex: number
  endIndex: number
  size: number
}

/** @internal */
export type DataArray<T = unknown> = T[]

export interface TableData<Data, Group> {
  data: (Data | Group)[]
  groups: { index: number; level: number }[]
}

/** @internal - Generic virtualized item, used for both rows and columns */
export interface Item<D> {
  index: number
  offset: number
  size: number
  data: D
  prevData: D | null
  nextData: D | null
}

/** Alias for Item, used in row-specific contexts */
export type Row<D> = Item<D>

/**
 * The scroll behavior to use when scrolling to a location.
 * You can also pass a custom scroll behavior function that returns an object with the number of animation frames and the easing function based on the current scroll top and the targetTop.
 *
 * @group Scroll Animation
 */
export type ScrollBehavior =
  | 'smooth'
  | 'auto'
  | 'instant'
  | ((
      currentTop: number,
      targetTop: number
    ) => {
      animationFrameCount: number
      easing: BezierFunction
    })

/**
 * Specifies a location in the list to scroll to.
 *
 * @group Scroll Location
 */
export interface RowLocationWithAlign {
  /**
   * The index of the item to scroll to. Use `'LAST'` to scroll to the last item.
   */
  index: number | 'LAST'
  /**
   * How to align the item in the viewport.
   */
  align?: 'start' | 'center' | 'end' | 'start-no-overflow'
  /**
   * Set `'smooth'` to have an animated transition to the specified location.
   */
  behavior?: ScrollBehavior
  /**
   * Use the offset for additional adjustment of the position - can be a positive or negative number.
   */
  offset?: number

  /**
   * A callback that's invoked when the scroll is complete.
   */
  done?: () => void
}

/**
 * A location in the list to scroll to. Passing a number scrolls instantly to the row at the specified index aligned to the top. See {@link RowLocationWithAlign} for more advanced options.
 *
 * @group Scroll Location
 */
export type RowLocation = number | RowLocationWithAlign

/**
 * Used for the custom components that accept the data table context prop.
 * @typeParam Context - The type of the context passed to the table.
 *
 * @group Customization
 */
export type ContextAwareComponent<Context = any> = React.ComponentType<{
  /**
   * The value currently passed to the `context` prop of the `VirtuosoDataTable` component.
   */
  context: Context
}>

/**
 * The type of the component that can be used for the scroll element.
 * @typeParam Context - The type of the context passed to the list.
 *
 * @group Customization
 */
export type ScrollElementComponent<Context = any> = React.ComponentType<
  React.HTMLProps<HTMLDivElement> & {
    context?: Context
  } & React.RefAttributes<HTMLDivElement>
>

/** @internal */
export type HeaderWrapperComponent = React.ComponentType<
  {
    style: React.CSSProperties
    children: React.ReactNode
  } & React.RefAttributes<HTMLDivElement>
>

/** @internal */
export type StickyHeaderWrapperComponent = React.ComponentType<
  {
    style: React.CSSProperties
    children: React.ReactNode
  } & React.RefAttributes<HTMLDivElement>
>

/** @internal */
export type FooterWrapperComponent = React.ComponentType<
  {
    style: React.CSSProperties
    children: React.ReactNode
  } & React.RefAttributes<HTMLDivElement>
>

/** @internal */
export type StickyFooterWrapperComponent = React.ComponentType<
  {
    style: React.CSSProperties
    children: React.ReactNode
  } & React.RefAttributes<HTMLDivElement>
>

/**
 * Describes the location of the list relative to the viewport and the scroll element.
 *
 * @group State
 */
export interface ListScrollLocation {
  /**
   * The distance between the list top edge and the viewport top edge.
   * When the list is above the viewport (when scrolling down), this value is a negative number. When the list is scrolled to the top, this value is `0`.
   */
  listOffset: number
  /**
   * The height of the visible portion of the list without any headers and footers.
   */
  visibleListHeight: number
  /**
   * The scroll height of the scroller wrapper.
   */
  scrollHeight: number
  /**
   * The distance between the scroller element bottom edge and the viewport bottom edge.
   * If `0`, the list is at the bottom.
   */
  bottomOffset: number
  /**
   * A convenience flag that indicates whether the list is at the bottom. The flag is also true when the list is currently scrolling to the bottom.
   */
  isAtBottom: boolean
}

/**
 * A function that describes the easing curve for the scroll animation.
 * See {@link https://easings.net/ | easings.net} for examples of easing functions.
 *
 * @group Scroll Animation
 */
export type BezierFunction = (x: number) => number

/** @internal */
export type ComputeRowKey<Data = unknown, Context = unknown, Group = unknown> = (params: {
  data: Data | Group
  index: number
  context: Context
}) => React.Key

/**
 * The DOM attributes that you can pass to the `VirtuosoDataTable` component to customize the scroll element.
 *
 * @group Components
 * @noInheritDoc
 */
export type ScrollerProps = Omit<React.HTMLProps<HTMLDivElement>, 'ref' | 'data' | 'onScroll'>

/**
 * The properties accepted by the `VirtuosoDataTable` component.
 * In addition to the properties listed here, you can pass any other props that are accepted by a `div` element. They will be passed to the root div element used for the scroll.
 * @typeParam Data - The type of the data items in the table.
 * @typeParam Context - The type of the context passed to the table.
 *
 * @noInheritDoc
 * @group Components
 */
export interface VirtuosoDataTableProps<Data, Context, Group = unknown> extends ScrollerProps {
  /**
   * The data to display in the table.
   */
  data?: TableData<Data, Group>
  /**
   * An optional data model handle that provides data to the table through a message-exchange protocol.
   * When provided, the `data` prop is ignored and data flows through the model bridge instead.
   */
  model?: import('./model/types').DataModelHandle<Data | Group>
  /**
   * Any additional state that you need to use in the `ItemContent`, `EmptyPlaceholder`, etc.
   */
  context?: Context
  /**
   * The initial location to scroll to. It will be applied the first time the table is rendered with data.
   * Using this property allows you to skip rendering of the items at the top of the table.
   */
  initialLocation?: RowLocation
  /**
   * Computes the value for the React `key` prop for the item at the specified index. Use stable, unique keys to avoid rendering issues.
   * @param params - The parameters to compute the key.
   */
  computeRowKey?: NoInfer<(params: { data: Data | Group; index: number; context: Context }) => React.Key>

  /**
   * An optional React component to render when the table has zero data items.
   */
  EmptyPlaceholder?: NoInfer<ContextAwareComponent<Context>>
  /**
   * An optional React component to replace the default scroller element. The default value is a `div` element.
   */
  ScrollElement?: NoInfer<ScrollElementComponent<Context>>
  /**
   * A callback that's invoked when the table is scrolled. See {@link ListScrollLocation} for the details of the parameter received.
   */
  onScroll?: (location: ListScrollLocation) => void
  /**
   * A callback that's invoked when the currently visible items change
   */
  onRenderedDataChange?: (range: Data[]) => void

  /**
   * Set to true to make the table use the document scroller rather than wrapping in its own.
   */
  useWindowScroll?: boolean

  /**
   * Pass an HTML element to use as the scroll element. This is useful when you want to include additional content in the scrollable area, or if you want to use a complex custom scroll component.
   */
  customScrollParent?: HTMLElement | undefined | null

  /**
   * Artificially extends the viewport size in both directions, causing more items to be rendered.
   * Useful if you have relatively heavy items or want images to be loaded before the user scrolls to them.
   * For example, setting the value to `100` would increase the viewport in both directions by `100` pixels, causing more items to be rendered.
   */
  increaseViewportBy?: number

  /**
   * The number of extra columns to render on each side of the visible columns. Useful for smooth horizontal scrolling.
   * Defaults to 0 (no overscan).
   */
  columnOverscanCount?: number

  /**
   * Any children passed to the component.
   */
  children?: React.ReactNode
}

/**
 * The imperative API of the data table component. You can access it with a `ref`, or by using the {@link useVirtuosoMethods | `useVirtuosoMethods()`} hook from a child component.
 * @typeParam Data - The type of the data items in the table.
 *
 * @group Imperative API
 */
export interface VirtuosoDataTableMethods<Data = any> {
  /**
   * Scrolls the table to the specified row. See {@link RowLocation} for possible location details. Passing a number scrolls to the row at the specified index aligned to the top.
   */
  scrollToRow: (location: RowLocation) => void
  /**
   * Scrolls the specified row into view if necessary. See {@link RowLocation} for possible location details. Passing a number scrolls to the row at the specified index.
   */
  scrollIntoView: (location: RowLocation) => void
  /**
   * Lets you obtain a reference to the component's scroller DOM element.
   */
  scrollerElement: () => HTMLDivElement | null
  /**
   * Retrieves the current scroll location
   */
  getScrollLocation: () => ListScrollLocation
  /**
   * Cancels the current smooth scroll operation, if any.
   */
  cancelSmoothScroll: () => void
  /**
   * Gets the known height of the item.
   */
  height: (item: Data) => number
}
