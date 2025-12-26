import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest'

import { Cell, e, Stream, Trigger } from '../..'
import { Engine } from '../../Engine'

describe('debug utility', () => {
  let eng!: Engine
  let consoleLogSpy: Mock

  beforeEach(() => {
    eng = new Engine()

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      /* empty */
    })
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  it('logs Cell emissions with custom label', () => {
    const cell$ = Cell(0)
    e.debug(cell$, 'test-cell')

    eng.pub(cell$, 42)

    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] test-cell:', 42)
  })

  it('logs Stream emissions with custom label', () => {
    const stream$ = Stream<string>()
    e.debug(stream$, 'test-stream')

    eng.pub(stream$, 'hello')

    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] test-stream:', 'hello')
  })

  it('logs Trigger with [triggered] message', () => {
    const trigger$ = Trigger()
    e.debug(trigger$, 'test-trigger')

    eng.pub(trigger$)

    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] test-trigger:', '[triggered]')
  })

  it('auto-labels from stack trace when no custom label provided', () => {
    const cell$ = Cell(0)
    e.debug(cell$)

    eng.pub(cell$, 42)

    // Should extract file:line from stack (e.g., "debug.test.ts:57")
    // or fall back to '<anonymous>' if parsing fails
    expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    const calls = consoleLogSpy.mock.calls
    expect(calls.length).toBe(1)
    const firstCall = calls[0]
    if (!firstCall) {
      throw new Error('Expected at least one call')
    }
    const [prefix, value] = firstCall as [string, unknown]
    expect(prefix).toMatch(/\[reactive-engine\] (.+\.test\.ts:\d+|<anonymous>):/)
    expect(value).toBe(42)
  })

  it('uses custom label when provided, skipping stack extraction', () => {
    const cell$ = Cell(0)
    e.debug(cell$, 'my-custom-label')

    eng.pub(cell$, 42)

    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] my-custom-label:', 42)
  })

  it('cleanup function stops logging', () => {
    const cell$ = Cell(0)
    const stop = e.debug(cell$, 'test')

    eng.pub(cell$, 42)
    expect(consoleLogSpy).toHaveBeenCalledTimes(1)

    stop()
    consoleLogSpy.mockClear()

    eng.pub(cell$, 100)
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })

  it('uses original node reference (no wrapper)', () => {
    const cell$ = Cell(0)
    e.debug(cell$, 'test')
    const spy = vi.fn()

    // Subscribe to the original node, not a wrapper
    eng.sub(cell$, spy)
    eng.pub(cell$, 42)

    expect(spy).toHaveBeenCalledWith(42, eng)
    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] test:', 42)
  })

  it('works with derived nodes', () => {
    const cell$ = Cell(1)
    const doubled$ = e.pipe(
      cell$,
      e.map((x: number) => x * 2)
    )
    e.debug(doubled$, 'doubled')

    const spy = vi.fn()
    eng.sub(doubled$, spy)
    eng.pub(cell$, 5)

    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] doubled:', 10)
    expect(spy).toHaveBeenCalledWith(10, eng)
  })

  it('handles multiple nodes with debug enabled', () => {
    const cell1$ = Cell(0)
    const cell2$ = Cell('hello')
    e.debug(cell1$, 'cell1')
    e.debug(cell2$, 'cell2')

    eng.pub(cell1$, 42)
    eng.pub(cell2$, 'world')

    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] cell1:', 42)
    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] cell2:', 'world')
  })

  it('handles complex objects', () => {
    const cell$ = Cell({ id: 1, name: 'test' })
    e.debug(cell$, 'object')

    eng.pub(cell$, { id: 2, name: 'updated' })

    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] object:', { id: 2, name: 'updated' })
  })

  it('handles undefined values from triggers', () => {
    const trigger$ = Trigger()
    e.debug(trigger$, 'trigger')

    eng.pub(trigger$)

    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] trigger:', '[triggered]')
  })

  it('falls back gracefully if stack parsing fails', () => {
    const cell$ = Cell(0)

    // Mock Error.stack to return unparseable format
    const originalError = Error
    global.Error = class extends originalError {
      override get stack() {
        return 'unparseable stack format'
      }
    } as typeof Error

    e.debug(cell$)
    eng.pub(cell$, 42)

    global.Error = originalError

    // Should fall back to '<anonymous>'
    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] <anonymous>:', 42)
  })

  it('manual label takes precedence over stack extraction', () => {
    const cell$ = Cell(0)
    e.debug(cell$, 'explicit-label')

    eng.pub(cell$, 42)

    // Should use provided label, not extract from stack
    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] explicit-label:', 42)
  })

  it('replaces label when debug() is called multiple times (latest wins)', () => {
    const cell$ = Cell(0)
    e.debug(cell$, 'first-label')
    e.debug(cell$, 'second-label')

    eng.pub(cell$, 42)

    // Should only log once with the latest label
    expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] second-label:', 42)
  })

  it('cleanup function from first call works even after label replacement', () => {
    const cell$ = Cell(0)
    const stop1 = e.debug(cell$, 'first-label')
    e.debug(cell$, 'second-label')

    eng.pub(cell$, 42)
    expect(consoleLogSpy).toHaveBeenCalledWith('[reactive-engine] second-label:', 42)

    consoleLogSpy.mockClear()
    stop1() // This should remove the debug label

    eng.pub(cell$, 100)
    expect(consoleLogSpy).not.toHaveBeenCalled()
  })
})
