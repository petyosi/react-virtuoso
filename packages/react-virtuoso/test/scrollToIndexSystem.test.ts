import { describe, expect, it } from 'vitest'

import { normalizeIndexLocation } from '../src/scrollToIndexSystem'

describe('normalizeIndexLocation', () => {
  it('does not mutate the passed location object', () => {
    const location = { index: 5 }
    normalizeIndexLocation(location)
    expect(location).toEqual({ index: 5 })
  })

  it('returns a new object with the defaults applied', () => {
    const location = { index: 5 }
    const result = normalizeIndexLocation(location)
    expect(result).not.toBe(location)
    expect(result).toEqual({ align: 'start', behavior: 'auto', index: 5, offset: 0 })
  })

  it('preserves explicitly provided fields', () => {
    const result = normalizeIndexLocation({ align: 'center', index: 2, offset: 10 })
    expect(result.align).toBe('center')
    expect(result.offset).toBe(10)
    expect(result.index).toBe(2)
  })

  it('wraps a numeric location into an object with defaults', () => {
    expect(normalizeIndexLocation(7)).toEqual({ align: 'start', behavior: 'auto', index: 7, offset: 0 })
  })
})
