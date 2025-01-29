import { merge, stream, publish, subscribe } from '../../src/urx'
import { describe, it, expect, vi } from 'vitest'

describe('merge', () => {
  it('emits values from both emitters', () => {
    const stream1 = stream<number>()
    const stream2 = stream<number>()
    const result = merge(stream1, stream2)
    const sub = vi.fn()
    subscribe(result, sub)
    publish(stream1, 1)
    expect(sub).toHaveBeenCalledWith(1)
    publish(stream2, 2)
    expect(sub).toHaveBeenCalledWith(2)
  })
  it('cancels subscriptions', () => {
    const stream1 = stream<number>()
    const stream2 = stream<number>()
    const result = merge(stream1, stream2)
    const sub = vi.fn()
    const unsub = subscribe(result, sub)
    publish(stream1, 1)
    expect(sub).toHaveBeenCalledWith(1)
    publish(stream2, 2)
    expect(sub).toHaveBeenCalledWith(2)
    unsub()
    publish(stream1, 3)
    publish(stream2, 4)
    expect(sub).toHaveBeenCalledTimes(2)
  })
})
