import { describe, expect, it, vi } from 'vitest'

import { computedCellDefs$$ } from './globals'
import { Cell, ComputedCell, DerivedCell, e, Engine, Resource, Stream, Trigger } from './index'

import type { NodeRef, StateRef } from './index'

describe('ComputedCell', () => {
  it('initializes once from seeded dependency values without emitting', () => {
    const width$ = Cell(100)
    const project = vi.fn(([width]: readonly [number]) => width * 2)
    const doubled$ = ComputedCell([width$] as const, project)
    const subscriber = vi.fn()
    const engine = new Engine({ [width$]: 300 })

    engine.sub(doubled$, subscriber)

    expect(engine.getValue(doubled$)).toBe(600)
    expect(project).toHaveBeenCalledOnce()
    expect(subscriber).not.toHaveBeenCalled()
  })

  it('runs module-scope subscriptions when the computed node activates', () => {
    const source$ = Cell(1)
    const doubled$ = ComputedCell([source$] as const, ([value]) => value * 2)
    const subscriber = vi.fn()
    e.sub(doubled$, subscriber)
    const engine = new Engine()

    expect(engine.getValue(doubled$)).toBe(2)
    expect(subscriber).not.toHaveBeenCalled()
    engine.pub(source$, 2)

    expect(subscriber).toHaveBeenCalledWith(4, engine)
  })

  it('runs module-scope links when the computed node activates', () => {
    const source$ = Cell(1)
    const doubled$ = ComputedCell([source$] as const, ([value]) => value * 2)
    const target$ = Cell(0)
    e.link(doubled$, target$)
    const engine = new Engine()

    expect(engine.getValue(doubled$)).toBe(2)
    expect(engine.getValue(target$)).toBe(0)
    engine.pub(source$, 3)

    expect(engine.getValue(target$)).toBe(6)
  })

  it('projects one settled value for a batched dependency change', () => {
    const price$ = Cell(2)
    const quantity$ = Cell(3)
    const project = vi.fn(([price, quantity]: readonly [number, number]) => price * quantity)
    const total$ = ComputedCell([price$, quantity$] as const, project)
    const subscriber = vi.fn()
    const engine = new Engine()
    engine.sub(total$, subscriber)
    project.mockClear()

    engine.pubIn({ [price$]: 4, [quantity$]: 5 })

    expect(project).toHaveBeenCalledOnce()
    expect(project).toHaveBeenCalledWith([4, 5])
    expect(engine.getValue(total$)).toBe(20)
    expect(subscriber).toHaveBeenCalledOnce()
  })

  it('initializes computed dependency chains before reading them', () => {
    const source$ = Cell(2)
    const doubled$ = ComputedCell([source$] as const, ([value]) => value * 2)
    const plusOne$ = ComputedCell([doubled$] as const, ([value]) => value + 1)
    const subscriber = vi.fn()
    const engine = new Engine({ [source$]: 10 })

    engine.sub(plusOne$, subscriber)

    expect(engine.getValue(plusOne$)).toBe(21)
    expect(engine.getValue(doubled$)).toBe(20)
    expect(subscriber).not.toHaveBeenCalled()
  })

  it('uses the result comparator for later dependency changes', () => {
    const source$ = Cell(0)
    const parity$ = ComputedCell([source$] as const, ([value]) => value % 2)
    const subscriber = vi.fn()
    const engine = new Engine()
    engine.sub(parity$, subscriber)

    engine.pub(source$, 2)
    engine.pub(source$, 3)

    expect(subscriber).toHaveBeenCalledTimes(1)
    expect(subscriber).toHaveBeenCalledWith(1, engine)
  })

  it('supports a custom result comparator', () => {
    const source$ = Cell({ id: 1, label: 'initial' })
    const selected$ = ComputedCell(
      [source$] as const,
      ([value]) => value,
      (previous, current) => previous?.id === current.id
    )
    const subscriber = vi.fn()
    const engine = new Engine()
    engine.sub(selected$, subscriber)

    engine.pub(source$, { id: 1, label: 'ignored' })
    engine.pub(source$, { id: 2, label: 'next' })

    expect(subscriber).toHaveBeenCalledTimes(1)
    expect(engine.getValue(selected$)).toEqual({ id: 2, label: 'next' })
  })

  it('overwrites a direct computed seed with dependency-derived state', () => {
    const source$ = Cell(2)
    const doubled$ = ComputedCell([source$] as const, ([value]) => value * 2)
    const engine = new Engine({ [doubled$]: 999, [source$]: 5 })

    expect(engine.getValue(doubled$)).toBe(10)
  })

  it('keeps computed state isolated per engine', () => {
    const source$ = Cell(1)
    const doubled$ = ComputedCell([source$] as const, ([value]) => value * 2)

    expect(new Engine({ [source$]: 2 }).getValue(doubled$)).toBe(4)
    expect(new Engine({ [source$]: 7 }).getValue(doubled$)).toBe(14)
  })

  it('updates a child-owned computed cell from parent-owned state', () => {
    const source$ = Cell(2)
    const doubled$ = ComputedCell([source$] as const, ([value]) => value * 2)
    const parent = new Engine()
    parent.register(source$)
    const child = new Engine({}, undefined, parent)
    const subscriber = vi.fn()
    child.sub(doubled$, subscriber)

    expect(child.getValue(doubled$)).toBe(4)
    parent.pub(source$, 3)

    expect(child.getValue(doubled$)).toBe(6)
    expect(subscriber).toHaveBeenCalledWith(6, child)
  })

  it('supports constant computed state with no dependencies', () => {
    const project = vi.fn(() => 'constant')
    const constant$ = ComputedCell([] as const, project)
    const engine = new Engine()

    expect(engine.getValue(constant$)).toBe('constant')
    expect(project).toHaveBeenCalledOnce()
  })

  it('accepts derived and computed state dependencies', () => {
    const source$ = Cell(1)
    const derived$ = DerivedCell(2, source$)
    const computed$ = ComputedCell([derived$] as const, ([value]) => value + 1)

    expect(new Engine().getValue(computed$)).toBe(3)
  })

  it.each([
    ['Stream', () => Stream<number>()],
    ['Trigger', () => Trigger()],
    ['Resource', () => Resource(() => 1)],
    ['plain NodeRef', () => Symbol('plain') as NodeRef],
  ])('rejects a cast %s dependency at runtime', (_name, createDependency) => {
    const dependency = createDependency() as unknown as StateRef

    expect(() => ComputedCell([dependency] as const, ([value]) => value)).toThrow(
      'ComputedCell dependencies must be state nodes created with Cell, DerivedCell, or ComputedCell'
    )
  })

  it('does not leave the node initialized when its initial projection throws', () => {
    const source$ = Cell(1)
    const error = new Error('projection failed')
    const project = vi.fn(() => {
      throw error
    })
    const computed$ = ComputedCell([source$] as const, project)
    const engine = new Engine()

    expect(() => engine.getValue(computed$)).toThrow(error)
    expect(() => engine.getValue(computed$)).toThrow(error)
    expect(project).toHaveBeenCalledTimes(2)
  })

  it('propagates update projection errors', () => {
    const source$ = Cell(1)
    const error = new Error('update failed')
    const computed$ = ComputedCell([source$] as const, ([value]) => {
      if (value < 0) {
        throw error
      }
      return value
    })
    const engine = new Engine()
    engine.getValue(computed$)

    expect(() => {
      engine.pub(source$, -1)
    }).toThrow(error)
  })

  it('rejects a computed activation cycle with a clear error', () => {
    const source$ = Cell(1)
    const first$ = ComputedCell([source$] as const, ([value]) => value)
    const second$ = ComputedCell([first$] as const, ([value]) => value)
    const firstDefinition = computedCellDefs$$.get(first$)
    if (firstDefinition === undefined) {
      throw new Error('Expected computed definition')
    }
    firstDefinition.dependencies = [second$]

    expect(() => new Engine().getValue(first$)).toThrow('ComputedCell activation cycle detected')
  })
})
