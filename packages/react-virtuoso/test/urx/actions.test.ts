import { map, handleNext, statefulStream, connect, pipe, publish, subscribe, stream } from '../../src/urx'
import { describe, it, expect, vi } from 'vitest'

describe('connect', () => {
  it('subscribes a publisher to the emitter', () => {
    const a = stream<number>()
    const b = stream<number>()

    connect(a, b)
    const sub = vi.fn()
    subscribe(b, sub)
    publish(a, 4)

    expect(sub).toHaveBeenCalledWith(4)
  })

  it('subscribes a publisher to the emitter (map)', () => {
    const a = statefulStream(0)
    const b = statefulStream(0)
    const sub = vi.fn()
    subscribe(b, sub)

    connect(
      pipe(
        a,
        map((val) => val * 2)
      ),
      b
    )

    publish(a, 2)
    expect(sub).toHaveBeenCalledWith(4)
  })

  it('handleNext unsub is indempotent', () => {
    const a = stream()

    const sub = vi.fn()

    const unsub = handleNext(a, (value) => {
      expect(value).toEqual('foo')
    })

    subscribe(a, sub)

    publish(a, 'foo')

    unsub()
    publish(a, 'bar')
    expect(sub).toHaveBeenCalledWith('bar')
  })
})
