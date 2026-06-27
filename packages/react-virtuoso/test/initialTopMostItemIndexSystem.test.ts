import { describe, expect, it } from 'vitest'

import { getInitialTopMostItemIndexNumber } from '../src/initialTopMostItemIndexSystem'

describe('getInitialTopMostItemIndexNumber', () => {
  const totalCount = 50
  const lastIndex = totalCount - 1

  it('returns zero for an undefined location', () => {
    expect(getInitialTopMostItemIndexNumber(undefined, totalCount)).toBe(0)
  })

  it('clamps an out-of-range numeric index down to the last index', () => {
    expect(getInitialTopMostItemIndexNumber(200, totalCount)).toBe(lastIndex)
  })

  it('clamps an out-of-range location index down to the last index', () => {
    expect(getInitialTopMostItemIndexNumber({ index: 200 }, totalCount)).toBe(lastIndex)
  })

  it('clamps a negative index up to zero', () => {
    expect(getInitialTopMostItemIndexNumber(-5, totalCount)).toBe(0)
    expect(getInitialTopMostItemIndexNumber({ index: -5 }, totalCount)).toBe(0)
  })

  it('returns an in-range index unchanged', () => {
    expect(getInitialTopMostItemIndexNumber(20, totalCount)).toBe(20)
    expect(getInitialTopMostItemIndexNumber({ index: 20 }, totalCount)).toBe(20)
  })

  it("resolves 'LAST' to the last index", () => {
    expect(getInitialTopMostItemIndexNumber({ index: 'LAST' }, totalCount)).toBe(lastIndex)
  })

  it('clamps to zero for an empty list', () => {
    expect(getInitialTopMostItemIndexNumber({ index: 5 }, 0)).toBe(0)
  })
})
