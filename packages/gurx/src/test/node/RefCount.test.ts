import { describe, expect, it, vi } from 'vitest'
import { RefCount } from '../../RefCount'

describe('ref counter', () => {
  it('increments by one', () => {
    const counter = new RefCount()
    const key = Symbol()
    counter.increment(key)
    expect(counter.map.get(key)).toEqual(1)
    counter.increment(key)
    expect(counter.map.get(key)).toEqual(2)
  })

  it('decrements by one', () => {
    const cb = vi.fn()
    const counter = new RefCount()
    const key = Symbol()
    counter.increment(key)
    expect(counter.map.get(key)).toEqual(1)
    counter.increment(key)
    expect(counter.map.get(key)).toEqual(2)
    counter.decrement(key, cb)
    expect(counter.map.get(key)).toEqual(1)
    counter.decrement(key, cb)
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
