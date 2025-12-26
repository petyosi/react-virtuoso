/// <reference types="@vitest/browser/matchers" />

import { describe, expect, it } from 'vitest'
import { render, renderHook } from 'vitest-browser-react'

import { Action, Cell, mapTo, RealmProvider, useCell, useCellValue, useCellValues, usePublisher } from '../../'

const cell$ = Cell('hello')

describe('gurx realm react', () => {
  it('gets a cell value with useCell', async () => {
    const { result } = await renderHook(() => useCell(cell$), {
      wrapper: RealmProvider,
    })
    expect(result.current[0]).toEqual('hello')
  })

  it('has working setters', async () => {
    const { act, rerender, result } = await renderHook(() => useCell(cell$), {
      wrapper: RealmProvider,
    })
    expect(result.current[0]).toEqual('hello')
    await act(() => {
      result.current[1]('world')
    })
    await rerender()
    expect(result.current[0]).toEqual('world')
  })

  it('supports actions', async () => {
    const cell = Cell('hello')

    const action = Action((r) => {
      r.link(r.pipe(action, mapTo('world')), cell)
    })

    const { act, rerender, result } = await renderHook(
      () => {
        const proc = usePublisher(action)
        const value = useCellValue(cell)
        return [value, proc] as const
      },
      { wrapper: RealmProvider }
    )
    expect(result.current[0]).toEqual('hello')
    await act(() => {
      result.current[1]()
    })
    await rerender()
    expect(result.current[0]).toEqual('world')
  })

  it('supports multiple values', async () => {
    const a = Cell('a')
    const b = Cell('b')
    const { result } = await renderHook(() => useCellValues(a, b), {
      wrapper: RealmProvider,
    })

    expect(result.current).toEqual(['a', 'b'])
  })

  describe('provider props', () => {
    it('allows setting initial cell values', async () => {
      const { result } = await renderHook(() => useCell(cell$), {
        wrapper: ({ children }) => {
          return <RealmProvider initWith={{ [cell$]: 'world' }}>{children}</RealmProvider>
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
        <RealmProvider initWith={{ [cell$]: '1' }}>
          <Child />
        </RealmProvider>
      )

      await expect.element(screen.getByTestId('cell-value')).toHaveTextContent('1')

      await screen.rerender(
        <RealmProvider updateWith={{ [cell$]: '2' }}>
          <Child />
        </RealmProvider>
      )

      await expect.element(screen.getByTestId('cell-value')).toHaveTextContent('2')
    })
  })
})
