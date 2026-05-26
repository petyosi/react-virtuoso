import { Cell } from '@virtuoso.dev/reactive-engine-core'

import type { ComputeRowKey } from '../interfaces'

export const defaultComputeRowKey: ComputeRowKey = ({ index }) => index

export const computeRowKey$ = Cell(defaultComputeRowKey)
