import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Cell, e, Engine, setNodeLabel, Stream } from '../..'

describe('pipe', () => {
  let eng!: Engine
  beforeEach(() => {
    eng = new Engine()
  })

  // Integration tests for operator chaining
  it('chains multiple operators together', () => {
    const a = Stream<number>()
    setNodeLabel(a, 'a')

    const b = e.pipe(
      a,
      e.map((val: number) => val * 2),
      e.filter((val: number) => val > 3)
    )

    const spy = vi.fn()
    e.sub(b, spy)

    eng.pub(a, 2)
    expect(spy).toHaveBeenCalledWith(4, eng)
  })

  it('integrates withLatestFrom with other operators', () => {
    const source = Stream<number>()
    const latest = Cell('suffix')

    const processed = e.pipe(
      source,
      e.withLatestFrom(latest),
      e.map(([num, str]) => `${num}-${str}`),
      e.filter((val: string) => val.includes('5'))
    )

    const spy = vi.fn()
    e.sub(processed, spy)

    eng.pub(source, 3)
    expect(spy).not.toHaveBeenCalled() // Filtered out

    eng.pub(source, 5)
    expect(spy).toHaveBeenCalledWith('5-suffix', eng)
  })

  it('combines node values', () => {
    const a = Cell<number>(0)
    const b = Cell<number>(0)
    const d = Cell<number>(6)

    const c = e.combine(a, b, d)

    const spy = vi.fn()
    eng.sub(c, spy)
    eng.pubIn({ [a]: 3, [b]: 4 })
    expect(spy).toHaveBeenCalledWith([3, 4, 6], eng)
    expect(spy).toHaveBeenCalledTimes(1)
    eng.pub(d, 7)
    expect(spy).toHaveBeenCalledWith([3, 4, 7], eng)
  })

  it('supports value-less stream', () => {
    const a$ = Stream(false)
    const b$ = Cell(1)

    e.link(
      e.pipe(
        a$,
        e.withLatestFrom(b$),
        e.map(([, b]) => b + 1)
      ),
      b$
    )

    expect(eng.getValue(b$)).toBe(1)
    eng.pub(a$)
    expect(eng.getValue(b$)).toBe(2)
  })
})
