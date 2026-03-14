import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it } from 'vitest'

import { ranges$, sizeState$, totalHeight$ } from '../../../resize/sizes'
import { data$, totalCount$ } from '../../data'

const HUNDRED_ITEMS = Array.from({ length: 100 }, (_, i) => i)
describe('data logic', () => {
  let e!: Engine
  beforeEach(() => {
    e = new Engine()
    e.register(sizeState$)
    e.register(totalHeight$)
    e.register(data$)
    e.register(totalCount$)
  })

  it('pushing into the ranges builds the size/offset tree', () => {
    e.pub(data$, HUNDRED_ITEMS)
    e.pub(ranges$, [
      {
        size: 20,
        startIndex: 0,
        endIndex: 0,
      },
    ])

    const sizeState = e.getValue(sizeState$)
    expect(sizeState.offsetTree).toMatchObject([{ size: 20, index: 0, offset: 0 }])
  })

  it('setting data updates totalCount', () => {
    e.pub(data$, HUNDRED_ITEMS)
    expect(e.getValue(totalCount$)).toBe(100)

    e.pub(data$, [...HUNDRED_ITEMS, 100, 101, 102])
    expect(e.getValue(totalCount$)).toBe(103)
  })

  it('data change resets per-index sizes but preserves default row size', () => {
    e.pub(data$, HUNDRED_ITEMS)
    e.pub(ranges$, [{ size: 30, startIndex: 0, endIndex: 0 }])

    const heightBefore = e.getValue(totalHeight$)
    expect(heightBefore).toBe(30 * 100)

    const sizeStateBefore = e.getValue(sizeState$)
    expect(sizeStateBefore.offsetTree.length).toBeGreaterThan(0)

    e.pub(
      data$,
      Array.from({ length: 102 }, (_, i) => i)
    )

    const sizeStateAfter = e.getValue(sizeState$)
    expect(sizeStateAfter.offsetTree).toHaveLength(0)

    const heightAfter = e.getValue(totalHeight$)
    expect(heightAfter).toBe(30 * 102)
  })
})
