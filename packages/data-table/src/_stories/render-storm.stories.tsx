import React from 'react'
import type { CSSProperties } from 'react'

import { useEngine, usePublisher } from '@virtuoso.dev/reactive-engine-react'

import { unstableEnableRowRenderEvents$, unstableRowRender$, Cell } from '..'
import { Column } from '../columns/Column'
import { ColumnHeader } from '../columns/ColumnHeader'
import { LocalDataTable as VirtuosoDataTable } from '../tests/LocalDataTable'

import type { UnstableRowRenderEvent } from '..'

const ROW_COUNT = 2000
const WIDE_COLUMN_COUNT = 24

const COLUMN_KEYS = Array.from({ length: WIDE_COLUMN_COUNT }, (_, index) => `metric_${index + 1}`)

const ROWS = Array.from({ length: ROW_COUNT }, (_, rowIndex) => {
  const row: Record<string, string | number> = {
    rowId: `row-${rowIndex + 1}`,
    owner: `Owner ${rowIndex % 37}`,
  }

  for (let columnIndex = 0; columnIndex < WIDE_COLUMN_COUNT; columnIndex++) {
    row[COLUMN_KEYS[columnIndex]!] = `${rowIndex + 1}:${columnIndex + 1}:${(rowIndex * 17 + columnIndex * 31) % 10_000}`
  }

  return row
})

const PAGE_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '340px minmax(0, 1fr)',
  gap: 16,
  padding: 16,
  alignItems: 'start',
}

const PANEL_STYLE: CSSProperties = {
  border: '1px solid #d0d7de',
  borderRadius: 12,
  padding: 16,
  background: '#fbfcfe',
  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
}

const PANEL_TITLE_STYLE: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: 0,
}

const PANEL_COPY_STYLE: CSSProperties = {
  margin: '8px 0 0',
  lineHeight: 1.45,
  color: '#344054',
}

const METRIC_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  marginTop: 16,
}

const METRIC_CARD_STYLE: CSSProperties = {
  border: '1px solid #e4e7ec',
  borderRadius: 10,
  padding: 12,
  background: 'white',
}

const METRIC_LABEL_STYLE: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#475467',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const METRIC_VALUE_STYLE: CSSProperties = {
  marginTop: 6,
  fontSize: 28,
  fontWeight: 700,
  lineHeight: 1,
}

const BUTTON_STYLE: CSSProperties = {
  marginTop: 16,
  border: '1px solid #98a2b3',
  borderRadius: 8,
  background: 'white',
  padding: '8px 12px',
  cursor: 'pointer',
  fontWeight: 600,
}

const TABLE_STYLE: CSSProperties = {
  height: 560,
  width: 960,
  border: '1px solid #d0d7de',
}

const HEADER_CELL_STYLE: CSSProperties = {
  width: 210,
  padding: '10px 12px',
  fontWeight: 700,
  borderBottom: '1px solid #d0d7de',
  background: '#f8fafc',
  boxSizing: 'border-box',
}

const STICKY_HEADER_CELL_STYLE: CSSProperties = {
  ...HEADER_CELL_STYLE,
  width: 140,
  background: '#eef2ff',
}

const BODY_CELL_STYLE: CSSProperties = {
  width: 210,
  padding: '10px 12px',
  borderBottom: '1px solid #eaecf0',
  boxSizing: 'border-box',
  whiteSpace: 'nowrap',
}

const STICKY_BODY_CELL_STYLE: CSSProperties = {
  ...BODY_CELL_STYLE,
  width: 140,
  background: '#f8f9ff',
  fontWeight: 600,
}

interface RenderStats {
  row: number
  scrollable: number
  stickyLeft: number
  stickyRight: number
}

function emptyRenderStats(): RenderStats {
  return {
    row: 0,
    scrollable: 0,
    stickyLeft: 0,
    stickyRight: 0,
  }
}

function resetStats(stats: React.RefObject<RenderStats>) {
  stats.current = emptyRenderStats()
}

function expensiveFormat(value: unknown) {
  const source = String(value ?? '')
  let hash = 0

  for (let outer = 0; outer < 140; outer++) {
    for (let inner = 0; inner < source.length; inner++) {
      hash = (hash * 33 + (source.codePointAt(inner) ?? 0) + outer + inner) % 1_000_003
    }
  }

  return `${source} | ${hash.toString(16).padStart(5, '0')}`
}

function RowRenderMetricsBridge({ onRowRender }: { onRowRender: (event: UnstableRowRenderEvent) => void }) {
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

const RenderStormTable = React.memo(function RenderStormTable({ onRowRender }: { onRowRender: (event: UnstableRowRenderEvent) => void }) {
  return (
    <VirtuosoDataTable style={TABLE_STYLE} source={ROWS}>
      <RowRenderMetricsBridge onRowRender={onRowRender} />

      <Column field="rowId" sticky="left">
        <ColumnHeader>{() => <div style={STICKY_HEADER_CELL_STYLE}>Row ID</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div style={STICKY_BODY_CELL_STYLE}>{String(cellValue)}</div>}</Cell>
      </Column>

      <Column field="owner" sticky="left">
        <ColumnHeader>{() => <div style={STICKY_HEADER_CELL_STYLE}>Owner</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div style={STICKY_BODY_CELL_STYLE}>{expensiveFormat(cellValue)}</div>}</Cell>
      </Column>

      {COLUMN_KEYS.map((key, index) => (
        <Column field={key} key={key}>
          <ColumnHeader>{() => <div style={HEADER_CELL_STYLE}>Metric {index + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={BODY_CELL_STYLE}>{expensiveFormat(cellValue)}</div>}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
})

function MetricsPanel({ stats }: { stats: React.RefObject<RenderStats> }) {
  const [snapshot, setSnapshot] = React.useState(() => ({ ...stats.current }))

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setSnapshot({ ...stats.current })
    }, 150)

    return () => {
      window.clearInterval(interval)
    }
  }, [stats])

  return (
    <div style={PANEL_STYLE}>
      <h2 style={PANEL_TITLE_STYLE}>Render Storm</h2>
      <p style={PANEL_COPY_STYLE}>
        Reset the counters, then drag the table horizontally. These numbers come from the table&apos;s own unstable engine stream, not from
        a React-only counter inside the story.
      </p>
      <p style={PANEL_COPY_STYLE}>
        If the row-level optimization is working, <code>Row Commits</code> should stay flatter than <code>Scrollable Commits</code>. If the
        row architecture is still broad, both numbers jump together.
      </p>

      <div style={METRIC_GRID_STYLE}>
        <div style={METRIC_CARD_STYLE}>
          <div style={METRIC_LABEL_STYLE}>Row Commits</div>
          <div style={METRIC_VALUE_STYLE}>{snapshot.row.toLocaleString()}</div>
        </div>
        <div style={METRIC_CARD_STYLE}>
          <div style={METRIC_LABEL_STYLE}>Scrollable Commits</div>
          <div style={METRIC_VALUE_STYLE}>{snapshot.scrollable.toLocaleString()}</div>
        </div>
        <div style={METRIC_CARD_STYLE}>
          <div style={METRIC_LABEL_STYLE}>Sticky Left Commits</div>
          <div style={METRIC_VALUE_STYLE}>{snapshot.stickyLeft.toLocaleString()}</div>
        </div>
        <div style={METRIC_CARD_STYLE}>
          <div style={METRIC_LABEL_STYLE}>Sticky Right Commits</div>
          <div style={METRIC_VALUE_STYLE}>{snapshot.stickyRight.toLocaleString()}</div>
        </div>
      </div>

      <button
        type="button"
        style={BUTTON_STYLE}
        onClick={() => {
          resetStats(stats)
          setSnapshot({ ...stats.current })
        }}
      >
        Reset Counters
      </button>
    </div>
  )
}

export function RenderStorm() {
  const stats = React.useRef<RenderStats>(emptyRenderStats())

  const handleRowRender = React.useCallback((event: UnstableRowRenderEvent) => {
    switch (event.section) {
      case 'row': {
        stats.current.row++
        break
      }
      case 'scrollable': {
        stats.current.scrollable++
        break
      }
      case 'sticky-left': {
        stats.current.stickyLeft++
        break
      }
      case 'sticky-right': {
        stats.current.stickyRight++
        break
      }
    }
  }, [])

  return (
    <div style={PAGE_STYLE}>
      <MetricsPanel stats={stats} />
      <RenderStormTable onRowRender={handleRowRender} />
    </div>
  )
}
