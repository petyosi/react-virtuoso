// oxlint-disable require-hook
import { Cell } from '@virtuoso.dev/reactive-engine-core'

/**
 * @group Remote Control
 */
export const columnWidthOverrides$ = Cell<Map<string, number>>(new Map())
