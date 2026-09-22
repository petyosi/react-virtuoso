import { describe, expect, it } from 'vitest'

import { findMaxKeyValue } from '../../../sizing/AATree'
import { EMPTY_SIZE_STATE, updateSizeState } from '../../../sizing/SizeState'
import { accumulateSizeRange } from '../../accumulate-size-range'

import type { SizeRange } from '../../../interfaces'

function rowElement(index: number, knownSize: number, group: boolean): HTMLElement {
  const dataset = { index: String(index), knownSize: String(knownSize) }
  if (group) {
    Object.assign(dataset, { groupRow: '' })
  }
  return { dataset } as unknown as HTMLElement
}

describe(accumulateSizeRange, () => {
  it('skips unchanged ordinary rows', () => {
    const ranges: SizeRange[] = []

    accumulateSizeRange(ranges, rowElement(2, 44, false), 44)

    expect(ranges).toStrictEqual([])
  })

  it('retains authoritative group sizes after grouped data changes', () => {
    const actualSizes = [36, 36, 44, 36, 36, 44]
    const groupIndices = new Set([0, 1, 3, 4])
    const ranges: SizeRange[] = []

    for (const [index, size] of actualSizes.entries()) {
      accumulateSizeRange(ranges, rowElement(index, 36, groupIndices.has(index)), size)
    }

    expect(ranges).toStrictEqual([
      { startIndex: 0, endIndex: 1, size: 36 },
      { startIndex: 2, endIndex: 2, size: 44 },
      { startIndex: 3, endIndex: 4, size: 36 },
      { startIndex: 5, endIndex: 5, size: 44 },
    ])

    const state = updateSizeState({ ...EMPTY_SIZE_STATE, lastSize: 44 }, ranges, groupIndices)
    expect(actualSizes.map((_, index) => findMaxKeyValue(state.sizeTree, index)[1])).toStrictEqual(actualSizes)
  })
})
