/// <reference types="@vitest/browser/matchers" />

import React from 'react'

import { Cell, Stream } from '@virtuoso.dev/reactive-engine-core'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { EngineProvider, useEngine, useLinkCellToExternalState } from '../../'

import type { Engine, Out, Subscription } from '@virtuoso.dev/reactive-engine-core'

class TestErrorBoundary extends React.Component<{ children: React.ReactNode; onError: (error: Error) => void }, { failed: boolean }> {
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void }) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  override render() {
    return this.state.failed ? null : this.props.children
  }
}

function trackNodeSubscriptions(engine: Engine, target: Out) {
  const originalSub = engine.sub.bind(engine)
  let calls = 0
  let cleanups = 0

  engine.sub = <T,>(node: Out<T>, subscription: Subscription<T>) => {
    const unsubscribe = originalSub(node, subscription)
    if (node !== target) {
      return unsubscribe
    }

    calls++
    let active = true
    return () => {
      if (active) {
        active = false
        cleanups++
      }
      unsubscribe()
    }
  }

  return {
    active: () => calls - cleanups,
    calls: () => calls,
    cleanups: () => cleanups,
  }
}

describe('useLinkCellToExternalState', () => {
  it('synchronizes initial and later external values before later same-component layout work', async () => {
    const state$ = Cell({ id: 'cell' })
    const writeRequested$ = Stream<{ id: string }>(false)
    const cellRecords: { id: string }[] = []
    const layoutRecords: { id: string }[] = []
    let engine: Engine | undefined

    const Bridge = ({ externalValue }: { externalValue: { id: string } }) => {
      const currentEngine = useEngine()
      useLinkCellToExternalState({
        cell: state$,
        externalValue,
        writeExternalValue: vi.fn(),
        writeRequested: writeRequested$,
      })
      React.useLayoutEffect(() => {
        layoutRecords.push(currentEngine.getValue(state$))
      }, [currentEngine, externalValue])
      return null
    }
    const App = ({ externalValue }: { externalValue: { id: string } }) => (
      <EngineProvider
        initFn={(currentEngine) => {
          engine = currentEngine
          currentEngine.sub(state$, (value) => cellRecords.push(value))
        }}
      >
        <Bridge externalValue={externalValue} />
      </EngineProvider>
    )

    const firstExternal = { id: 'first-external' }
    const screen = await render(<App externalValue={firstExternal} />)
    expect(cellRecords).toEqual([firstExternal])
    expect(layoutRecords).toEqual([firstExternal])
    expect(engine!.getValue(state$)).toBe(firstExternal)

    const secondExternal = { id: 'second-external' }
    await screen.rerender(<App externalValue={secondExternal} />)
    expect(cellRecords).toEqual([firstExternal, secondExternal])
    expect(layoutRecords).toEqual([firstExternal, secondExternal])
    expect(engine!.getValue(state$)).toBe(secondExternal)
  })

  it('uses Object.is when equals is omitted', async () => {
    const sharedValue = { id: 1 }
    const state$ = Cell(sharedValue)
    const writeRequested$ = Stream<{ id: number }>(false)
    const cellRecords: { id: number }[] = []

    const Bridge = ({ externalValue }: { externalValue: { id: number } }) => {
      useLinkCellToExternalState({
        cell: state$,
        externalValue,
        writeExternalValue: vi.fn(),
        writeRequested: writeRequested$,
      })
      return null
    }
    const App = ({ externalValue }: { externalValue: { id: number } }) => (
      <EngineProvider initFn={(engine) => engine.sub(state$, (value) => cellRecords.push(value))}>
        <Bridge externalValue={externalValue} />
      </EngineProvider>
    )

    const screen = await render(<App externalValue={sharedValue} />)
    expect(cellRecords).toEqual([])

    const equalCopy = { id: 1 }
    await screen.rerender(<App externalValue={equalCopy} />)
    expect(cellRecords).toEqual([equalCopy])
  })

  it('uses Object.is by default and custom equality only for inbound suppression', async () => {
    const state$ = Cell({ id: 1, label: 'cell' })
    const writeRequested$ = Stream<{ id: number; label: string }>(false)
    const cellRecords: { id: number; label: string }[] = []
    let engine: Engine | undefined
    let requestLifecycle: ReturnType<typeof trackNodeSubscriptions> | undefined

    const App = ({ custom, externalValue }: { custom: boolean; externalValue: { id: number; label: string } }) => (
      <EngineProvider
        initFn={(currentEngine) => {
          engine = currentEngine
          requestLifecycle = trackNodeSubscriptions(currentEngine, writeRequested$)
          currentEngine.sub(state$, (value) => cellRecords.push(value))
        }}
      >
        <Bridge custom={custom} externalValue={externalValue} />
      </EngineProvider>
    )
    const Bridge = ({ custom, externalValue }: { custom: boolean; externalValue: { id: number; label: string } }) => {
      useLinkCellToExternalState({
        cell: state$,
        equals: custom ? (current, external) => current.id === external.id : Object.is,
        externalValue,
        writeExternalValue: vi.fn(),
        writeRequested: writeRequested$,
      })
      return null
    }

    const structurallyEqual = { id: 1, label: 'external' }
    const screen = await render(<App custom externalValue={structurallyEqual} />)
    expect(cellRecords).toEqual([])
    expect(engine!.getValue(state$)).toEqual({ id: 1, label: 'cell' })
    expect(requestLifecycle?.calls()).toBe(1)

    await screen.rerender(<App custom={false} externalValue={structurallyEqual} />)
    expect(cellRecords).toEqual([structurallyEqual])
    expect(requestLifecycle?.calls()).toBe(1)

    await screen.rerender(<App custom={false} externalValue={structurallyEqual} />)
    expect(cellRecords).toEqual([structurallyEqual])
    expect(requestLifecycle?.calls()).toBe(1)
  })

  it('writes only explicit requests, uses the latest writer, and never loops on cell changes or echoes', async () => {
    const state$ = Cell(0)
    const writeRequested$ = Stream<number>(false)
    const cellRecords: number[] = []
    const oldWriter = vi.fn()
    const newWriter = vi.fn()
    let engine: Engine | undefined
    let requestLifecycle: ReturnType<typeof trackNodeSubscriptions> | undefined

    const Bridge = ({ externalValue, writer }: { externalValue: number; writer: (value: number) => unknown }) => {
      useLinkCellToExternalState({
        cell: state$,
        externalValue,
        writeExternalValue: writer,
        writeRequested: writeRequested$,
      })
      return null
    }
    const App = ({ externalValue, writer }: { externalValue: number; writer: (value: number) => unknown }) => (
      <EngineProvider
        initFn={(currentEngine) => {
          engine = currentEngine
          requestLifecycle = trackNodeSubscriptions(currentEngine, writeRequested$)
          currentEngine.sub(state$, (value) => cellRecords.push(value))
        }}
      >
        <Bridge externalValue={externalValue} writer={writer} />
      </EngineProvider>
    )

    const screen = await render(<App externalValue={0} writer={oldWriter} />)
    engine!.pub(writeRequested$, 1)
    expect(oldWriter).toHaveBeenCalledOnce()
    expect(oldWriter).toHaveBeenLastCalledWith(1)

    engine!.pub(state$, 2)
    expect(oldWriter).toHaveBeenCalledOnce()
    expect(cellRecords).toEqual([2])

    await screen.rerender(<App externalValue={2} writer={newWriter} />)
    expect(cellRecords).toEqual([2])
    expect(requestLifecycle?.calls()).toBe(1)
    expect(requestLifecycle?.active()).toBe(1)

    await screen.rerender(<App externalValue={3} writer={newWriter} />)
    expect(cellRecords).toEqual([2, 3])
    expect(newWriter).not.toHaveBeenCalled()

    engine!.pub(writeRequested$, 4)
    engine!.pub(writeRequested$, 4)
    expect(oldWriter).toHaveBeenCalledOnce()
    expect(newWriter).toHaveBeenCalledTimes(2)
    expect(newWriter).toHaveBeenNthCalledWith(1, 4)
    expect(newWriter).toHaveBeenNthCalledWith(2, 4)
    expect(requestLifecycle?.calls()).toBe(1)
  })

  it('preserves ordinary Engine subscriber error propagation from the writer', async () => {
    const state$ = Cell(0)
    const writeRequested$ = Stream<number>(false)
    const writerError = new Error('writer failed')
    let engine: Engine | undefined

    await render(
      <EngineProvider initFn={(currentEngine) => (engine = currentEngine)}>
        <Bridge />
      </EngineProvider>
    )

    function Bridge() {
      useLinkCellToExternalState({
        cell: state$,
        externalValue: 0,
        writeExternalValue: () => {
          throw writerError
        },
        writeRequested: writeRequested$,
      })
      return null
    }

    expect(() => {
      engine!.pub(writeRequested$, 1)
    }).toThrow(writerError)
  })

  it('preserves ordinary React layout-effect error handling from the comparator', async () => {
    const state$ = Cell(0)
    const writeRequested$ = Stream<number>(false)
    const comparatorError = new Error('comparator failed')
    let capturedError: Error | undefined

    const Bridge = () => {
      useLinkCellToExternalState({
        cell: state$,
        equals: () => {
          throw comparatorError
        },
        externalValue: 1,
        writeExternalValue: vi.fn(),
        writeRequested: writeRequested$,
      })
      return null
    }

    await render(
      <TestErrorBoundary onError={(error) => (capturedError = error)}>
        <EngineProvider>
          <Bridge />
        </EngineProvider>
      </TestErrorBoundary>
    )

    expect(capturedError).toBe(comparatorError)
  })

  it('moves request and cell sources exactly once and cleans up while the engine stays alive', async () => {
    const firstCell$ = Cell(0)
    const secondCell$ = Cell(100)
    const firstRequest$ = Stream<number>(false)
    const secondRequest$ = Stream<number>(false)
    const writer = vi.fn()
    let engine: Engine | undefined
    let firstLifecycle: ReturnType<typeof trackNodeSubscriptions> | undefined
    let secondLifecycle: ReturnType<typeof trackNodeSubscriptions> | undefined

    const Bridge = ({ cell, request }: { cell: typeof firstCell$; request: typeof firstRequest$ }) => {
      useLinkCellToExternalState({
        cell,
        externalValue: 5,
        writeExternalValue: writer,
        writeRequested: request,
      })
      return null
    }
    const App = ({ cell, request, show = true }: { cell: typeof firstCell$; request: typeof firstRequest$; show?: boolean }) => (
      <EngineProvider
        initFn={(currentEngine) => {
          engine = currentEngine
          firstLifecycle = trackNodeSubscriptions(currentEngine, firstRequest$)
          secondLifecycle = trackNodeSubscriptions(currentEngine, secondRequest$)
        }}
      >
        {show ? <Bridge cell={cell} request={request} /> : null}
      </EngineProvider>
    )

    const screen = await render(<App cell={firstCell$} request={firstRequest$} />)
    expect(engine!.getValue(firstCell$)).toBe(5)
    expect(firstLifecycle?.active()).toBe(1)

    await screen.rerender(<App cell={secondCell$} request={secondRequest$} />)
    expect(engine!.getValue(secondCell$)).toBe(5)
    expect(firstLifecycle?.calls()).toBe(1)
    expect(firstLifecycle?.cleanups()).toBe(1)
    expect(firstLifecycle?.active()).toBe(0)
    expect(secondLifecycle?.calls()).toBe(1)
    expect(secondLifecycle?.active()).toBe(1)

    engine!.pub(firstRequest$, 1)
    engine!.pub(secondRequest$, 2)
    expect(writer).toHaveBeenCalledTimes(1)
    expect(writer).toHaveBeenLastCalledWith(2)

    await screen.rerender(<App cell={secondCell$} request={secondRequest$} show={false} />)
    expect(secondLifecycle?.cleanups()).toBe(1)
    expect(secondLifecycle?.active()).toBe(0)
    engine!.pub(secondRequest$, 3)
    expect(writer).toHaveBeenCalledTimes(1)
  })

  it('resynchronizes into a replacement nearest provider and cleans both request bindings', async () => {
    const state$ = Cell(0)
    const writeRequested$ = Stream<number>(false)
    const engines: Engine[] = []
    const lifecycles: ReturnType<typeof trackNodeSubscriptions>[] = []
    const writer = vi.fn()

    const Bridge = () => {
      useLinkCellToExternalState({
        cell: state$,
        externalValue: 7,
        writeExternalValue: writer,
        writeRequested: writeRequested$,
      })
      return null
    }
    const App = ({ engineKey }: { engineKey: string }) => (
      <EngineProvider
        key={engineKey}
        initFn={(engine) => {
          engines.push(engine)
          lifecycles.push(trackNodeSubscriptions(engine, writeRequested$))
        }}
      >
        <Bridge />
      </EngineProvider>
    )

    const screen = await render(<App engineKey="first" />)
    expect(engines[0]!.getValue(state$)).toBe(7)
    expect(lifecycles[0]?.active()).toBe(1)

    await screen.rerender(<App engineKey="second" />)
    const secondEngine = engines.at(-1)!
    expect(secondEngine).not.toBe(engines[0])
    expect(secondEngine.getValue(state$)).toBe(7)
    expect(lifecycles[0]?.cleanups()).toBe(1)
    expect(lifecycles[0]?.active()).toBe(0)
    expect(lifecycles.at(-1)?.active()).toBe(1)

    secondEngine.pub(writeRequested$, 8)
    expect(writer).toHaveBeenCalledOnce()
    expect(writer).toHaveBeenLastCalledWith(8)

    await screen.rerender(<div />)
    expect(lifecycles.at(-1)?.cleanups()).toBe(1)
    expect(lifecycles.at(-1)?.active()).toBe(0)
  })

  it('keeps one inbound transition and one request binding through root Strict Mode recovery', async () => {
    const state$ = Cell(0)
    const writeRequested$ = Stream<number>(false)
    const cellRecords: { engine: Engine; value: number }[] = []
    const lifecycles = new Map<Engine, ReturnType<typeof trackNodeSubscriptions>>()
    const writer = vi.fn()
    let engine: Engine | undefined
    let lifecycle: ReturnType<typeof trackNodeSubscriptions> | undefined

    const Bridge = () => {
      engine = useEngine()
      lifecycle = lifecycles.get(engine)
      useLinkCellToExternalState({
        cell: state$,
        externalValue: 1,
        writeExternalValue: writer,
        writeRequested: writeRequested$,
      })
      return null
    }
    const App = ({ show }: { show: boolean }) => (
      <React.StrictMode>
        <EngineProvider
          initFn={(currentEngine) => {
            lifecycles.set(currentEngine, trackNodeSubscriptions(currentEngine, writeRequested$))
            currentEngine.sub(state$, (value, emittingEngine) => cellRecords.push({ engine: emittingEngine, value }))
          }}
        >
          {show ? <Bridge /> : null}
        </EngineProvider>
      </React.StrictMode>
    )

    const screen = await render(<App show />)
    expect(cellRecords.filter((record) => record.engine === engine)).toEqual([{ engine, value: 1 }])
    expect(engine!.getValue(state$)).toBe(1)
    expect(lifecycle?.active()).toBe(1)

    engine!.pub(writeRequested$, 2)
    expect(writer).toHaveBeenCalledOnce()
    expect(writer).toHaveBeenLastCalledWith(2)

    await screen.rerender(<App show={false} />)
    expect(engine!.isDisposed).toBe(false)
    expect(lifecycle?.active()).toBe(0)
    engine!.pub(writeRequested$, 3)
    expect(writer).toHaveBeenCalledOnce()
  })
})
