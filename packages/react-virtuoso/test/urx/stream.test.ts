import { describe, expect, it, vi } from 'vitest'

import { publish, stream, subscribe } from '../../src/urx'

describe('stream', () => {
  it('creates a next / subscribe function', () => {
    const foo = stream<number>()
    const callback = vi.fn()
    subscribe(foo, callback)
    publish(foo, 4)
    expect(callback).toHaveBeenCalledWith(4)
  })
})
