// oxlint-disable require-hook
import { Cell, e, Stream } from '@virtuoso.dev/reactive-engine-core'

export interface ResizeColumnPayload {
  key: string
  width: number
}

export const resizeColumn$ = Stream<ResizeColumnPayload>()

export const columnWidthOverrides$ = Cell<Map<string, number>>(new Map())

e.changeWith(columnWidthOverrides$, resizeColumn$, (overrides, { key, width }) => {
  const next = new Map(overrides)
  // oxlint-disable-next-line no-immediate-mutation
  next.set(key, width)
  return next
})
