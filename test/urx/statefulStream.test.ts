import { getValue, statefulStream, subscribe } from '../../src/urx'
import { describe, it, expect, vi } from 'vitest'

describe('behavior stream', () => {
  it('creates a next / subscribe function', () => {
    const foo = statefulStream(5)
    const callback = vi.fn()
    subscribe(foo, callback)
    expect(callback).toHaveBeenCalledWith(5)
  })

  it('extracts the value from a stream', () => {
    const foo = statefulStream(5)
    const value = getValue(foo)
    expect(value).toBe(5)
  })
})
