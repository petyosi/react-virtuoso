import { describe, expect, it, vi } from 'vitest'

import { combineLatest, publish, statefulStream, stream, subscribe } from '../../src/urx'

describe('combine latest', () => {
  it('combines the provided streams', () => {
    const foo = statefulStream('foo')
    const bar = statefulStream('bar')

    const spy = vi.fn()
    subscribe(combineLatest(foo, bar), spy)

    expect(spy).toHaveBeenCalledWith(['foo', 'bar'])
  })

  it('works with streams', () => {
    const foo = statefulStream('foo')
    const bar = stream<string>()

    const spy = vi.fn()
    subscribe(combineLatest(foo, bar), spy)
    publish(bar, 'bar')
    expect(spy).toHaveBeenCalledWith(['foo', 'bar'])

    publish(foo, 'baz')
    expect(spy).toHaveBeenCalledWith(['baz', 'bar'])
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
