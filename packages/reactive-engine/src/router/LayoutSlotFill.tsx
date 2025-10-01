import type * as React from 'react'

import type { NodeRef } from '../types'

import { useIsomorphicLayoutEffect, usePublisher } from '../react'

/**
 * Props for the LayoutSlotFill component
 */
export interface LayoutSlotFillProps {
  /**
   * The content to render in the slot
   */
  children: React.ReactNode
  /**
   * The slot portal to fill with content
   */
  slotPortal: NodeRef<React.ReactNode>
}

/**
 * Provides content for a LayoutSlot. The content is published to the slotPortal cell
 * and will be rendered by the corresponding LayoutSlot component.
 *
 * When unmounted, the LayoutSlotFill clears the slot content to prevent stale content.
 *
 * If multiple LayoutSlotFill components target the same slotPortal, the last one wins.
 *
 * @example
 * ```tsx
 * import { LayoutSlotPortal, LayoutSlotFill } from '@virtuoso.dev/reactive-engine'
 *
 * const sideNav$ = LayoutSlotPortal()
 *
 * function MyRoute() {
 *   return (
 *     <>
 *       <LayoutSlotFill slotPortal={sideNav$}>
 *         <nav>Custom navigation</nav>
 *       </LayoutSlotFill>
 *       <div>Route content</div>
 *     </>
 *   )
 * }
 * ```
 *
 * @category Router
 */
export const LayoutSlotFill: React.FC<LayoutSlotFillProps> = ({ children, slotPortal }) => {
  const publish = usePublisher(slotPortal)

  useIsomorphicLayoutEffect(() => {
    publish(children)
    return () => {
      publish(null)
    }
  }, [children, publish])

  return null
}
