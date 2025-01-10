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
export type Data<Item = unknown> = Item[]

/**
 * Used for the custom components that accept the message list context prop.
 */
// biome-ignore lint/suspicious/noExplicitAny: why
export type ContextAwareComponent<Context = any> = React.ComponentType<{
  /**
   * The value currently passed to the `context` prop of the `VirtuosoMessageList` component.
   */
  context: Context
}>

/** @internal */
export type ComputeItemKey<Data = unknown, Context = unknown> = (params: { data: Data; index: number; context: Context }) => React.Key

/**
 * The DOM attributes that you can pass to the `VirtualMessageList` component to customize the scroll element.
 * @noInheritDoc
 */
export type ScrollerProps = Omit<React.HTMLProps<HTMLDivElement>, 'ref' | 'data' | 'onScroll'>

/**
 * A React component that's used to render the individual item.
 */
// biome-ignore lint/suspicious/noExplicitAny: why
export type ItemContent<Data = any, Context = any> = React.ComponentType<{
  /**
   * The index of the item in the list data array.
   */
  index: number
  /**
   * The data item to render.
   */
  data: Data
  /**
   * The value of the `context` prop passed to the list.
   */
  context: Context
}>
