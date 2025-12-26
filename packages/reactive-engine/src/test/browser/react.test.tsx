/// <reference types="@vitest/browser/matchers" />
/** biome-ignore-all lint/suspicious/noExplicitAny: tests */

import { describe, expect, it } from 'vitest'
import { render, renderHook } from 'vitest-browser-react'

import { Cell, e, EngineProvider, mapTo, Trigger, useCell, useCellValue, useCellValues, usePublisher } from '../../'

const cell$ = Cell('hello')

describe('Reactive Engine in React', () => {
  it('gets a cell value with useCell', async () => {
    const { result } = await renderHook(() => useCell(cell$), {
      wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
    })
    expect(result.current[0]).toEqual('hello')
  })

  it('has working setters', async () => {
    const { rerender, result } = await renderHook(() => useCell(cell$), {
      wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
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
      { initialProps: undefined, wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider> }
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
      wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
    })

    expect(result.current).toEqual(['a', 'b'])
  })

  describe('provider props', () => {
    it('allows setting initial cell values', async () => {
      const { result } = await renderHook(() => useCell(cell$), {
        wrapper: ({ children }) => {
          return <EngineProvider initWith={{ [cell$]: 'world' }}>{children}</EngineProvider>
        },
      })
      expect(result.current[0]).toEqual('world')
    })

    it('accepts update props', async () => {
      const Child = () => {
        const [value] = useCell(cell$)
        return <div data-testid="cell-value">{value}</div>
      }
      const screen = await render(
        <EngineProvider initWith={{ [cell$]: '1' }}>
          <Child />
        </EngineProvider>
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect.element(screen.getByTestId('cell-value') as any).toHaveTextContent('1')

      void screen.rerender(
        <EngineProvider updateWith={{ [cell$]: '2' }}>
          <Child />
        </EngineProvider>
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect.element(screen.getByTestId('cell-value') as any).toHaveTextContent('2')
    })
  })
})
