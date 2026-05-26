import { Cell, Stream } from '@virtuoso.dev/reactive-engine-core'

import type { RowLocation } from '../interfaces'

export const UP = 'up'
export const DOWN = 'down'
export const NONE = 'none'
export type ScrollDirection = typeof UP | typeof DOWN | typeof NONE

export const scrollDirection$ = Cell<ScrollDirection>(DOWN)
export const lastJumpDueToRowResize$ = Cell<number>(0)

export const pendingScrollToInitialLocation$ = Cell<RowLocation | null>(null)
export const initialLocation$ = Cell<RowLocation | null>(null, false)
/**
 * @group Remote Control
 */
export const scrollToRow$ = Stream<RowLocation>()
/**
 * @group Remote Control
 */
export const scrollIntoView$ = Stream<RowLocation>()

export const mobileSafariIsReadjusting$ = Cell(false)
export const deviationDelta$ = Stream<number>()

const DEFAULT_AT_BOTTOM_THRESHOLD = 4

export const atBottomThreshold$ = Cell(DEFAULT_AT_BOTTOM_THRESHOLD)
export const isScrollingToBottom$ = Cell(false)
