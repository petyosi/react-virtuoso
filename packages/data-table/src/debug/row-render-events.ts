import { Cell, Stream } from '@virtuoso.dev/reactive-engine-core'

/**
 * Enables emission of unstable row render instrumentation events.
 * Disabled by default to avoid paying the per-row event cost unless debugging.
 *
 * @group Debugging
 */
export const unstableEnableRowRenderEvents$ = Cell(false)

/**
 * Fired after a row commit when unstable row render instrumentation is enabled.
 *
 * @group Debugging
 */
export type UnstableRowRenderSection = 'row' | 'scrollable' | 'sticky-left' | 'sticky-right'

/**
 * Fired after a row commit when unstable row render instrumentation is enabled.
 *
 * @group Debugging
 */
export interface UnstableRowRenderEvent {
  index: number
  sticky: boolean
  group: boolean
  section: UnstableRowRenderSection
}

/**
 * Stream of unstable row render instrumentation events.
 *
 * @group Debugging
 */
export const unstableRowRender$ = Stream<UnstableRowRenderEvent>()
