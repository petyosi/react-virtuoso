/// <reference types="@vitest/browser/matchers" />

import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell, e, EngineProvider, mapTo, Trigger, useCell, useCellValue, useCellValues, usePublisher } from '../../'
import { renderHook } from './renderHook'

const cell$ = Cell('hello')

describe('Reactive Engine in React', () => {
  it('gets a cell value with useCell', () => {
    const { result } = renderHook(useCell, {
      initialProps: cell$,
      wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
    })
    expect(result.current?.[0]).toEqual('hello')
  })

  it('has working setters', () => {
    const { rerender, result } = renderHook(useCell, {
      initialProps: cell$,
      wrapper: EngineProvider,
    })
    expect(result.current?.[0]).toEqual('hello')
    result.current?.[1]('world')
    rerender(cell$)
    expect(result.current?.[0]).toEqual('world')
  })

  it('supports triggers', () => {
    const cell$ = Cell('hello')

    const trigger$ = Trigger()

    e.link(e.pipe(trigger$, mapTo('world')), cell$)

    const { rerender, result } = renderHook(
      () => {
        const proc = usePublisher(trigger$)
        const value = useCellValue(cell$)
        return [value, proc] as const
      },
      { initialProps: undefined, wrapper: EngineProvider }
    )
    expect(result.current?.[0]).toEqual('hello')
    result.current?.[1]()
    rerender(undefined)
    expect(result.current?.[0]).toEqual('world')
  })

  it('supports multiple values', () => {
    const a$ = Cell('a')
    const b$ = Cell('b')
    const { result } = renderHook(() => useCellValues(a$, b$), {
      initialProps: undefined,
      wrapper: EngineProvider,
    })

    expect(result.current).toEqual(['a', 'b'])
  })

  describe('provider props', () => {
    it('allows setting initial cell values', () => {
      const { result } = renderHook(useCell, {
        initialProps: cell$,
        wrapper: ({ children }) => {
          return <EngineProvider initWith={{ [cell$]: 'world' }}>{children}</EngineProvider>
        },
      })
      expect(result.current?.[0]).toEqual('world')
    })

    it('accepts update props', async () => {
      const Child = () => {
        const [value] = useCell(cell$)
        return <div data-testid="cell-value">{value}</div>
      }
      const screen = render(
        <EngineProvider initWith={{ [cell$]: '1' }}>
          <Child />
        </EngineProvider>
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect.element(screen.getByTestId('cell-value') as any).toHaveTextContent('1')

      screen.rerender(
        <EngineProvider updateWith={{ [cell$]: '2' }}>
          <Child />
        </EngineProvider>
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect.element(screen.getByTestId('cell-value') as any).toHaveTextContent('2')
    })
  })
})
