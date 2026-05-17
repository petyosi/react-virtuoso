import React from 'react'

import { useEngine, usePublisher } from '@virtuoso.dev/reactive-engine-react'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { unstableEnableRowRenderEvents$, unstableRowRender$, Cell } from '../../..'
import { Column } from '../../../columns/Column'
import { ColumnHeader } from '../../../columns/ColumnHeader'
import { LocalDataTable as VirtuosoDataTable } from '../../../tests/LocalDataTable'

import type { UnstableRowRenderEvent } from '../../..'

const CONTAINER_HEIGHT = 320
const CONTAINER_WIDTH = 500
const COLUMN_WIDTH = 180
const HEADER_HEIGHT = 40
const ROW_HEIGHT = 32

const ITEMS = Array.from({ length: 200 }, (_, rowIndex) => {
  const row: Record<string, string> = {
    id: `row-${rowIndex + 1}`,
  }

  for (let columnIndex = 0; columnIndex < 12; columnIndex++) {
    row[`metric_${columnIndex}`] = `R${rowIndex + 1}C${columnIndex + 1}`
  }

  return row
})

const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const scrollerSelector = '[data-testid=virtuoso-table-scroller]'

function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  return expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

function RowRenderProbe({ onRowRender }: { onRowRender: (event: UnstableRowRenderEvent) => void }) {
  const enableRowRenderEvents = usePublisher(unstableEnableRowRenderEvents$)
  const engine = useEngine()

  React.useLayoutEffect(() => {
    enableRowRenderEvents(true)
    const unsubscribe = engine.sub(unstableRowRender$, onRowRender)

    return () => {
      unsubscribe()
      enableRowRenderEvents(false)
    }
  }, [enableRowRenderEvents, engine, onRowRender])

  return null
}

test('horizontal scroll emits unstable scrollable row render events when enabled', async () => {
  const events: UnstableRowRenderEvent[] = []

  const screen = await render(
    <VirtuosoDataTable style={{ height: CONTAINER_HEIGHT, width: CONTAINER_WIDTH }} source={ITEMS}>
      <RowRenderProbe
        onRowRender={(event) => {
          events.push(event)
        }}
      />
      <Column field="id" sticky="left">
        <ColumnHeader>{() => <div style={{ width: 120, height: HEADER_HEIGHT }}>ID</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ width: 120, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
      </Column>
      {Array.from({ length: 12 }, (_, index) => (
        <Column field={`metric_${index}`} key={`metric_${index}`}>
          <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>Metric {index + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )

  await waitForReady(screen)

  await expect
    .poll(() => {
      return events.filter((event) => event.section === 'row').length
    })
    .toBeGreaterThan(0)

  const scroller = screen.container.querySelector(scrollerSelector) as HTMLElement
  const initialScrollableEventCount = events.filter((event) => event.section === 'scrollable').length

  scroller.scrollLeft = 400

  await expect
    .poll(() => {
      return events.filter((event) => event.section === 'scrollable').length
    })
    .toBeGreaterThan(initialScrollableEventCount)
})
