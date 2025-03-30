/** @internal */
export interface OffsetPoint {
  height: number
  index: number
  offset: number
}

/** @internal */
export interface SizeRange {
  endIndex: number
  size: number
  startIndex: number
}

/** @internal */
export type Data<Item = unknown> = Item[]

/**
 * Used for the custom components that accept the masonry context prop.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContextAwareComponent<Context = any> = React.ComponentType<{
  /**
   * The value currently passed to the `context` prop of the `VirtuosoMasonry` component.
   */
  context: Context
}>

/** @internal */
export type ComputeItemKey<Data = unknown, Context = unknown> = (params: { context: Context; data: Data; index: number }) => React.Key

/**
 * The DOM attributes that you can pass to the `VirtuosoMasonry` component to customize the scroll element.
 * @noInheritDoc
 */
export type ScrollerProps = Omit<React.HTMLProps<HTMLDivElement>, 'data' | 'onScroll' | 'ref'>

/**
 * A React component that's used to render the individual item.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ItemContent<Data = any, Context = any> = React.ComponentType<{
  /**
   * The value of the `context` prop passed to the list.
   */
  context: Context
  /**
   * The data item to render.
   */
  data: Data
  /**
   * The index of the item in the list data array.
   */
  index: number
}>
