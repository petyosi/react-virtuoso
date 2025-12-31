/** biome-ignore-all lint/suspicious/noExplicitAny: tests */

import { render, renderHook, screen, waitFor } from '@testing-library/react'
import { Cell, e, mapTo, Trigger } from '@virtuoso.dev/reactive-engine-core'
import { describe, expect, it } from 'vitest'

import { EngineProvider } from './EngineProvider'
import { useCell, useCellValue, useCellValues, usePublisher } from './hooks'

const cell$ = Cell('hello')

describe('Reactive Engine in React', () => {
  it('gets a cell value with useCell', () => {
    const { result } = renderHook(() => useCell(cell$), {
      wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
    })
    expect(result.current[0]).toEqual('hello')
  })

  it('has working setters', async () => {
    const { rerender, result } = renderHook(() => useCell(cell$), {
      wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
    })
    expect(result.current[0]).toEqual('hello')
    result.current[1]('world')
    rerender()
    await waitFor(() => {
      expect(result.current[0]).toEqual('world')
    })
  })

  it('supports triggers', async () => {
    const cell$ = Cell('hello')

    const trigger$ = Trigger()

    e.link(e.pipe(trigger$, mapTo('world')), cell$)

    const { rerender, result } = renderHook(
      () => {
        const proc = usePublisher(trigger$)
        const value = useCellValue(cell$)
        return [value, proc] as const
      },
      { wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider> }
    )
    expect(result.current[0]).toEqual('hello')
    result.current[1]()
    rerender()
    await waitFor(() => {
      expect(result.current[0]).toEqual('world')
    })
  })

  it('supports multiple values', () => {
    const a$ = Cell('a')
    const b$ = Cell('b')
    const { result } = renderHook(() => useCellValues(a$, b$), {
      wrapper: ({ children }) => <EngineProvider>{children}</EngineProvider>,
    })

    expect(result.current).toEqual(['a', 'b'])
  })

  describe('provider props', () => {
    it('allows setting initial cell values', () => {
      const { result } = renderHook(() => useCell(cell$), {
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
      const { rerender } = render(
        <EngineProvider initWith={{ [cell$]: '1' }}>
          <Child />
        </EngineProvider>
      )

      expect(screen.getByTestId('cell-value')).toHaveTextContent('1')

      rerender(
        <EngineProvider updateWith={{ [cell$]: '2' }}>
          <Child />
        </EngineProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('cell-value')).toHaveTextContent('2')
      })
    })
  })
})
