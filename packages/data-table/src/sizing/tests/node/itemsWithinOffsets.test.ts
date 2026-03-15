import { describe, expect, it } from 'vitest'

import { itemsWithinOffsets } from '../../itemsWithinOffsets'
import { rangesWithinOffsets } from '../../rangesWithinOffsets'

describe('empty offset tree', () => {
  it('rangesWithinOffsets returns empty array for empty tree', () => {
    expect(rangesWithinOffsets([], 0, 500)).toStrictEqual([])
  })

  it('itemsWithinOffsets returns empty result for empty tree', () => {
    const result = itemsWithinOffsets([], 0, 500, 100, 0, null)
    expect(result.items).toStrictEqual([])
  })
})
