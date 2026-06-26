import { describe, expect, it } from 'vitest'

import { initialTopMostItemIndexIsZero } from '../src/initialTopMostItemIndexSystem'

describe('initialTopMostItemIndexIsZero', () => {
  it('treats the numeric 0 as zero', () => {
    expect(initialTopMostItemIndexIsZero(0)).toBe(true)
  })

  it('treats { index: 0 } the same as the numeric 0', () => {
    expect(initialTopMostItemIndexIsZero({ index: 0 })).toBe(true)
    expect(initialTopMostItemIndexIsZero({ align: 'start', index: 0 })).toBe(true)
    expect(initialTopMostItemIndexIsZero({ behavior: 'smooth', index: 0 })).toBe(true)
  })

  it('does not treat zero index locations with explicit positioning as zero', () => {
    expect(initialTopMostItemIndexIsZero({ align: 'center', index: 0 })).toBe(false)
    expect(initialTopMostItemIndexIsZero({ align: 'end', index: 0 })).toBe(false)
    expect(initialTopMostItemIndexIsZero({ index: 0, offset: 40 })).toBe(false)
  })

  it('reports a non-zero numeric index', () => {
    expect(initialTopMostItemIndexIsZero(5)).toBe(false)
  })

  it('reports a non-zero location index', () => {
    expect(initialTopMostItemIndexIsZero({ index: 5 })).toBe(false)
  })

  it("does not treat 'LAST' as zero", () => {
    expect(initialTopMostItemIndexIsZero({ index: 'LAST' })).toBe(false)
  })
})
