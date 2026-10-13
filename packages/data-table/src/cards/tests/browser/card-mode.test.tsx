import React from 'react'

import { useEngineRef, usePublisher, useCellValue } from '@virtuoso.dev/reactive-engine-react'
import { expect, test, vi } from 'vitest'
import { render, renderHook } from 'vitest-browser-react'

import {
  Cell,
  Column,
  ColumnHeader,
  localModel,
  scrollIntoView$,
  scrollToRow$,
  VirtuosoDataTable,
  dispatchModelAction$,
  modelActionState$,
  remoteModel,
  defaultOffsetViewportHandler,
  defaultAppendViewportHandler,
} from '../../..'
import { columnWidthOverrides$ } from '../../../columns/column-width-overrides'
import { dataTableStructureEntries$ } from '../../../resize/resize-observing'
import { itemHeight$, sizeState$ } from '../../../resize/sizes'
import { rowsState$, viewportRange$ } from '../../../rows/row-state'
import { pendingScrollToInitialLocation$ } from '../../../scroll/state'
import { cardGeometry } from '../../geometry'
import { cardMeasurement$ } from '../../state'

import type { CardComponentProps, VirtuosoDataTableProps, LoadingComponentProps, AppendFetchParams } from '../../..'

const items = Array.from({ length: 1000 }, (_, id) => ({ id, name: `Service ${id}` }))
type Item = (typeof items)[number]
const cardSelector = '[data-table-element-role="card"]'
const scrollerSelector = '[data-testid="virtuoso-table-scroller"]'

function Card({ data }: CardComponentProps<Item>) {
  return <article style={{ height: 'var(--card-height, 120px)' }}>{data.name}</article>
}

function Header() {
  return <div style={{ height: 40 }}>Card controls</div>
}
const components = { Card, CardHeader: Header }

function Fixture({ variableRows = false, ...props }: VirtuosoDataTableProps<Item, unknown> & { variableRows?: boolean }) {
  return (
    <>
      <style>{`.test-card-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--row-gap, 12px) var(--column-gap, 10px); }
        .test-card-flex { display: flex; flex-wrap: wrap; gap: 12px var(--column-gap, 10px); }
        .test-card-flex > [data-table-element-role="card"] { width: var(--card-width, 160px); flex-shrink: 0; }`}</style>
      <VirtuosoDataTable
        mode="card"
        components={components}
        cardListClassName="test-card-list"
        style={{ height: 300, width: 500 }}
        {...props}
      >
        <Column field="name">
          <ColumnHeader>{() => <div style={{ height: 40, width: 300 }}>Name</div>}</ColumnHeader>
          <Cell>
            {({ cellValue, row }) => (
              <div style={{ height: `calc(var(--row-height, 30px) + ${variableRows ? (row.index % 2) * 24 : 0}px)` }}>
                {String(cellValue)}
              </div>
            )}
          </Cell>
        </Column>
      </VirtuosoDataTable>
    </>
  )
}

test('auto-measures equal cards, virtualizes lines, resizes, and uses card item indexes for scrolling', async () => {
  const { result } = await renderHook(() => useEngineRef())
  const model = localModel({ data: items })
  const screen = await render(<Fixture model={model} engineRef={result.current} />)
  const engine = result.current.current!
  await expect.poll(() => screen.container.querySelectorAll(cardSelector).length).toBe(6)
  expect(engine.getValue(cardMeasurement$)).toMatchObject({ width: 160, height: 120 })
  expect(engine.getValue(sizeState$).lastSize).not.toBe(120)
  const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
  expect(scroller.scrollHeight).toBe(40 + 334 * 132 - 12)
  engine.pub(scrollToRow$, 300)
  await expect.poll(() => scroller.scrollTop).toBe(13200)
  await expect.poll(() => screen.container.querySelector<HTMLElement>(cardSelector)?.dataset.index).toBe('300')
  const done = vi.fn()
  engine.pub(scrollIntoView$, { index: 301, done })
  expect(done).toHaveBeenCalledOnce()
  await screen.rerender(
    <Fixture
      model={model}
      engineRef={result.current}
      style={{ height: 300, width: 330, '--card-height': '180px' } as React.CSSProperties}
    />
  )
  await expect.poll(() => engine.getValue(cardMeasurement$)).toMatchObject({ width: 160, height: 180, containerWidth: 330 })
  engine.pub(scrollToRow$, { index: 100, align: 'center' })
  await expect.poll(() => scroller.scrollTop).toBe(50 * 192 - 40)
})

test('switches without reconnecting the model or reusing row measurements', async () => {
  const { result } = await renderHook(() => useEngineRef())
  const model = localModel({ data: items })
  const send = vi.spyOn(model, 'send')
  const screen = await render(<Fixture mode="table" model={model} engineRef={result.current} />)
  const engine = result.current.current!
  await expect.poll(() => engine.getValue(sizeState$).lastSize).toBe(30)
  const columnWidths = new Map([['name', 320]])
  engine.pub(columnWidthOverrides$, columnWidths)
  engine.pub(scrollToRow$, 200)
  await screen.rerender(<Fixture model={model} engineRef={result.current} />)
  await expect.poll(() => engine.getValue(cardMeasurement$).height).toBe(120)
  expect(engine.getValue(sizeState$).lastSize).not.toBe(120)
  expect((screen.container.querySelector(scrollerSelector) as HTMLElement).scrollTop).toBe(0)
  engine.pub(scrollToRow$, { index: 800, behavior: 'smooth' })
  await screen.rerender(<Fixture mode="table" model={model} engineRef={result.current} />)
  await expect.poll(() => engine.getValue(sizeState$).lastSize).toBe(30)
  expect(engine.getValue(cardMeasurement$).height).toBe(0)
  expect(engine.getValue(columnWidthOverrides$)).toBe(columnWidths)
  await expect.poll(() => engine.getValue(pendingScrollToInitialLocation$)).toBeNull()
  await expect
    .poll(() => ({ stable: engine.getValue(rowsState$).stable, count: engine.getValue(rowsState$).rows.length }))
    .toEqual({ stable: true, count: 9 })
  await expect.poll(() => engine.getValue(viewportRange$)).toEqual({ startIndex: 0, endIndex: 8 })
  await expect.poll(() => (screen.container.querySelector(scrollerSelector) as HTMLElement).scrollTop).toBe(0)
  expect(send.mock.calls.filter(([message]) => message.action === 'handshake')).toHaveLength(1)
  expect(send.mock.calls.filter(([message]) => message.action === 'disconnect')).toHaveLength(0)
  await screen.rerender(<Fixture model={model} engineRef={result.current} />)
  await expect.poll(() => engine.getValue(cardMeasurement$).height).toBe(120)
  await screen.rerender(<Fixture mode="table" model={model} engineRef={result.current} />)
  await expect.poll(() => engine.getValue(pendingScrollToInitialLocation$)).toBeNull()
  await expect.poll(() => engine.getValue(viewportRange$)).toEqual({ startIndex: 0, endIndex: 8 })
})

test('recovers from empty data, missing cards, and grouped data', async () => {
  const model = localModel({ data: [] as Item[] })
  const screen = await render(<Fixture model={model} EmptyPlaceholder={() => <div>No services</div>} />)
  await expect.element(screen.getByText('No services')).toBeVisible()
  model.setData?.(items)
  await expect.poll(() => screen.container.querySelectorAll(cardSelector).length).toBe(6)
  await screen.rerender(<Fixture model={model} components={{}} />)
  await expect.element(screen.getByRole('alert')).toHaveTextContent('Card mode requires components.Card.')
  await screen.rerender(<Fixture model={model} />)
  model.setData?.(items, [{ index: 0, level: 0 }])
  await expect.element(screen.getByRole('alert')).toHaveTextContent('Card mode requires ungrouped model data.')
  model.setData?.(items, [])
  await expect.poll(() => screen.container.querySelectorAll(cardSelector).length).toBe(6)
})

test('applies the initial location after measuring the card probe', async () => {
  const screen = await render(<Fixture model={localModel({ data: items })} initialLocation={300} />)
  await expect.poll(() => (screen.container.querySelector(scrollerSelector) as HTMLElement).scrollTop).toBe(13200)
})

test('inactive variable-height rows remeasure without using card dimensions', async () => {
  const { result } = await renderHook(() => useEngineRef())
  const model = localModel({ data: items })
  const screen = await render(<Fixture model={model} engineRef={result.current} mode="table" variableRows />)
  const engine = result.current.current!
  await expect.poll(() => engine.getValue(itemHeight$)(items[1])).toBe(54)
  await screen.rerender(<Fixture model={model} engineRef={result.current} variableRows />)
  await expect.poll(() => engine.getValue(cardMeasurement$).height).toBe(120)
  model.setData?.(items.slice(0, 40))
  await screen.rerender(
    <Fixture
      model={model}
      engineRef={result.current}
      variableRows
      style={{ height: 300, width: 330, '--row-height': '48px' } as React.CSSProperties}
    />
  )
  await expect.poll(() => engine.getValue(cardMeasurement$).containerWidth).toBe(330)
  expect(engine.getValue(itemHeight$)(items[0])).toBe(0)
  await screen.rerender(
    <Fixture
      model={model}
      engineRef={result.current}
      mode="table"
      variableRows
      style={{ height: 300, width: 330, '--row-height': '48px' } as React.CSSProperties}
    />
  )
  await expect.poll(() => engine.getValue(itemHeight$)(items[0])).toBe(48)
  await expect.poll(() => engine.getValue(itemHeight$)(items[1])).toBe(72)
  expect(engine.getValue(cardMeasurement$).height).toBe(0)
})

test('fractional widths, CSS gaps, short grids, flex wrapping, and rendered-data callbacks', async () => {
  const { result } = await renderHook(() => useEngineRef())
  const model = localModel({ data: items })
  const rendered = vi.fn<(data: unknown[]) => void>()
  const screen = await render(
    <Fixture
      model={model}
      engineRef={result.current}
      onRenderedDataChange={rendered}
      increaseViewportBy={132}
      style={{ height: 300, width: 501 }}
    />
  )
  const engine = result.current.current!
  await expect.poll(() => engine.getValue(cardMeasurement$).width).toBeCloseTo(160.33, 1)
  await expect.poll(() => screen.container.querySelectorAll(cardSelector).length).toBe(9)
  await expect.poll(() => rendered.mock.lastCall?.[0]).toEqual(items.slice(0, 9))
  await screen.rerender(
    <Fixture
      model={model}
      engineRef={result.current}
      style={{ height: 300, width: 501, '--row-gap': '20px', '--column-gap': '14px' } as React.CSSProperties}
    />
  )
  await expect.poll(() => engine.getValue(cardMeasurement$)).toMatchObject({ rowGap: 20, columnGap: 14 })
  expect((screen.container.querySelector(scrollerSelector) as HTMLElement).scrollHeight).toBe(40 + 500 * 140 - 20)
  model.setData?.(items.slice(0, 2))
  await expect.poll(() => screen.container.querySelectorAll(cardSelector).length).toBe(2)
  await expect.poll(() => screen.container.querySelector('[data-table-element-role="card-list"]')?.getBoundingClientRect().height).toBe(120)
  model.setData?.(items)
  await screen.rerender(<Fixture model={model} engineRef={result.current} cardListClassName="test-card-flex" />)
  await expect.poll(() => screen.container.querySelectorAll(cardSelector).length).toBe(6)
  engine.pub(scrollToRow$, 300)
  await expect.poll(() => screen.container.querySelector<HTMLElement>(cardSelector)?.dataset.index).toBe('300')
  const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
  scroller.scrollTop = 0
  await expect.poll(() => screen.container.querySelector<HTMLElement>(cardSelector)?.dataset.index).toBe('0')
  engine.pub(scrollToRow$, 300)
  await expect.poll(() => screen.container.querySelector<HTMLElement>(cardSelector)?.dataset.index).toBe('300')
})

test.each([
  { width: 499.75, cardWidth: 160, gap: 10, className: 'test-card-flex', columns: 2 },
  { width: 600, cardWidth: 200.1, gap: 0, className: 'test-card-flex', columns: 2 },
  { width: 501.015625, cardWidth: 160, gap: 10, className: 'test-card-list', columns: 3 },
])('matches CSS wrapping and scroll targets at width $width', async ({ width, cardWidth, gap, className, columns }) => {
  const { result } = await renderHook(() => useEngineRef())
  const screen = await render(
    <Fixture
      model={localModel({ data: items })}
      engineRef={result.current}
      cardListClassName={className}
      style={{ height: 300, width, '--card-width': `${cardWidth}px`, '--column-gap': `${gap}px` } as React.CSSProperties}
    />
  )
  const engine = result.current.current!
  await expect.poll(() => cardGeometry(engine.getValue(cardMeasurement$), items.length).columns).toBe(columns)
  await expect.poll(() => screen.container.querySelectorAll(cardSelector).length).toBe(columns * 2)
  const cards = screen.container.querySelectorAll<HTMLElement>(cardSelector)
  expect(cards[columns - 1]!.getBoundingClientRect().top).toBe(cards[0]!.getBoundingClientRect().top)
  expect(cards[columns]!.getBoundingClientRect().top - cards[0]!.getBoundingClientRect().top).toBe(132)
  const scroller = screen.container.querySelector<HTMLElement>(scrollerSelector)!
  expect(scroller.scrollHeight).toBe(40 + Math.ceil(items.length / columns) * 132 - 12)
  engine.pub(scrollToRow$, { index: 300, align: 'start' })
  await expect.poll(() => scroller.scrollTop).toBe((300 / columns) * 132)
  await expect.poll(() => screen.container.querySelector<HTMLElement>(cardSelector)?.dataset.index).toBe('300')
})

test('reaches an incomplete final line with start, end, and smooth alignment', async () => {
  const { result } = await renderHook(() => useEngineRef())
  const screen = await render(<Fixture model={localModel({ data: items })} engineRef={result.current} />)
  const engine = result.current.current!
  const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
  await expect.poll(() => engine.getValue(cardMeasurement$).height).toBe(120)
  engine.pub(scrollToRow$, { index: 'LAST', align: 'start', behavior: () => ({ animationFrameCount: 2, easing: (x) => x }) })
  await expect.poll(() => scroller.scrollTop).toBe(333 * 132)
  await expect.element(screen.getByText('Service 999', { exact: true })).toBeVisible()
  engine.pub(scrollToRow$, { index: 'LAST', align: 'end' })
  await expect.poll(() => scroller.scrollTop).toBe(333 * 132 + 120 - 260)
  expect(scroller.scrollHeight).toBe(40 + 334 * 132 - 12)
})

test('header actions share sorting and filtering state across presentations', async () => {
  function Controls() {
    const dispatch = usePublisher(dispatchModelAction$)
    const state = useCellValue(modelActionState$)
    return (
      <div>
        <button onClick={() => dispatch({ action: 'filter', payload: 'Service 9' })}>Filter</button>
        <button onClick={() => dispatch({ action: 'sort', payload: true })}>Descending</button>
        <output>{JSON.stringify(state)}</output>
      </div>
    )
  }
  const model = localModel<Item>({
    data: items,
    pipeline: ['filter', 'sort'],
    actions: {
      filter: {
        stage: 'filter',
        handler: ({ data, payload }: { data: Item[]; payload: unknown }) => data.filter((item) => item.name.startsWith(String(payload))),
      },
      sort: { stage: 'sort', handler: ({ data }: { data: Item[] }) => data.toSorted((a, b) => b.id - a.id) },
    },
  })
  const screen = await render(<Fixture model={model} components={{ Card, CardHeader: Controls }} />)
  await screen.getByRole('button', { name: 'Filter', exact: true }).click()
  await screen.getByRole('button', { name: 'Descending' }).click()
  await expect.poll(() => screen.container.querySelector(cardSelector)?.textContent).toBe('Service 999')
  await screen.rerender(<Fixture model={model} mode="table" components={{ Card, CardHeader: Controls }} />)
  await expect.poll(() => screen.container.querySelector('[data-testid="virtuoso-table-row"]')?.textContent).toBe('Service 999')
  await screen.rerender(<Fixture model={model} components={{ Card, CardHeader: Controls }} />)
  await expect.element(screen.getByRole('status')).toHaveTextContent('Service 9')
})

test('remeasures after hidden mount and ignores detached table observations', async () => {
  const { result } = await renderHook(() => useEngineRef())
  const model = localModel({ data: items })
  const screen = await render(<Fixture model={model} engineRef={result.current} style={{ display: 'none', height: 300, width: 500 }} />)
  const engine = result.current.current!
  expect(engine.getValue(cardMeasurement$).width).toBe(0)
  expect(engine.getValue(viewportRange$)).toBeNull()
  await screen.rerender(<Fixture model={model} engineRef={result.current} />)
  await expect.poll(() => engine.getValue(cardMeasurement$).height).toBe(120)
  const before = engine.getValue(sizeState$)
  const detachedRow = document.createElement('div')
  detachedRow.dataset.tableElementRole = 'row'
  detachedRow.dataset.index = '0'
  engine.pub(dataTableStructureEntries$, [
    { target: detachedRow, contentRect: { height: 999 }, borderBoxSize: [{ blockSize: 999 }] } as unknown as ResizeObserverEntry,
  ])
  expect(engine.getValue(sizeState$)).toBe(before)
  expect(engine.getValue(cardMeasurement$).height).toBe(120)
})

test('custom scroll parents translate card commands and resize the render window', async () => {
  const { result } = await renderHook(() => useEngineRef())
  const model = localModel({ data: items })
  function Custom({ mode = 'card' }: { mode?: 'card' | 'table' }) {
    const [parent, setParent] = React.useState<HTMLDivElement | null>(null)
    return (
      <div ref={setParent} style={{ overflow: 'auto', height: 300, width: 500 }} data-testid="parent">
        <div style={{ height: 80 }}>Before list</div>
        <Fixture mode={mode} model={model} engineRef={result.current} customScrollParent={parent} style={{ width: 500 }} />
      </div>
    )
  }
  const screen = await render(<Custom />)
  const parent = screen.container.querySelector('[data-testid="parent"]') as HTMLElement
  const engine = result.current.current!
  await expect.poll(() => engine.getValue(cardMeasurement$).height).toBe(120)
  engine.pub(scrollToRow$, 300)
  await expect.poll(() => parent.scrollTop).toBe(13280)
  await expect.poll(() => screen.container.querySelector<HTMLElement>(cardSelector)?.dataset.index).toBe('300')
  await screen.rerender(<Custom mode="table" />)
  await expect.poll(() => parent.scrollTop).toBe(80)
  await screen.rerender(<Custom />)
  await expect.poll(() => parent.scrollTop).toBe(80)
  engine.pub(scrollToRow$, 30)
  await expect.poll(() => parent.scrollTop).toBe(1400)
})

test('window scrolling renders only the visible card lines and honors commands', async () => {
  const { result } = await renderHook(() => useEngineRef())
  const screen = await render(
    <Fixture model={localModel({ data: items })} engineRef={result.current} useWindowScroll style={{ width: 500 }} />
  )
  const engine = result.current.current!
  await expect.poll(() => engine.getValue(cardMeasurement$).height).toBe(120)
  expect(screen.container.querySelectorAll(cardSelector).length).toBeLessThan(100)
  engine.pub(scrollToRow$, 300)
  await expect.poll(() => screen.container.querySelector<HTMLElement>(cardSelector)?.dataset.index).toBe('300')
  await screen.unmount()
  window.scrollTo(0, 0)
})

test('initial center alignment can bring an offscreen custom-parent grid into view', async () => {
  const { result } = await renderHook(() => useEngineRef())
  const model = localModel({ data: items })
  function Offscreen() {
    const [parent, setParent] = React.useState<HTMLDivElement | null>(null)
    return (
      <div ref={setParent} data-testid="offscreen-parent" style={{ height: 300, width: 500, overflow: 'auto' }}>
        <div style={{ height: 1000 }}>Content before cards</div>
        <Fixture
          model={model}
          engineRef={result.current}
          customScrollParent={parent}
          initialLocation={{ index: 300, align: 'center' }}
          style={{ width: 500 }}
        />
      </div>
    )
  }
  const screen = await render(<Offscreen />)
  const parent = screen.container.querySelector('[data-testid="offscreen-parent"]') as HTMLElement
  await expect.poll(() => parent.scrollTop).toBe(1000 + 13200 - 70)
  await expect.element(screen.getByText('Service 300', { exact: true })).toBeVisible()
  expect(parent.scrollHeight).toBe(1000 + 40 + 334 * 132 - 12)
})

function Loading({ loadingState }: LoadingComponentProps) {
  return <div role="status">{JSON.stringify(loadingState)}</div>
}

test('offset loading requests item indexes and keeps in-flight work during switches', async () => {
  const initial = Promise.withResolvers<void>()
  const fetch = vi.fn(async ({ offset, limit }: { offset: number; limit: number }) => {
    await initial.promise
    return { rows: items.slice(offset, offset + limit), totalCount: items.length }
  })
  const model = remoteModel<Item>({
    fetch,
    initialParams: {},
    pageSize: 20,
    placeholder: { id: -1, name: 'Loading service' },
    onViewportChange: defaultOffsetViewportHandler,
  })
  const send = vi.spyOn(model, 'send')
  const { result } = await renderHook(() => useEngineRef())
  const screen = await render(
    <Fixture model={model} engineRef={result.current} components={{ ...components, LoadingPlaceholder: Loading }} />
  )
  await expect.element(screen.getByRole('status')).toHaveTextContent('loading')
  await screen.rerender(<Fixture model={model} engineRef={result.current} mode="table" />)
  initial.resolve()
  await expect.poll(() => screen.container.querySelector('[data-testid="virtuoso-table-row"]')).not.toBeNull()
  await screen.rerender(<Fixture model={model} engineRef={result.current} />)
  await expect.poll(() => result.current.current!.getValue(cardMeasurement$).height).toBe(120)
  result.current.current!.pub(scrollToRow$, 300)
  await expect.poll(() => screen.container.querySelector(cardSelector)?.textContent).toBe('Service 300')
  expect(fetch.mock.calls.some(([request]) => request.offset <= 300 && request.offset + request.limit > 300)).toBe(true)
  expect(send.mock.calls.filter(([message]) => message.action === 'handshake')).toHaveLength(1)
})

test('append loading, errors, and explicit retry survive presentation changes', async () => {
  const nextPage = Promise.withResolvers<void>()
  let fail = true
  const fetch = vi.fn(async ({ cursor, limit }: AppendFetchParams) => {
    const start = Number(cursor ?? 0)
    if (start > 0) {
      await nextPage.promise
      if (fail) {
        throw new Error('Page failed')
      }
    }
    return { rows: items.slice(start, start + limit), cursor: start + limit, hasMore: start + limit < items.length }
  })
  const model = remoteModel<Item>({
    mode: 'append',
    fetch,
    initialParams: {},
    pageSize: 30,
    onViewportChange: defaultAppendViewportHandler,
    onError: () => {},
  })
  const { result } = await renderHook(() => useEngineRef())
  const slots = { ...components, LoadingFooter: Loading }
  const screen = await render(<Fixture model={model} engineRef={result.current} components={slots} />)
  await expect.poll(() => result.current.current!.getValue(cardMeasurement$).height).toBe(120)
  result.current.current!.pub(scrollToRow$, { index: 'LAST', align: 'end' })
  await expect.element(screen.getByRole('status')).toHaveTextContent('loading')
  await screen.rerender(<Fixture model={model} engineRef={result.current} components={slots} mode="table" />)
  nextPage.resolve()
  await expect.element(screen.getByRole('status')).toHaveTextContent('Page failed')
  await screen.rerender(<Fixture model={model} engineRef={result.current} components={slots} />)
  await expect.element(screen.getByRole('status')).toHaveTextContent('Page failed')
  fail = false
  model.send({ action: 'loadMore' })
  await expect.poll(() => screen.container.querySelector('[role="status"]')).toBeNull()
  expect(fetch).toHaveBeenCalledTimes(3)
})
