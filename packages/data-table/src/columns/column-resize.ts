// oxlint-disable require-hook
import { Cell, e, Stream } from '@virtuoso.dev/reactive-engine-core'

/**
 * @group Remote Control
 */
export interface ResizeColumnPayload {
  key: string
  width: number
}

/**
 * @group Remote Control
 */
export const resizeColumn$ = Stream<ResizeColumnPayload>()

/**
 * @group Remote Control
 */
export const columnWidthOverrides$ = Cell<Map<string, number>>(new Map())

e.changeWith(columnWidthOverrides$, resizeColumn$, (overrides, { key, width }) => {
  const next = new Map(overrides)
  // oxlint-disable-next-line no-immediate-mutation
  next.set(key, width)
  return next
})
