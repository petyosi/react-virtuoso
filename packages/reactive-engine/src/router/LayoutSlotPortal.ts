import type * as React from 'react'

import { Cell } from '../nodes'

/**
 * Creates a layout slot portal cell for passing content between LayoutSlotFill and LayoutSlot components.
 *
 * @example
 * ```tsx
 * import { LayoutSlotPortal, LayoutSlot, LayoutSlotFill } from '@virtuoso.dev/reactive-engine'
 *
 * const sideNav$ = LayoutSlotPortal()
 *
 * // In a layout component:
 * <LayoutSlot slotPortal={sideNav$}>Default content</LayoutSlot>
 *
 * // In a route component:
 * <LayoutSlotFill slotPortal={sideNav$}>
 *   <nav>Custom navigation</nav>
 * </LayoutSlotFill>
 * ```
 *
 * @category Router
 */
export function LayoutSlotPortal() {
  return Cell<React.ReactNode>(null)
}
