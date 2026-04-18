import { Cell } from '@virtuoso.dev/reactive-engine-core'

import type { DataTableLoadingState, DataTableLoadingStatus } from '../interfaces'

function createSegment(status: DataTableLoadingStatus = 'idle', errorMessage: string | null = null) {
  return { status, errorMessage }
}

export const EMPTY_LOADING_STATE: DataTableLoadingState = {
  initial: createSegment(),
  refresh: createSegment(),
  start: createSegment(),
  end: createSegment(),
}

export const loadingState$ = Cell<DataTableLoadingState>(EMPTY_LOADING_STATE)
