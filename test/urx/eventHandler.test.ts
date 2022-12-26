import { eventHandler, publish, reset, stream, subscribe, statefulStream } from '../../src/urx'
import { describe, it, expect, vi } from 'vitest'

describe('event handler', () => {
  it('creates a single handler subscriber for a stream', () => {
    const str = stream<number>()
    const handler = eventHandler(str)
    const handle1 = vi.fn()
    const handle2 = vi.fn()
    subscribe(handler, handle1)
    publish(str, 10)
    expect(handle1).toHaveBeenCalledWith(10)
    subscribe(handler, handle2)
    publish(str, 20)
    expect(handle2).toHaveBeenCalledWith(20)
    expect(handle1).toHaveBeenCalledTimes(1)
  })

  it('unsubscribes the handle when reset', () => {
    const str = stream<number>()
    const handler = eventHandler(str)
    const handle1 = vi.fn()
    subscribe(handler, handle1)
    publish(str, 10)
    reset(handler)
    publish(str, 20)
    expect(handle1).toHaveBeenCalledTimes(1)
  })

  it.only('unsubscribes the handle when reset', () => {
    const str = statefulStream(1)
    const handler = eventHandler(str)
    const handle = vi.fn()
    subscribe(handler, handle)
    subscribe(handler, handle)
    expect(handle).toHaveBeenCalledTimes(1)
  })

  it('accepts nullish handle as unsubscribe', () => {
    const str = stream<number>()
    const handler = eventHandler(str)
    const handle1 = vi.fn()
    subscribe(handler, handle1)
    publish(str, 10)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    subscribe(handler, undefined as unknown as any)
    publish(str, 20)
    expect(handle1).toHaveBeenCalledTimes(1)
  })
})
