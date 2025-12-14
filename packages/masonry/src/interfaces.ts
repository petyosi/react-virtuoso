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
 * The DOM attributes that you can pass to the `VirtuosoMasonry` component to customize the scroll element.
 * @group VirtuosoMasonry
 */
export type ScrollerProps = Omit<React.HTMLProps<HTMLDivElement>, 'data' | 'onScroll' | 'ref'>

/**
 * A React component that's used to render the individual masonry item.
 * @typeParam Data - The type of items in the data array.
 * @typeParam Context - Optional contextual data passed from the parent component.
 * @group VirtuosoMasonry
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ItemContent<Data = any, Context = any> = React.ComponentType<{
  /**
   * The value of the `context` prop passed to the masonry.
   */
  context: Context
  /**
   * The data item to render.
   */
  data: Data
  /**
   * The index of the item in the data array.
   */
  index: number
}>
