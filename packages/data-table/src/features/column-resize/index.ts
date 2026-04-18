// oxlint-disable require-hook
import { Stream, e } from '@virtuoso.dev/reactive-engine-core'

import { columnWidthOverrides$ } from '../../columns/column-width-overrides'

/**
 * Payload for changing a column width override.
 *
 * @group Remote Control
 */
export interface ResizeColumnPayload {
  key: string
  width: number
}

/**
 * Remote action that resizes a column.
 *
 * @group Remote Control
 */
export const resizeColumn$ = Stream<ResizeColumnPayload>()

e.changeWith(columnWidthOverrides$, resizeColumn$, (overrides, { key, width }) => {
  const next = new Map(overrides)
  // oxlint-disable-next-line no-immediate-mutation
  next.set(key, width)
  return next
})
