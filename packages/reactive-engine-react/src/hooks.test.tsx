/** biome-ignore-all lint/suspicious/noExplicitAny: tests */

import { render, renderHook, screen, waitFor } from '@testing-library/react'
import { Cell, e, mapTo, Trigger } from '@virtuoso.dev/reactive-engine-core'
import { describe, expect, it } from 'vitest'

import { EngineProvider } from './EngineProvider'
import { useCell, useCellValue, useCellValues, usePublisher } from './hooks'

const cell$ = Cell('hello')
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

describe('Reactive Engine in React', () => {
  it('gets a cell value with useCell', () => {
    const { result } = renderHook(() => useCell(cell$), {
      wrapper: ({ children }) => (
        <EngineProvider initFn={noop} updateDeps={[]} updateFn={noop}>
          {children}
        </EngineProvider>
      ),
    })
    expect(result.current[0]).toEqual('hello')
  })

  it('has working setters', async () => {
    const { rerender, result } = renderHook(() => useCell(cell$), {
      wrapper: ({ children }) => (
        <EngineProvider initFn={noop} updateDeps={[]} updateFn={noop}>
          {children}
        </EngineProvider>
      ),
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
      {
        wrapper: ({ children }) => (
          <EngineProvider initFn={noop} updateDeps={[]} updateFn={noop}>
            {children}
          </EngineProvider>
        ),
      }
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
      wrapper: ({ children }) => (
        <EngineProvider initFn={noop} updateDeps={[]} updateFn={noop}>
          {children}
        </EngineProvider>
      ),
    })

    expect(result.current).toEqual(['a', 'b'])
  })

  describe('provider props', () => {
    it('allows setting initial cell values', () => {
      const { result } = renderHook(() => useCell(cell$), {
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

      const { rerender } = render(<Wrapper value="1" />)

      expect(screen.getByTestId('cell-value')).toHaveTextContent('1')

      rerender(<Wrapper value="2" />)

      await waitFor(() => {
        expect(screen.getByTestId('cell-value')).toHaveTextContent('2')
      })
    })
  })
})
