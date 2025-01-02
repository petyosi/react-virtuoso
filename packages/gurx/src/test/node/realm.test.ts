import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Action, Cell, DerivedCell, Realm, Signal, pipe } from '../..'
import { filter, handlePromise, map } from '../../operators'

describe('gurx cells/signals', () => {
  let r: Realm
  beforeEach(() => {
    r = new Realm()
  })

  it('registers cells so that their value is accessed', () => {
    const cell = Cell('hello')
    expect(r.getValue(cell)).toEqual('hello')
    r.pub(cell, 'world')
    expect(r.getValue(cell)).toEqual('world')
  })

  it('registers signals', () => {
    const signal = Signal<string>()
    const callback = vi.fn()
    r.sub(signal, callback)
    r.pub(signal, 'hello')
    expect(callback).toHaveBeenCalledWith('hello')
  })

  it('implicitly registers cells used with combine', () => {
    const foo = Cell('foo')
    const bar = Cell('bar')
    const fooBar = r.combine(foo, bar)

    const callback = vi.fn()
    r.sub(fooBar, callback)
    r.pub(foo, 'foo2')
    expect(callback).toHaveBeenCalledWith(['foo2', 'bar'])
  })

  it('accepts initial cell values', () => {
    const cell = Cell('foo')
    r = new Realm({ [cell]: 'bar' })
    expect(r.getValue(cell)).toEqual('bar')
  })

  it('supports init function for cells', () => {
    const a = Cell(2)
    const b = Cell(2, (r) => {
      r.link(b, a)
    })
    r.pub(b, 3)
    expect(r.getValue(a)).toEqual(3)
  })

  it('supports init function for signals', () => {
    const a = Cell(2)
    const b = Signal((r) => {
      r.link(b, a)
    })
    r.pub(b, 3)
    expect(r.getValue(a)).toEqual(3)
  })

  it('supports init function for actions', () => {
    const a = Cell(2)
    const b = Action((r) => {
      r.pub(a, 3)
    })
    r.pub(b)
    expect(r.getValue(a)).toEqual(3)
  })

  it('gets multiple values', () => {
    const a = Cell(2)
    const b = Cell('foo')
    const result = r.getValues([a, b])
    expectTypeOf(result).toMatchTypeOf<[number, string]>()
    expect(result).toEqual([2, 'foo'])
  })
})

describe('realm features', () => {
  let r: Realm

  beforeEach(() => {
    r = new Realm()
  })

  it('supports pub/sub', () => {
    const n = Signal()
    const spy = vi.fn()
    r.sub(n, spy)
    r.pub(n, 'foo')
    expect(spy).toHaveBeenCalledWith('foo')
  })

  it('supports undefined initial value', () => {
    const n = Cell<string | undefined>(undefined)
    const q = Cell(1)
    const tc = Cell<number>(0)
    r.link(
      r.pipe(
        r.combine(n, q),
        filter(([data]) => data !== undefined),
        map(([data]) => data?.length)
      ),
      tc
    )

    const spy = vi.fn()
    r.sub(tc, spy)
    r.pub(n, 'foo')
    expect(spy).toHaveBeenCalledWith(3)
  })

  it('connects nodes', () => {
    const a = Signal<number>()
    const b = Signal<number>()
    r.connect<[number]>({
      map: (done) => (value) => {
        done(value * 2)
      },
      sink: b,
      sources: [a],
    })

    const spy = vi.fn()
    r.sub(b, spy)
    r.pub(a, 2)
    expect(spy).toHaveBeenCalledWith(4)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('publishes once with diamond dependencies', () => {
    const a = Signal<number>()
    const b = Signal<number>()
    const c = Signal<number>()
    const d = Signal<number>()
    // const e = r.node<number>()

    r.connect<[number]>({
      map: (done) => (value) => {
        done(value * 2)
      },
      sink: b,
      sources: [a],
    })

    r.connect<[number]>({
      map: (done) => (value) => {
        done(value * 3)
      },
      sink: c,
      sources: [a],
    })

    r.connect<[number, number]>({
      map: (done) => (b, c) => {
        done(b + c)
      },
      sink: d,
      sources: [b, c],
    })

    const spy = vi.fn()
    r.sub(d, spy)
    r.pub(a, 2)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(10)
  })

  it('handles multiple conditional execution paths', () => {
    const a = Signal<number>()
    const b = Signal<number>()
    const c = Signal<number>()
    const d = Signal<number>()

    r.connect<[number]>({
      map: (done) => (value) => {
        if (value % 2 === 0) {
          done(value)
        }
      },
      sink: c,
      sources: [a],
    })

    r.connect<[number]>({
      map: (done) => (value) => {
        if (value % 2 === 0) {
          done(value)
        }
      },
      sink: c,
      sources: [b],
    })

    r.connect<[number]>({
      map: (done) => (value) => {
        done(value * 2)
      },
      sink: d,
      sources: [c],
    })

    const spy = vi.fn()
    r.sub(c, spy)
    const spy2 = vi.fn()
    r.sub(d, spy2)

    r.pubIn({
      [a]: 2,
      [b]: 3,
    })
    expect(spy).toHaveBeenCalledWith(2)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledWith(4)
    expect(spy2).toHaveBeenCalledTimes(1)

    r.pubIn({
      [a]: 3,
      [b]: 4,
    })
    expect(spy).toHaveBeenCalledWith(4)
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy2).toHaveBeenCalledWith(8)
    expect(spy2).toHaveBeenCalledTimes(2)
  })

  it('handles pull dependencies', () => {
    const a = Signal<number>()
    const b = Signal<number>()
    const c = Signal<number>()
    const d = Signal<number>()
    const e = Signal<number>()
    const f = Signal<number>()
    const g = Signal<number>()
    const h = Signal<number>()

    r.connect<[number]>({
      map: (done) => (value) => {
        done(value + 1)
      },
      sink: b,
      sources: [a],
    })

    r.connect<[number]>({
      map: (done) => (value) => {
        done(value + 1)
      },
      sink: c,
      sources: [b],
    })

    r.connect<[number]>({
      map: (done) => (value) => {
        done(value + 1)
      },
      sink: d,
      sources: [c],
    })

    r.connect<[number]>({
      map: (done) => (value) => {
        done(value + 1)
      },
      sink: e,
      sources: [d],
    })

    r.connect<[number, number]>({
      map: (done) => (a, e) => {
        done(a + e + 1)
      },
      pulls: [e],
      sink: f,
      sources: [a],
    })

    r.connect<[number]>({
      map: (done) => (value) => {
        done(value + 1)
      },
      sink: g,
      sources: [f],
    })

    r.connect<[number]>({
      map: (done) => (value) => {
        done(value + 1)
      },
      sink: h,
      sources: [g],
    })

    const spy = vi.fn()
    r.sub(f, spy)
    r.pub(a, 1)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(7)
  })

  it('supports conditional connections', () => {
    const a = Signal<number>()
    const b = Signal<number>()

    r.connect<[number]>({
      map: (done) => (value) => {
        if (value % 2 === 0) {
          done(value)
        }
      },
      sink: b,
      sources: [a],
    })

    const spy = vi.fn()
    r.sub(b, spy)
    r.pub(a, 1)
    r.pub(a, 2)
    r.pub(a, 3)
    r.pub(a, 4)

    expect(spy).toHaveBeenCalledWith(2)
    expect(spy).not.toHaveBeenCalledWith(3)
    expect(spy).not.toHaveBeenCalledWith(1)
    expect(spy).toHaveBeenCalledWith(4)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('canceled connection cancels further execution', () => {
    const a = Signal<number>()
    const b = Signal<number>()
    const c = Signal<number>()
    const d = Signal<number>()

    r.connect<[number]>({
      map: (done) => (value) => {
        if (value % 2 === 0) {
          done(value)
        }
      },
      sink: b,
      sources: [a],
    })

    r.connect({
      map: (done) => (value) => {
        done(value)
      },
      sink: c,
      sources: [b],
    })

    r.connect({
      map: (done) => (value) => {
        done(value)
      },
      sink: d,
      sources: [c],
    })

    const spy = vi.fn()
    r.sub(d, spy)
    r.pub(a, 1)
    r.pub(a, 2)
    r.pub(a, 3)
    r.pub(a, 4)

    expect(spy).toHaveBeenCalledWith(2)
    expect(spy).not.toHaveBeenCalledWith(3)
    expect(spy).not.toHaveBeenCalledWith(1)
    expect(spy).toHaveBeenCalledWith(4)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('supports publishing in multiple nodes with a single call', () => {
    const a = Signal<number>()
    const b = Signal<number>()
    const c = Signal<number>()

    r.connect<[number, number]>({
      map: (done) => (a, b) => {
        done(a + b)
      },
      sink: c,
      sources: [a, b],
    })

    const spy = vi.fn()
    r.sub(c, spy)
    r.pubIn({ [a]: 2, [b]: 3 })

    expect(spy).toHaveBeenCalledWith(5)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('pulls from stateful nodes', () => {
    const a = Cell('foo')
    const b = Signal()
    const c = Signal()

    r.connect<[number, number]>({
      map: (done) => (b, a) => {
        done(a + b)
      },
      pulls: [a],
      sink: c,
      sources: [b],
    })

    const spy = vi.fn()
    r.sub(c, spy)
    r.pub(b, 'bar')
    expect(spy).toHaveBeenCalledWith('foobar')
  })

  it('does not recall subscriptions for distinct stateful nodes', () => {
    const a = Cell('foo')
    const spy = vi.fn()
    r.sub(a, spy)
    r.pub(a, 'foo')

    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('does not recall subscriptions for distinct stateful child nodes', () => {
    const a = Cell('bar')
    const b = Cell('foo')
    const spy = vi.fn()
    r.connect({
      map: (value) => value,
      sink: b,
      sources: [a],
    })
    r.sub(b, spy)
    r.pub(a, 'foo')
    r.pub(a, 'foo')

    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('supports custom comparator when distinct flag is set', () => {
    const a = Cell(
      { id: 'foo' },
      () => {
        // noop
      },
      (current, next) => (current !== undefined ? current.id === next.id : false)
    )
    const spy = vi.fn()
    r.sub(a, spy)
    r.pub(a, { id: 'foo' })

    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('supports subscribing to multiple nodes', () => {
    const a = Cell('bar')
    const b = Cell('foo')
    const spy = vi.fn()
    r.connect({
      map: (value) => value,
      sink: b,
      sources: [a],
    })

    r.subMultiple([a, b], spy)

    r.pubIn({
      [a]: 'qux',
      [b]: 'mu',
    })

    expect(spy).toHaveBeenCalledWith(['qux', 'mu'])
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('pubs subscription for multiple keys when one is updated', () => {
    const a = Cell('1')
    const b = Cell('2')
    const spy = vi.fn()
    r.subMultiple([a, b], spy)
    r.pub(a, '2')
    expect(spy).toHaveBeenCalledWith(['2', '2'])
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('singleton subscription', () => {
  it('calls the subscription', () => {
    const r = new Realm()
    const a = Signal<number>()
    const spy1 = vi.fn()
    r.singletonSub(a, spy1)
    r.pub(a, 2)
    expect(spy1).toHaveBeenCalledWith(2)
  })

  it('replaces the subscription', () => {
    const r = new Realm()
    const a = Signal<number>()
    const spy1 = vi.fn()
    const spy2 = vi.fn()
    r.singletonSub(a, spy1)
    r.pub(a, 2)
    r.singletonSub(a, spy2)
    r.pub(a, 3)
    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledTimes(1)
  })

  it('returns an unsubscribe handler', () => {
    const r = new Realm()
    const a = Signal<number>()
    const spy1 = vi.fn()
    const unsub = r.singletonSub(a, spy1)
    r.pub(a, 2)
    unsub()
    r.pub(a, 3)
    expect(spy1).toHaveBeenCalledTimes(1)
  })

  it('supports changing a cell value', () => {
    const r = new Realm()
    const a = Cell(1)
    const b = Signal<number>()

    r.changeWith(a, b, (a, b) => a + b)
    r.pub(b, 2)
    expect(r.getValue(a)).toEqual(3)
    r.pub(b, 2)
    expect(r.getValue(a)).toEqual(5)
  })

  it('supports creating transformer nodes', () => {
    const r = new Realm()
    const a = Cell('foo')
    const s = Signal<number>()
    const b = r.transformer(
      map((x: number) => x + 1),
      map((x) => `foo${x}`)
    )

    r.link(s, b(a))
    r.pub(s, 2)
    expect(r.getValue(a)).toEqual('foo3')
  })

  it('supports promise resolution', async () => {
    const r = new Realm()
    const a = Cell<'loading' | 'loaded' | 'error' | 'none'>('none')
    const s = Signal<number>()

    r.link(
      r.pipe(
        s,
        map(async (val) => {
          return await new Promise<string>((resolve, reject) => {
            if (val === 2) {
              resolve('loaded')
            } else {
              reject(new Error('something went wrong'))
            }
          })
        }),
        handlePromise(
          () => 'loading',
          (value) => value,
          (error) => error
        )
      ),
      a
    )

    r.pub(s, 2)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(r.getValue(a)).toEqual('loaded')

    r.pub(s, 3)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(r.getValue(a)).toMatchObject(new Error('something went wrong'))
  })
})

describe('Derived cell', () => {
  it('creates a derived cell', () => {
    const foo$ = Cell('foo')
    const bar$ = DerivedCell('foo-bar', () =>
      pipe(
        foo$,
        map((val) => `${val}-bar`)
      )
    )
    const r = new Realm()
    r.register(bar$)
    r.pub(foo$, 'baz')
    expect(r.getValue(bar$)).toEqual('baz-bar')
  })
})
