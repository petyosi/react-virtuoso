import { useState } from 'react'
import type { CSSProperties } from 'react'

import {
  Cell,
  Column,
  ColumnHeader,
  columnWidthOverrides$,
  columnWidths$,
  columns$,
  columnsState$,
  scrollLocation$,
  scrollToRow$,
  setColumnSticky$,
  useEngineRef,
  useRemoteCellValue,
  useRemotePublisher,
  viewportRange$,
} from '..'
import { reorderColumns$ } from '../features/column-reorder'
import { resizeColumn$ } from '../features/column-resize'
import { LocalDataTable as VirtuosoDataTable } from '../tests/LocalDataTable'

import type { ColumnInfo, EngineRef } from '..'

interface DemoRow {
  id: string
  name: string
  status: string
  city: string
  score: string
}

const ITEM_COUNT = 200
const HEADER_HEIGHT = 44
const ROW_HEIGHT = 36
const FIELDS = ['id', 'name', 'status', 'city', 'score'] as const

const ITEMS: DemoRow[] = Array.from({ length: ITEM_COUNT }, (_, index) => ({
  id: `USR-${String(index + 1).padStart(3, '0')}`,
  name: `User ${index + 1}`,
  status: ['Active', 'Pending', 'Paused'][index % 3]!,
  city: ['Sofia', 'Berlin', 'Madrid', 'Oslo'][index % 4]!,
  score: String(1000 + index),
}))

const PAGE_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  alignItems: 'flex-start',
}

const PANEL_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: 320,
  padding: 16,
  border: '1px solid #d7d7d7',
  borderRadius: 12,
  background: '#fafafa',
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  fontSize: 12,
}

const TABLE_STYLE: CSSProperties = {
  height: 360,
  width: 720,
  border: '1px solid #d7d7d7',
  borderRadius: 12,
}

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const BUTTON_STYLE: CSSProperties = {
  border: '1px solid #bdbdbd',
  borderRadius: 8,
  background: 'white',
  padding: '6px 10px',
  cursor: 'pointer',
}

const INPUT_STYLE: CSSProperties = {
  width: 72,
  border: '1px solid #bdbdbd',
  borderRadius: 8,
  padding: '6px 8px',
}

const STACK_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const HEADER_CONTENT_STYLE: CSSProperties = {
  width: '100%',
  height: HEADER_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  boxSizing: 'border-box',
  fontWeight: 600,
  borderBottom: '1px solid #e1e1e1',
  background: '#f4f4f4',
}

const CELL_CONTENT_STYLE: CSSProperties = {
  width: '100%',
  height: ROW_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  boxSizing: 'border-box',
  borderBottom: '1px solid #efefef',
}

function findColumnKey(columns: Map<string, ColumnInfo> | undefined, field: (typeof FIELDS)[number]) {
  return columns ? [...columns].find(([, info]) => info.field === field)?.[0] : undefined
}

function fieldOrder(columns: Map<string, ColumnInfo> | undefined) {
  return columns ? Array.from(columns.values(), (info) => info.field).join(' -> ') : 'loading'
}

function widthsByField(columns: Map<string, ColumnInfo> | undefined, widths: Map<string, number> | undefined) {
  if (!columns || !widths) {
    return 'loading'
  }

  return Array.from(columns, ([key, info]) => `${info.field}:${Math.round(widths.get(key) ?? 0)}`).join(', ')
}

function stickyStateByField(columns: Map<string, ColumnInfo> | undefined, state: Map<string, { sticky?: 'left' | 'right' }> | undefined) {
  if (!columns || !state) {
    return 'loading'
  }

  return Array.from(columns, ([key, info]) => `${info.field}:${state.get(key)?.sticky ?? 'none'}`).join(', ')
}

function RemoteControlTable({ engineRef }: { engineRef: EngineRef }) {
  return (
    <VirtuosoDataTable style={TABLE_STYLE} source={ITEMS} engineRef={engineRef}>
      {FIELDS.map((field) => (
        <Column key={field} field={field}>
          <ColumnHeader>{() => <div style={HEADER_CONTENT_STYLE}>{field}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={CELL_CONTENT_STYLE}>{String(cellValue)}</div>}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

function StoryScaffold({ controls }: { controls: React.ReactNode | ((engineRef: EngineRef) => React.ReactNode) }) {
  const engineRef = useEngineRef()

  return (
    <div style={PAGE_STYLE}>
      <div style={PANEL_STYLE}>{typeof controls === 'function' ? controls(engineRef) : controls}</div>
      <RemoteControlTable engineRef={engineRef} />
    </div>
  )
}

function RemoteColumnReorderControls({ engineRef }: { engineRef: EngineRef }) {
  const columns = useRemoteCellValue(columns$, engineRef)
  const reorderColumns = useRemotePublisher(reorderColumns$, engineRef)
  const statusKey = findColumnKey(columns, 'status')
  const idKey = findColumnKey(columns, 'id')
  const scoreKey = findColumnKey(columns, 'score')
  const cityKey = findColumnKey(columns, 'city')

  return (
    <div style={STACK_STYLE}>
      <strong>Remote Column Reorder</strong>
      <div>Order: {fieldOrder(columns)}</div>
      <div style={BUTTON_ROW_STYLE}>
        <button
          type="button"
          style={BUTTON_STYLE}
          disabled={!statusKey || !idKey}
          onClick={() => {
            if (statusKey && idKey) {
              reorderColumns({ sourceKey: statusKey, targetKey: idKey, position: 'before' })
            }
          }}
        >
          Move status first
        </button>
        <button
          type="button"
          style={BUTTON_STYLE}
          disabled={!cityKey || !scoreKey}
          onClick={() => {
            if (cityKey && scoreKey) {
              reorderColumns({ sourceKey: cityKey, targetKey: scoreKey, position: 'after' })
            }
          }}
        >
          Move city after score
        </button>
      </div>
    </div>
  )
}

function RemoteStickyToggleControls({ engineRef }: { engineRef: EngineRef }) {
  const columns = useRemoteCellValue(columns$, engineRef)
  const columnsState = useRemoteCellValue(columnsState$, engineRef)
  const setColumnSticky = useRemotePublisher(setColumnSticky$, engineRef)
  const statusKey = findColumnKey(columns, 'status')

  return (
    <div style={STACK_STYLE}>
      <strong>Remote Sticky Toggle</strong>
      <div>Sticky: {stickyStateByField(columns, columnsState)}</div>
      <div style={BUTTON_ROW_STYLE}>
        <button
          type="button"
          style={BUTTON_STYLE}
          disabled={!statusKey}
          onClick={() => {
            if (statusKey) {
              setColumnSticky({ key: statusKey, sticky: 'left' })
            }
          }}
        >
          Pin status left
        </button>
        <button
          type="button"
          style={BUTTON_STYLE}
          disabled={!statusKey}
          onClick={() => {
            if (statusKey) {
              setColumnSticky({ key: statusKey, sticky: 'right' })
            }
          }}
        >
          Pin status right
        </button>
        <button
          type="button"
          style={BUTTON_STYLE}
          disabled={!statusKey}
          onClick={() => {
            if (statusKey) {
              setColumnSticky({ key: statusKey, sticky: undefined })
            }
          }}
        >
          Clear sticky
        </button>
      </div>
    </div>
  )
}

function RemoteColumnResizeControls({ engineRef }: { engineRef: EngineRef }) {
  const columns = useRemoteCellValue(columns$, engineRef)
  const widths = useRemoteCellValue(columnWidths$, engineRef)
  const overrides = useRemoteCellValue(columnWidthOverrides$, engineRef)
  const resizeColumn = useRemotePublisher(resizeColumn$, engineRef)
  const [drafts, setDrafts] = useState<Record<string, string>>({
    name: '240',
    status: '180',
  })

  return (
    <div style={STACK_STYLE}>
      <strong>Remote Column Resize</strong>
      <div>Measured: {widthsByField(columns, widths)}</div>
      <div>
        Overrides:{' '}
        {columns && overrides
          ? Array.from(columns, ([key, info]) => `${info.field}:${overrides.get(key) ?? 'auto'}`).join(', ')
          : 'loading'}
      </div>
      {(['name', 'status'] as const).map((field) => {
        const key = findColumnKey(columns, field)
        return (
          <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{field}</span>
            <input
              type="number"
              style={INPUT_STYLE}
              value={drafts[field]}
              onChange={(event) => {
                setDrafts((current) => ({ ...current, [field]: event.target.value }))
              }}
            />
            <button
              type="button"
              style={BUTTON_STYLE}
              disabled={!key}
              onClick={() => {
                const width = Number(drafts[field])
                if (key && Number.isFinite(width)) {
                  resizeColumn({ key, width })
                }
              }}
            >
              Apply
            </button>
          </label>
        )
      })}
    </div>
  )
}

function RemoteStateReaderControls({ engineRef }: { engineRef: EngineRef }) {
  const columns = useRemoteCellValue(columns$, engineRef)
  const widths = useRemoteCellValue(columnWidths$, engineRef)
  const range = useRemoteCellValue(viewportRange$, engineRef)
  const location = useRemoteCellValue(scrollLocation$, engineRef)

  return (
    <div style={STACK_STYLE}>
      <strong>Remote State Reader</strong>
      <div>Order: {fieldOrder(columns)}</div>
      <div>Widths: {widthsByField(columns, widths)}</div>
      <div>Viewport: {range ? `${range.startIndex}-${range.endIndex}` : 'loading'}</div>
      <div>Scroll: {location ? JSON.stringify(location) : 'loading'}</div>
    </div>
  )
}

function RemoteScrollControlControls({ engineRef }: { engineRef: EngineRef }) {
  const range = useRemoteCellValue(viewportRange$, engineRef)
  const scrollToRow = useRemotePublisher(scrollToRow$, engineRef)
  const [target, setTarget] = useState('80')

  return (
    <div style={STACK_STYLE}>
      <strong>Remote Scroll Control</strong>
      <div>Viewport: {range ? `${range.startIndex}-${range.endIndex}` : 'loading'}</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Row index</span>
        <input type="number" style={INPUT_STYLE} value={target} onChange={(event) => setTarget(event.target.value)} />
        <button
          type="button"
          style={BUTTON_STYLE}
          onClick={() => {
            const index = Number(target)
            if (Number.isFinite(index)) {
              scrollToRow(index)
            }
          }}
        >
          Scroll
        </button>
      </label>
    </div>
  )
}

export function RemoteColumnReorder() {
  return <StoryScaffold controls={(engineRef) => <RemoteColumnReorderControls engineRef={engineRef} />} />
}

export function RemoteStickyToggle() {
  return <StoryScaffold controls={(engineRef) => <RemoteStickyToggleControls engineRef={engineRef} />} />
}

export function RemoteColumnResize() {
  return <StoryScaffold controls={(engineRef) => <RemoteColumnResizeControls engineRef={engineRef} />} />
}

export function RemoteStateReader() {
  return <StoryScaffold controls={(engineRef) => <RemoteStateReaderControls engineRef={engineRef} />} />
}

export function RemoteScrollControl() {
  return <StoryScaffold controls={(engineRef) => <RemoteScrollControlControls engineRef={engineRef} />} />
}
