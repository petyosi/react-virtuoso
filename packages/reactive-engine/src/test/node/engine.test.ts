import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Cell, DerivedCell, e, Engine, Pipe, Stream, Trigger } from '../..'
import { map } from '../../operators'

describe('cells/streams', () => {
  let eng: Engine
  beforeEach(() => {
    eng = new Engine()
  })

  it('registers cells so that their value is accessed', () => {
    const cell = Cell('hello')
    expect(eng.getValue(cell)).toEqual('hello')
    eng.pub(cell, 'world')
    expect(eng.getValue(cell)).toEqual('world')
  })

  it('registers streams', () => {
    const stream = Stream<string>()
    const callback = vi.fn()
    eng.sub(stream, callback)
    eng.pub(stream, 'hello')
    expect(callback).toHaveBeenCalledWith('hello', eng)
  })

  it('implicitly registers cells used with combine', () => {
    const foo$ = Cell('foo')
    const bar$ = Cell('bar')
    const fooBar$ = eng.combine(foo$, bar$)

    const callback = vi.fn()
    eng.sub(fooBar$, callback)
    eng.pub(foo$, 'foo2')
    expect(callback).toHaveBeenCalledWith(['foo2', 'bar'], eng)
  })

  it('accepts initial cell values', () => {
    const cell = Cell('foo')
    eng = new Engine({ [cell]: 'bar' })
    expect(eng.getValue(cell)).toEqual('bar')
  })

  it('supports init function for cells', () => {
    const a$ = Cell(2)
    const b$ = Cell(2)

    e.link(b$, a$)
    eng.pub(b$, 3)
    expect(eng.getValue(a$)).toEqual(3)
  })

  it('supports init function for streams', () => {
    const a$ = Cell(2)
    const b$ = Stream()

    e.link(b$, a$)
    eng.pub(b$, 3)
    expect(eng.getValue(a$)).toEqual(3)
  })

  it('supports init function for triggers', () => {
    const a$ = Cell(2)
    const b$ = Trigger()

    e.addNodeInit(b$, (r) => {
      r.pub(a$, 3)
    })

    eng.pub(b$)
    expect(eng.getValue(a$)).toEqual(3)
  })
})

describe('engine features', () => {
  let eng: Engine

  beforeEach(() => {
    eng = new Engine()
  })

  it('supports pub/sub', () => {
    const n = Stream()
    const spy = vi.fn()
    eng.sub(n, spy)
    eng.pub(n, 'foo')
    expect(spy).toHaveBeenCalledWith('foo', eng)
  })

  it('supports undefined initial value', () => {
    const n = Cell<string | undefined>(undefined)
    const q = Cell(1)
    const tc = Cell<number>(0)

    e.link(
      e.pipe(
        e.combine(n, q),
        e.filter(([data]) => data !== undefined),
        e.map(([data]) => data?.length)
      ),
      tc
    )

    const spy = vi.fn()
    e.sub(tc, spy)

    eng.pub(n, 'foo')
    expect(spy).toHaveBeenCalledWith(3, eng)
  })

  it('connects nodes', () => {
    const a = Stream<number>()
    const b = Stream<number>()
    eng.connect<[number]>({
      map: (done) => (value) => {
        done(value * 2)
      },
      sink: b,
      sources: [a],
    })

    const spy = vi.fn()
    eng.sub(b, spy)
    eng.pub(a, 2)
    expect(spy).toHaveBeenCalledWith(4, eng)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('publishes once with diamond dependencies', () => {
    const a = Stream<number>()
    const b = Stream<number>()
    const c = Stream<number>()
    const d = Stream<number>()
    // const e = r.node<number>()

    eng.connect<[number]>({
      map: (done) => (value) => {
        done(value * 2)
      },
      sink: b,
      sources: [a],
    })

    eng.connect<[number]>({
      map: (done) => (value) => {
        done(value * 3)
      },
      sink: c,
      sources: [a],
    })

    eng.connect<[number, number]>({
      map: (done) => (b, c) => {
        done(b + c)
      },
      sink: d,
      sources: [b, c],
    })

    const spy = vi.fn()
    eng.sub(d, spy)
    eng.pub(a, 2)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(10, eng)
  })

  it('handles multiple conditional execution paths', () => {
    const a = Stream<number>()
    const b = Stream<number>()
    const c = Stream<number>()
    const d = Stream<number>()

    eng.connect<[number]>({
      map: (done) => (value) => {
        if (value % 2 === 0) {
          done(value)
        }
      },
      sink: c,
      sources: [a],
    })

    eng.connect<[number]>({
      map: (done) => (value) => {
        if (value % 2 === 0) {
          done(value)
        }
      },
      sink: c,
      sources: [b],
    })

    eng.connect<[number]>({
      map: (done) => (value) => {
        done(value * 2)
      },
      sink: d,
      sources: [c],
    })

    const spy = vi.fn()
    eng.sub(c, spy)
    const spy2 = vi.fn()
    eng.sub(d, spy2)

    eng.pubIn({
      [a]: 2,
      [b]: 3,
    })
    expect(spy).toHaveBeenCalledWith(2, eng)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledWith(4, eng)
    expect(spy2).toHaveBeenCalledTimes(1)

    eng.pubIn({
      [a]: 3,
      [b]: 4,
    })
    expect(spy).toHaveBeenCalledWith(4, eng)
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy2).toHaveBeenCalledWith(8, eng)
    expect(spy2).toHaveBeenCalledTimes(2)
  })

  it('handles pull dependencies', () => {
    const a = Stream<number>()
    const b = Stream<number>()
    const c = Stream<number>()
    const d = Stream<number>()
    const e = Stream<number>()
    const f = Stream<number>()
    const g = Stream<number>()
    const h = Stream<number>()

    eng.connect<[number]>({
      map: (done) => (value) => {
        done(value + 1)
      },
      sink: b,
      sources: [a],
    })

    eng.connect<[number]>({
      map: (done) => (value) => {
        done(value + 1)
      },
      sink: c,
      sources: [b],
    })

    eng.connect<[number]>({
      map: (done) => (value) => {
        done(value + 1)
      },
      sink: d,
      sources: [c],
    })

    eng.connect<[number]>({
      map: (done) => (value) => {
        done(value + 1)
      },
      sink: e,
      sources: [d],
    })

    eng.connect<[number, number]>({
      map: (done) => (a, e) => {
        done(a + e + 1)
      },
      pulls: [e],
      sink: f,
      sources: [a],
    })

    eng.connect<[number]>({
      map: (done) => (value) => {
        done(value + 1)
      },
      sink: g,
      sources: [f],
    })

    eng.connect<[number]>({
      map: (done) => (value) => {
        done(value + 1)
      },
      sink: h,
      sources: [g],
    })

    const spy = vi.fn()
    eng.sub(f, spy)
    eng.pub(a, 1)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(7, eng)
  })

  it('supports conditional connections', () => {
    const a = Stream<number>()
    const b = Stream<number>()

    eng.connect<[number]>({
      map: (done) => (value) => {
        if (value % 2 === 0) {
          done(value)
        }
      },
      sink: b,
      sources: [a],
    })

    const spy = vi.fn()
    eng.sub(b, spy)
    eng.pub(a, 1)
    eng.pub(a, 2)
    eng.pub(a, 3)
    eng.pub(a, 4)

    expect(spy).toHaveBeenCalledWith(2, eng)
    expect(spy).not.toHaveBeenCalledWith(3, eng)
    expect(spy).not.toHaveBeenCalledWith(1, eng)
    expect(spy).toHaveBeenCalledWith(4, eng)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('canceled connection cancels further execution', () => {
    const a = Stream<number>()
    const b = Stream<number>()
    const c = Stream<number>()
    const d = Stream<number>()

    eng.connect<[number]>({
      map: (done) => (value) => {
        if (value % 2 === 0) {
          done(value)
        }
      },
      sink: b,
      sources: [a],
    })

    eng.connect({
      map: (done) => (value) => {
        done(value)
      },
      sink: c,
      sources: [b],
    })

    eng.connect({
      map: (done) => (value) => {
        done(value)
      },
      sink: d,
      sources: [c],
    })

    const spy = vi.fn()
    eng.sub(d, spy)
    eng.pub(a, 1)
    eng.pub(a, 2)
    eng.pub(a, 3)
    eng.pub(a, 4)

    expect(spy).toHaveBeenCalledWith(2, eng)
    expect(spy).not.toHaveBeenCalledWith(3, eng)
    expect(spy).not.toHaveBeenCalledWith(1, eng)
    expect(spy).toHaveBeenCalledWith(4, eng)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('supports publishing in multiple nodes with a single call', () => {
    const a = Stream<number>()
    const b = Stream<number>()
    const c = Stream<number>()

    eng.connect<[number, number]>({
      map: (done) => (a, b) => {
        done(a + b)
      },
      sink: c,
      sources: [a, b],
    })

    const spy = vi.fn()
    eng.sub(c, spy)
    eng.pubIn({ [a]: 2, [b]: 3 })

    expect(spy).toHaveBeenCalledWith(5, eng)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('pulls from stateful nodes', () => {
    const a = Cell('foo')
    const b = Stream()
    const c = Stream()

    eng.connect<[number, number]>({
      map: (done) => (b, a) => {
        done(a + b)
      },
      pulls: [a],
      sink: c,
      sources: [b],
    })

    const spy = vi.fn()
    eng.sub(c, spy)
    eng.pub(b, 'bar')
    expect(spy).toHaveBeenCalledWith('foobar', eng)
  })

  it('does not recall subscriptions for distinct stateful nodes', () => {
    const a = Cell('foo')
    const spy = vi.fn()
    eng.sub(a, spy)
    eng.pub(a, 'foo')

    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('does not recall subscriptions for distinct stateful child nodes', () => {
    const a = Cell('bar')
    const b = Cell('foo')
    const spy = vi.fn()
    eng.connect({
      map: (value) => value,
      sink: b,
      sources: [a],
    })
    eng.sub(b, spy)
    eng.pub(a, 'foo')
    eng.pub(a, 'foo')

    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('supports custom comparator when distinct flag is set', () => {
    const a = Cell({ id: 'foo' }, (current, next) => (current !== undefined ? current.id === next.id : false))
    const spy = vi.fn()
    eng.sub(a, spy)
    eng.pub(a, { id: 'foo' })

    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('supports subscribing to multiple nodes', () => {
    const a = Cell('bar')
    const b = Cell('foo')
    const spy = vi.fn()
    eng.connect({
      map: (value) => value,
      sink: b,
      sources: [a],
    })

    eng.subMultiple([a, b], spy)

    eng.pubIn({
      [a]: 'qux',
      [b]: 'mu',
    })

    expect(spy).toHaveBeenCalledWith(['qux', 'mu'], eng)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('pubs subscription for multiple keys when one is updated', () => {
    const a = Cell('1')
    const b = Cell('2')
    const spy = vi.fn()
    eng.subMultiple([a, b], spy)
    eng.pub(a, '2')
    expect(spy).toHaveBeenCalledWith(['2', '2'], eng)
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('instance subscriptions', () => {
  let eng: Engine

  beforeEach(() => {
    eng = new Engine()
  })

  it('calls the subscription', () => {
    const a = Stream<number>()
    const spy1 = vi.fn()
    e.singletonSub(a, spy1)

    eng.pub(a, 2)
    expect(spy1).toHaveBeenCalledWith(2, eng)
  })

  it('replaces the subscription', () => {
    const eng = new Engine()
    const a = Stream<number>()
    const spy1 = vi.fn()
    const spy2 = vi.fn()
    eng.singletonSub(a, spy1)
    eng.pub(a, 2)
    eng.singletonSub(a, spy2)
    eng.pub(a, 3)
    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledTimes(1)
  })

  it('returns an unsubscribe handler', () => {
    const eng = new Engine()
    const a = Stream<number>()
    const spy1 = vi.fn()
    const unsub = eng.singletonSub(a, spy1)
    eng.pub(a, 2)
    unsub()
    eng.pub(a, 3)
    expect(spy1).toHaveBeenCalledTimes(1)
  })

  it('supports changing a cell value', () => {
    const a = Cell(1)
    const b = Stream<number>(false)

    e.changeWith(a, b, (a, b) => a + b)

    eng.pub(b, 2)
    expect(eng.getValue(a)).toEqual(3)
    eng.pub(b, 2)
    expect(eng.getValue(a)).toEqual(5)
  })

  it('supports Pipe nodes', () => {
    const a$ = Cell('foo')
    const [i$, o$] = Pipe(
      e.map<number, string>((x) => (x + 1).toString()),
      e.map((x) => `foo${x}`)
    )

    e.link(o$, a$)

    const eng = new Engine()
    eng.pub(i$, 2)
    expect(eng.getValue(a$)).toEqual('foo3')
  })

  it('supports promise resolution', async () => {
    const a = Cell<'error' | 'loaded' | 'loading' | 'none'>('none')
    const s = Stream<number>()

    e.link(
      e.pipe(
        s,
        e.map(async (val) => {
          return await new Promise<string>((resolve, reject) => {
            if (val === 2) {
              resolve('loaded')
            } else {
              reject(new Error('something went wrong'))
            }
          })
        }),
        e.handlePromise(
          () => 'loading',
          (value) => value,
          (error) => error
        )
      ),
      a
    )

    eng.pub(s, 2)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(eng.getValue(a)).toEqual('loaded')

    eng.pub(s, 3)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(eng.getValue(a)).toMatchObject(new Error('something went wrong'))
  })
})

describe('Derived cell', () => {
  let eng: Engine

  beforeEach(() => {
    eng = new Engine()
  })

  it('creates a derived cell', () => {
    const foo$ = Cell('foo')
    const bar$ = DerivedCell(
      'foo-bar',
      e.pipe(
        foo$,
        map((val) => `${val}-bar`)
      )
    )

    eng.register(bar$)
    eng.pub(foo$, 'baz')
    expect(eng.getValue(bar$)).toEqual('baz-bar')
  })
})

describe('global connectors', () => {
  let eng: Engine
  beforeEach(() => {
    eng = new Engine()
  })

  it('supports global link', () => {
    const foo$ = Cell('foo')
    const bar$ = Stream<string>()
    e.link(foo$, bar$)
    const spy = vi.fn()
    eng.sub(bar$, spy)
    eng.pub(foo$, 'baz')
    expect(spy).toHaveBeenCalledWith('baz', eng)
  })

  it('supports global sub', () => {
    const foo$ = Cell('foo')
    const spy = vi.fn()
    e.sub(foo$, spy)

    eng.pub(foo$, 'baz')
    expect(spy).toHaveBeenCalledWith('baz', eng)
  })

  it('supports global singletonSub', () => {
    const foo$ = Cell('foo')
    const spy = vi.fn()
    const spy2 = vi.fn()
    e.singletonSub(foo$, spy)
    e.singletonSub(foo$, spy2)

    eng.pub(foo$, 'baz')
    expect(spy).not.toHaveBeenCalledWith('baz', eng)
    expect(spy2).toHaveBeenCalledWith('baz', eng)
  })

  it('supports global subMultiple', () => {
    const a = Cell('bar')
    const b = Cell('foo')
    const spy = vi.fn()

    e.subMultiple([a, b], spy)

    eng.pubIn({
      [a]: 'qux',
      [b]: 'mu',
    })

    expect(spy).toHaveBeenCalledWith(['qux', 'mu'], eng)
  })

  it('supports global changeWith', () => {
    const foo$ = Cell('foo')
    const bar$ = Stream<string>()
    e.changeWith(foo$, bar$, (foo, bar) => `${foo}-${bar}`)
    const spy = vi.fn()
    e.sub(foo$, spy)

    eng.pub(bar$, 'baz')
    expect(spy).toHaveBeenCalledWith('foo-baz', eng)
  })

  it('supports global combine', () => {
    const foo$ = Cell('foo')
    const bar$ = Cell('bar')
    const fooBar$ = e.combine(foo$, bar$)
    const callback = vi.fn()
    e.sub(fooBar$, callback)

    eng.pub(foo$, 'foo2')
    expect(callback).toHaveBeenCalledWith(['foo2', 'bar'], eng)
  })

  it('supports global combine', () => {
    const foo$ = Stream<number>()
    const fooPlusOne$ = e.pipe(
      foo$,
      map((v) => v + 1)
    )
    const bar$ = Stream<number>()

    e.link(
      e.pipe(
        foo$,
        map((v) => v + 1)
      ),
      bar$
    )

    const callback = vi.fn()
    const callback2 = vi.fn()
    e.sub(fooPlusOne$, callback)
    e.sub(bar$, callback2)

    eng.pub(foo$, 1)
    expect(callback).toHaveBeenCalledWith(2, eng)
    expect(callback2).toHaveBeenCalledWith(2, eng)
  })
})
