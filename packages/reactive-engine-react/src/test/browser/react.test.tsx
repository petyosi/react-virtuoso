/// <reference types="@vitest/browser/matchers" />

import { Cell, e, mapTo, Trigger } from '@virtuoso.dev/reactive-engine-core'
import { describe, expect, it } from 'vitest'
import { render, renderHook } from 'vitest-browser-react'

import {
  EngineProvider,
  useCell,
  useCellValue,
  useCellValues,
  usePublisher,
  useRemoteCell,
  useRemoteCellValue,
  useRemoteCellValues,
  useRemotePublisher,
} from '../../'

const cell$ = Cell('hello')
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

describe('Reactive Engine in React', () => {
  it('gets a cell value with useCell', async () => {
    const { result } = await renderHook(() => useCell(cell$), {
      wrapper: ({ children }) => (
        <EngineProvider initFn={noop} updateDeps={[]} updateFn={noop}>
          {children}
        </EngineProvider>
      ),
    })
    expect(result.current[0]).toEqual('hello')
  })

  it('has working setters', async () => {
    const { rerender, result } = await renderHook(() => useCell(cell$), {
      wrapper: ({ children }) => (
        <EngineProvider initFn={noop} updateDeps={[]} updateFn={noop}>
          {children}
        </EngineProvider>
      ),
    })
    expect(result.current[0]).toEqual('hello')
    result.current[1]('world')
    await rerender(cell$)
    expect(result.current[0]).toEqual('world')
  })

  it('supports triggers', async () => {
    const cell$ = Cell('hello')

    const trigger$ = Trigger()

    e.link(e.pipe(trigger$, mapTo('world')), cell$)

    const { rerender, result } = await renderHook(
      () => {
        const proc = usePublisher(trigger$)
        const value = useCellValue(cell$)
        return [value, proc] as const
      },
      {
        initialProps: undefined,
        wrapper: ({ children }) => (
          <EngineProvider initFn={noop} updateDeps={[]} updateFn={noop}>
            {children}
          </EngineProvider>
        ),
      }
    )
    expect(result.current[0]).toEqual('hello')
    result.current[1]()
    await rerender(undefined)
    expect(result.current[0]).toEqual('world')
  })

  it('supports multiple values', async () => {
    const a$ = Cell('a')
    const b$ = Cell('b')
    const { result } = await renderHook(() => useCellValues(a$, b$), {
      initialProps: undefined,
      wrapper: ({ children }) => (
        <EngineProvider initFn={noop} updateDeps={[]} updateFn={noop}>
          {children}
        </EngineProvider>
      ),
    })

    expect(result.current).toEqual(['a', 'b'])
  })

  describe('provider props', () => {
    it('allows setting initial cell values', async () => {
      const { result } = await renderHook(() => useCell(cell$), {
        wrapper: ({ children }) => (
          <EngineProvider initFn={noop} initWith={{ [cell$]: 'world' }} updateDeps={[]} updateFn={noop}>
            {children}
          </EngineProvider>
        ),
      })
      expect(result.current[0]).toEqual('world')
    })

    it('accepts update props', async () => {
      const testCell$ = Cell('initial')
      const Child = () => {
        const [value] = useCell(testCell$)
        return <div data-testid="cell-value">{value}</div>
      }

      const Wrapper = ({ value }: { value: string }) => (
        <EngineProvider
          initFn={noop}
          updateDeps={[value]}
          updateFn={(engine) => {
            engine.pub(testCell$, value)
          }}
        >
          <Child />
        </EngineProvider>
      )

      const screen = await render(<Wrapper value="1" />)

      await expect.element(screen.getByTestId('cell-value')).toHaveTextContent('1')

      void screen.rerender(<Wrapper value="2" />)

      await expect.element(screen.getByTestId('cell-value')).toHaveTextContent('2')
    })
  })
})

describe('Remote hooks', () => {
  const ENGINE_ID = 'test-engine'

  describe('useRemoteCellValue', () => {
    it('returns undefined when no engine is available', async () => {
      const remoteCell$ = Cell('remote-value')
      const { result } = await renderHook(() => useRemoteCellValue(remoteCell$, ENGINE_ID), {
        initialProps: undefined,
      })
      expect(result.current).toBeUndefined()
    })

    it('returns value after engine mounts', async () => {
      const remoteCell$ = Cell('remote-value')

      const RemoteComponent = () => {
        const value = useRemoteCellValue(remoteCell$, ENGINE_ID)
        return <div data-testid="remote-value">{value ?? 'loading'}</div>
      }

      const screen = await render(
        <>
          <RemoteComponent />
        </>
      )

      await expect.element(screen.getByTestId('remote-value')).toHaveTextContent('loading')

      void screen.rerender(
        <>
          <EngineProvider engineId={ENGINE_ID} initFn={noop}>
            <div>Engine mounted</div>
          </EngineProvider>
          <RemoteComponent />
        </>
      )

      await expect.element(screen.getByTestId('remote-value')).toHaveTextContent('remote-value')
    })

    it('returns undefined again after engine unmounts', async () => {
      const remoteCell$ = Cell('remote-value')

      const RemoteComponent = () => {
        const value = useRemoteCellValue(remoteCell$, ENGINE_ID)
        return <div data-testid="remote-value">{value ?? 'loading'}</div>
      }

      const screen = await render(
        <>
          <EngineProvider engineId={ENGINE_ID} initFn={noop}>
            <div>Engine mounted</div>
          </EngineProvider>
          <RemoteComponent />
        </>
      )

      await expect.element(screen.getByTestId('remote-value')).toHaveTextContent('remote-value')

      void screen.rerender(
        <>
          <RemoteComponent />
        </>
      )

      await expect.element(screen.getByTestId('remote-value')).toHaveTextContent('loading')
    })
  })

  describe('useRemotePublisher', () => {
    it('returns noop when no engine is available', async () => {
      const trigger$ = Trigger()
      const { result } = await renderHook(() => useRemotePublisher(trigger$, ENGINE_ID), {
        initialProps: undefined,
      })
      expect(result.current).toBeInstanceOf(Function)
      expect(() => {
        result.current()
      }).not.toThrow()
    })

    it('returns working publisher after engine mounts', async () => {
      const remoteCell$ = Cell('initial')
      const trigger$ = Trigger()
      e.link(e.pipe(trigger$, mapTo('triggered')), remoteCell$)

      const RemoteComponent = () => {
        const value = useRemoteCellValue(remoteCell$, ENGINE_ID)
        const publish = useRemotePublisher(trigger$, ENGINE_ID)
        return (
          <div>
            <span data-testid="remote-value">{value ?? 'loading'}</span>
            <button
              data-testid="trigger-btn"
              onClick={() => {
                publish()
              }}
            >
              Trigger
            </button>
          </div>
        )
      }

      const screen = await render(
        <>
          <EngineProvider engineId={ENGINE_ID} initFn={noop}>
            <div>Engine mounted</div>
          </EngineProvider>
          <RemoteComponent />
        </>
      )

      await expect.element(screen.getByTestId('remote-value')).toHaveTextContent('initial')
      ;(screen.getByTestId('trigger-btn').element() as HTMLButtonElement).click()

      await expect.element(screen.getByTestId('remote-value')).toHaveTextContent('triggered')
    })
  })

  describe('useRemoteCell', () => {
    it('returns [undefined, noop] when no engine is available', async () => {
      const remoteCell$ = Cell('remote-value')
      const { result } = await renderHook(() => useRemoteCell(remoteCell$, ENGINE_ID), {
        initialProps: undefined,
      })
      expect(result.current[0]).toBeUndefined()
      expect(result.current[1]).toBeInstanceOf(Function)
      expect(() => {
        result.current[1]('test')
      }).not.toThrow()
    })

    it('returns [value, setter] after engine mounts', async () => {
      const remoteCell$ = Cell('initial')

      const RemoteComponent = () => {
        const [value, setValue] = useRemoteCell(remoteCell$, ENGINE_ID)
        return (
          <div>
            <span data-testid="remote-value">{value ?? 'loading'}</span>
            <button
              data-testid="set-btn"
              onClick={() => {
                setValue('updated')
              }}
            >
              Set
            </button>
          </div>
        )
      }

      const screen = await render(
        <>
          <EngineProvider engineId={ENGINE_ID} initFn={noop}>
            <div>Engine mounted</div>
          </EngineProvider>
          <RemoteComponent />
        </>
      )

      await expect.element(screen.getByTestId('remote-value')).toHaveTextContent('initial')
      ;(screen.getByTestId('set-btn').element() as HTMLButtonElement).click()

      await expect.element(screen.getByTestId('remote-value')).toHaveTextContent('updated')
    })
  })

  describe('useRemoteCellValues', () => {
    it('returns undefined when no engine is available', async () => {
      const a$ = Cell('a')
      const b$ = Cell('b')
      const { result } = await renderHook(() => useRemoteCellValues({ cells: [a$, b$], engineId: ENGINE_ID }), {
        initialProps: undefined,
      })
      expect(result.current).toBeUndefined()
    })

    it('returns values array after engine mounts', async () => {
      const a$ = Cell('a')
      const b$ = Cell('b')

      const RemoteComponent = () => {
        const values = useRemoteCellValues({ cells: [a$, b$], engineId: ENGINE_ID })
        return <div data-testid="remote-values">{values ? values.join('-') : 'loading'}</div>
      }

      const screen = await render(
        <>
          <EngineProvider engineId={ENGINE_ID} initFn={noop}>
            <div>Engine mounted</div>
          </EngineProvider>
          <RemoteComponent />
        </>
      )

      await expect.element(screen.getByTestId('remote-values')).toHaveTextContent('a-b')
    })
  })

  describe('multiple engines', () => {
    it('works with multiple engines with different IDs', async () => {
      const cellA$ = Cell('value-a')
      const cellB$ = Cell('value-b')

      const RemoteComponent = () => {
        const valueA = useRemoteCellValue(cellA$, 'engine-a')
        const valueB = useRemoteCellValue(cellB$, 'engine-b')
        return (
          <div>
            <span data-testid="value-a">{valueA ?? 'loading-a'}</span>
            <span data-testid="value-b">{valueB ?? 'loading-b'}</span>
          </div>
        )
      }

      const screen = await render(
        <>
          <EngineProvider engineId="engine-a" initFn={noop}>
            <div>Engine A</div>
          </EngineProvider>
          <EngineProvider engineId="engine-b" initFn={noop}>
            <div>Engine B</div>
          </EngineProvider>
          <RemoteComponent />
        </>
      )

      await expect.element(screen.getByTestId('value-a')).toHaveTextContent('value-a')
      await expect.element(screen.getByTestId('value-b')).toHaveTextContent('value-b')
    })
  })

  describe('EngineProvider without engineId', () => {
    it('does not register in global registry', async () => {
      const remoteCell$ = Cell('should-not-appear')

      const RemoteComponent = () => {
        const value = useRemoteCellValue(remoteCell$, 'some-id')
        return <div data-testid="remote-value">{value ?? 'loading'}</div>
      }

      const screen = await render(
        <>
          <EngineProvider initFn={noop}>
            <div>Engine without ID</div>
          </EngineProvider>
          <RemoteComponent />
        </>
      )

      await expect.element(screen.getByTestId('remote-value')).toHaveTextContent('loading')
    })
  })
})
