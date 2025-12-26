import type * as React from 'react'

import type { NodeRef } from '../types'

import { useCellValue } from '../hooks'

/**
 * Props for the LayoutSlot component
 */
export interface LayoutSlotProps {
  /**
   * Optional default content to render when no LayoutSlotFill provides content
   */
  children?: React.ReactNode
  /**
   * The slot portal to render content from
   */
  slotPortal: NodeRef<React.ReactNode>
}

/**
 * Renders content from a LayoutSlotFill component. If no fill is provided,
 * renders the optional default children content.
 *
 * The LayoutSlot subscribes to the slotPortal cell and re-renders when the
 * content changes.
 *
 * @example
 * ```tsx
 * import { LayoutSlotPortal, LayoutSlot } from '@virtuoso.dev/reactive-engine'
 *
 * const sideNav$ = LayoutSlotPortal()
 *
 * function MyLayout({ children }) {
 *   return (
 *     <div>
 *       <aside>
 *         <LayoutSlot slotPortal={sideNav$}>
 *           <nav>Default navigation</nav>
 *         </LayoutSlot>
 *       </aside>
 *       <main>{children}</main>
 *     </div>
 *   )
 * }
 * ```
 *
 * @category Router
 */
export const LayoutSlot: React.FC<LayoutSlotProps> = ({ children, slotPortal }) => {
  const content = useCellValue(slotPortal)
  return (content ?? children ?? null) as React.ReactElement
}
