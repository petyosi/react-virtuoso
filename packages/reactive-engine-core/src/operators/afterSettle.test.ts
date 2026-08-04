import { describe, expect, it, vi } from 'vitest'

import { Cell, e, Engine, Stream, Trigger } from '../index'

describe('afterSettle operator', () => {
  it('runs after synchronous subscribers and before pub returns', () => {
    const source$ = Stream<number>(false)
    const settled$ = e.pipe(source$, e.afterSettle())
    const order: string[] = []
    e.sub(source$, () => order.push('source'))
    e.sub(settled$, (value) => order.push(`settled:${value}`))
    const engine = new Engine()

    order.push('before')
    engine.pub(source$, 1)
    order.push('after')

    expect(order).toEqual(['before', 'source', 'settled:1', 'after'])
  })

  it('observes settled pubIn state and projects once', () => {
    const first$ = Cell(0)
    const second$ = Cell(0)
    const requested$ = Stream<void>(false)
    const settled$ = e.pipe(requested$, e.afterSettle())
    const values: number[][] = []
    e.sub(settled$, (_value, engine) => values.push([engine.getValue(first$), engine.getValue(second$)]))
    const engine = new Engine()

    engine.pubIn({ [first$]: 1, [requested$]: undefined, [second$]: 2 })

    expect(values).toEqual([[1, 2]])
  })

  it('preserves repeated equal values in FIFO order', () => {
    const start$ = Trigger()
    const source$ = Stream<number>(false)
    const settled$ = e.pipe(source$, e.afterSettle())
    const values: number[] = []
    e.sub(start$, (_value, engine) => {
      engine.pub(source$, 1)
      engine.pub(source$, 1)
      engine.pub(source$, 2)
    })
    e.sub(settled$, (value) => values.push(value))
    const engine = new Engine()

    engine.pub(start$)

    expect(values).toEqual([1, 1, 2])
  })

  it('runs work scheduled by a continuation in a later wave', () => {
    const first$ = Stream<number>(false)
    const second$ = Stream<number>(false)
    const firstSettled$ = e.pipe(first$, e.afterSettle())
    const secondSettled$ = e.pipe(second$, e.afterSettle())
    const order: string[] = []
    e.sub(firstSettled$, (value, engine) => {
      order.push(`first:${value}`)
      engine.pub(second$, value)
    })
    e.sub(secondSettled$, (value) => order.push(`second:${value}`))
    const engine = new Engine()

    engine.pub(first$, 1)

    expect(order).toEqual(['first:1', 'second:1'])
  })

  it('skips queued work after its engine is disposed', () => {
    const source$ = Stream<number>(false)
    const settled$ = e.pipe(source$, e.afterSettle())
    const subscriber = vi.fn()
    e.sub(source$, (_value, engine) => {
      engine.dispose()
    })
    e.sub(settled$, subscriber)
    const engine = new Engine()

    engine.pub(source$, 1)

    expect(subscriber).not.toHaveBeenCalled()
  })

  it('runs child fallback work when its covering parent is disposed before drain', () => {
    const source$ = Stream<string>(false)
    const settled$ = e.pipe(source$, e.afterSettle())
    const parent = new Engine()
    const child = new Engine({}, undefined, parent)
    const values: string[] = []
    child.sub(settled$, (value) => values.push(`child:${value}`))
    child.sub(source$, () => {
      parent.dispose()
    })
    parent.sub(settled$, (value) => values.push(`parent:${value}`))

    parent.pub(source$, 'x')

    expect(values).toEqual(['child:x'])
  })

  it('propagates continuation errors through the outer publication and resets context', () => {
    const source$ = Stream<number>(false)
    const settled$ = e.pipe(source$, e.afterSettle())
    const error = new Error('settled failure')
    e.sub(settled$, (value) => {
      if (value === 1) {
        throw error
      }
    })
    const engine = new Engine()

    expect(() => {
      engine.pub(source$, 1)
    }).toThrow(error)
    expect(() => {
      engine.pub(source$, 2)
    }).not.toThrow()
  })

  it('bounds feedback waves', () => {
    const source$ = Stream<number>(false)
    const settled$ = e.pipe(source$, e.afterSettle())
    e.sub(settled$, (value, engine) => {
      engine.pub(source$, value + 1)
    })
    const engine = new Engine()

    expect(() => {
      engine.pub(source$, 0)
    }).toThrow('afterSettle exceeded 1000 waves; check for a feedback loop')
  })

  it('waits for parent-to-child forwarding before draining', () => {
    const source$ = Stream<number>(false)
    const settled$ = e.pipe(source$, e.afterSettle())
    const parent = new Engine()
    const child = new Engine({}, undefined, parent)
    const order: string[] = []
    child.sub(source$, () => order.push('child-source'))
    child.sub(settled$, () => order.push('child-settled'))
    parent.sub(source$, () => order.push('parent-source'))
    parent.sub(settled$, () => order.push('settled'))

    parent.pub(source$, 1)

    expect(order).toEqual(['parent-source', 'child-source', 'settled', 'child-settled'])
  })

  it('deduplicates inherited settle work when later operators are composed', () => {
    const source$ = Stream<string>(false)
    const settled$ = e.pipe(
      source$,
      e.afterSettle(),
      e.map((value) => `mapped:${value}`, false)
    )
    const parent = new Engine()
    const child = new Engine({}, undefined, parent)
    const values: string[] = []
    child.sub(source$, () => values.push('child-source'))
    child.sub(settled$, (value) => values.push(`child-out:${value}`))
    parent.sub(source$, () => values.push('parent-source'))
    parent.sub(settled$, (value) => values.push(`parent-out:${value}`))

    parent.pub(source$, 'x')

    expect(values).toEqual(['parent-source', 'child-source', 'parent-out:mapped:x', 'child-out:mapped:x'])
  })

  it('forwards parent settled output to unrelated child-local graphs', () => {
    const source$ = Stream<string>(false)
    const settled$ = e.pipe(source$, e.afterSettle())
    const parent = new Engine()
    const child = new Engine({}, undefined, parent)
    parent.sub(settled$, () => undefined)
    const childSink$ = child.streamInstance<string>(false)
    child.connect<[string]>({
      map: (done) => (value) => {
        done(`child:${value}`)
      },
      sink: childSink$,
      sources: [settled$],
    })
    const values: string[] = []
    child.sub(childSink$, (value) => values.push(value))

    parent.pub(source$, 'x')

    expect(values).toEqual(['child:x'])
  })

  it('keeps sibling-local schedules independent when the parent has no matching operator', () => {
    const source$ = Stream<string>(false)
    const settled$ = e.pipe(source$, e.afterSettle())
    const parent = new Engine()
    const firstChild = new Engine({}, undefined, parent)
    const secondChild = new Engine({}, undefined, parent)
    const values: string[] = []
    firstChild.sub(settled$, (value) => values.push(`first:${value}`))
    secondChild.sub(settled$, (value) => values.push(`second:${value}`))
    parent.sub(source$, () => undefined)

    parent.pub(source$, 'x')

    expect(values).toEqual(['first:x', 'second:x'])
  })

  it('keeps separate pipe applications independent when they reuse one operator', () => {
    const start$ = Trigger()
    const parentSource$ = Stream<string>(false)
    const childSource$ = Stream<string>(false)
    const sharedAfterSettle = e.afterSettle<string>()
    const parentSettled$ = e.pipe(parentSource$, sharedAfterSettle)
    const childSettled$ = e.pipe(childSource$, sharedAfterSettle)
    const parent = new Engine()
    const child = new Engine({}, undefined, parent)
    const values: string[] = []
    parent.sub(parentSettled$, (value) => values.push(`parent:${value}`))
    child.sub(childSettled$, (value) => values.push(`child:${value}`))
    parent.sub(start$, (_value, engine) => {
      engine.pub(parentSource$, 'A')
      child.pub(childSource$, 'B')
    })

    parent.pub(start$)

    expect(values).toEqual(['parent:A', 'child:B'])
  })
})
