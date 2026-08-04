import { describe, expect, it, vi } from 'vitest'

import { Engine, equalArrays, equalBy, equalNullable, Stream } from './index'

describe('comparator helpers', () => {
  it('equalBy compares only selected fields after the first candidate', () => {
    const equal = equalBy<{ disabled: boolean; durationMs: number; label: string }>(
      (value) => value.disabled,
      (value) => value.durationMs
    )
    const first = { disabled: false, durationMs: 100, label: 'first' }

    expect(equal(undefined, first)).toBe(false)
    expect(equal(first, { ...first, label: 'ignored' })).toBe(true)
    expect(equal(first, { ...first, durationMs: 200 })).toBe(false)
  })

  it('equalBy accepts the first value of a distinct stream', () => {
    const stream$ = Stream(equalBy<{ optional?: string }>((value) => value.optional))
    const values: { optional?: string }[] = []
    const engine = new Engine()
    engine.sub(stream$, (value) => values.push(value))

    engine.pub(stream$, {})

    expect(values).toEqual([{}])
  })

  it('equalNullable handles identity and null before using the domain comparator', () => {
    const domainEqual = vi.fn((left: { id: number }, right: { id: number }) => left.id === right.id)
    const equal = equalNullable(domainEqual)
    const value = { id: 1 }

    expect(equal(undefined, null)).toBe(false)
    expect(equal(null, null)).toBe(true)
    expect(equal(null, value)).toBe(false)
    expect(equal(value, value)).toBe(true)
    expect(domainEqual).not.toHaveBeenCalled()
    expect(equal(value, { id: 1 })).toBe(true)
    expect(equal(value, { id: 2 })).toBe(false)
    expect(domainEqual).toHaveBeenCalledTimes(2)
  })

  it('equalArrays distinguishes absence, length, order, and Object.is values', () => {
    expect(equalArrays(undefined, undefined)).toBe(true)
    expect(equalArrays(undefined, [])).toBe(false)
    expect(equalArrays([], [])).toBe(true)
    expect(equalArrays([1], [1, 2])).toBe(false)
    expect(equalArrays([1, 2], [2, 1])).toBe(false)
    expect(equalArrays([Number.NaN], [Number.NaN])).toBe(true)
  })

  it('equalArrays accepts a domain item comparator', () => {
    const itemEqual = (left: { id: number }, right: { id: number }) => left.id === right.id

    expect(equalArrays([{ id: 1 }], [{ id: 1 }], itemEqual)).toBe(true)
    expect(equalArrays([{ id: 1 }], [{ id: 2 }], itemEqual)).toBe(false)
  })
})
