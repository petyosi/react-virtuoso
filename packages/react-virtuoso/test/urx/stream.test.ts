import { subscribe, stream, publish } from '../../src/urx'
import { describe, it, expect, vi } from 'vitest'

describe('stream', () => {
  it('creates a next / subscribe function', () => {
    const foo = stream<number>()
    const callback = vi.fn()
    subscribe(foo, callback)
    publish(foo, 4)
    expect(callback).toHaveBeenCalledWith(4)
  })
})
