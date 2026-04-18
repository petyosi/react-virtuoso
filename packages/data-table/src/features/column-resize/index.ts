// oxlint-disable require-hook
import { Stream, Trigger, e } from '@virtuoso.dev/reactive-engine-core'

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

export interface ClearColumnWidthOverridePayload {
  key: string
}

/**
 * Remote action that resizes a column.
 *
 * @group Remote Control
 */
export const resizeColumn$ = Stream<ResizeColumnPayload>()

/**
 * Remote action that clears a single column width override.
 *
 * @group Remote Control
 */
export const clearColumnWidthOverride$ = Stream<ClearColumnWidthOverridePayload>()

/**
 * Remote action that clears all stored column width overrides.
 *
 * @group Remote Control
 */
export const resetColumnWidthOverrides$ = Trigger()

e.changeWith(columnWidthOverrides$, resizeColumn$, (overrides, { key, width }) => {
  const next = new Map(overrides)
  // oxlint-disable-next-line no-immediate-mutation
  next.set(key, width)
  return next
})

e.changeWith(columnWidthOverrides$, clearColumnWidthOverride$, (overrides, { key }) => {
  if (!overrides.has(key)) {
    return overrides
  }

  const next = new Map(overrides)
  next.delete(key)
  return next
})

e.changeWith(columnWidthOverrides$, resetColumnWidthOverrides$, (overrides) => {
  return overrides.size === 0 ? overrides : new Map<string, number>()
})
