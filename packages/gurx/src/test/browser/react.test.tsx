import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { Action, Cell, RealmProvider, mapTo, useCell, useCellValue, useCellValues, usePublisher } from '../../'
import { renderHook } from './renderHook'

const cell$ = Cell('hello')

describe('gurx realm react', () => {
  it('gets a cell value with useCell', () => {
    const { result } = renderHook(useCell, {
      initialProps: cell$,
      wrapper: RealmProvider,
    })
    expect(result.current?.[0]).toEqual('hello')
  })

  it('has working setters', () => {
    const { result, rerender } = renderHook(useCell, {
      initialProps: cell$,
      wrapper: RealmProvider,
    })
    expect(result.current?.[0]).toEqual('hello')
    result.current?.[1]('world')
    rerender(cell$)
    expect(result.current?.[0]).toEqual('world')
  })

  it('supports actions', () => {
    const cell = Cell('hello')

    const action = Action((r) => {
      r.link(r.pipe(action, mapTo('world')), cell)
    })

    const { result, rerender } = renderHook(
      () => {
        const proc = usePublisher(action)
        const value = useCellValue(cell)
        return [value, proc] as const
      },
      { wrapper: RealmProvider, initialProps: undefined }
    )
    expect(result.current?.[0]).toEqual('hello')
    result.current?.[1]()
    rerender(undefined)
    expect(result.current?.[0]).toEqual('world')
  })

  it('supports multiple values', () => {
    const a = Cell('a')
    const b = Cell('b')
    const { result } = renderHook(() => useCellValues(a, b), {
      wrapper: RealmProvider,
      initialProps: undefined,
    })

    expect(result.current).toEqual(['a', 'b'])
  })

  describe('provider props', () => {
    it('allows setting initial cell values', () => {
      const { result } = renderHook(useCell, {
        initialProps: cell$,
        wrapper: ({ children }) => {
          return <RealmProvider initWith={{ [cell$]: 'world' }}>{children}</RealmProvider>
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
        <RealmProvider initWith={{ [cell$]: '1' }}>
          <Child />
        </RealmProvider>
      )

      await expect.element(screen.getByTestId('cell-value')).toHaveTextContent('1')

      screen.rerender(
        <RealmProvider updateWith={{ [cell$]: '2' }}>
          <Child />
        </RealmProvider>
      )

      await expect.element(screen.getByTestId('cell-value')).toHaveTextContent('2')
    })
  })
})
