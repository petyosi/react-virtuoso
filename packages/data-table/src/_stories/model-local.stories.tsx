import type { CSSProperties } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { Cell, VirtuosoDataTable } from '..'
import { Column } from '../columns/Column'
import { ColumnHeader } from '../columns/ColumnHeader'
import { localSource } from '../model/local-source'
import { GroupHeaderCell } from '../rows/GroupHeaderCell'

import type { PipelineHandler } from '../model/local-source'
import type { MessageEnvelope } from '../model/types'

interface Item {
  id: number
  name: string
  category: string
  value: number
}

const ITEMS: Item[] = Array.from({ length: 200 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  category: ['Electronics', 'Books', 'Clothing', 'Food'][i % 4]!,
  value: Math.round(Math.random() * 1000),
}))

const LIST_STYLE: CSSProperties = { height: 400 }
const HEADER_STYLE: CSSProperties = { fontWeight: 'bold', borderBottom: '1px solid gray', padding: '4px 8px' }
const GROUP_HEADER_STYLE: CSSProperties = { fontWeight: 'bold', padding: '8px', background: '#f0f0f0' }

const filterHandler: PipelineHandler<Item> = ({ data, payload }) => {
  const category = payload as string
  if (!category) {
    return data
  }
  return data.filter((item) => item.category === category)
}

const sortHandler: PipelineHandler<Item> = ({ data, payload }) => {
  const field = payload as keyof Item
  if (!field) {
    return data
  }
  return data.toSorted((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0))
}

export function FilterAndSort() {
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [sortField, setSortField] = useState<keyof Item | ''>('')

  const model = useMemo(
    () =>
      localSource<Item>({
        data: ITEMS,
        pipeline: ['filter', 'sort'],
        actions: {
          filter: { stage: 'filter', handler: filterHandler },
          sort: { stage: 'sort', handler: sortHandler },
        },
      }),
    []
  )

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value)
            model.send({ action: 'filter', payload: e.target.value })
          }}
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Clothing">Clothing</option>
          <option value="Food">Food</option>
        </select>

        <select
          value={sortField}
          onChange={(e) => {
            setSortField(e.target.value as keyof Item | '')
            model.send({ action: 'sort', payload: e.target.value || undefined })
          }}
        >
          <option value="">No Sort</option>
          <option value="id">Sort by ID</option>
          <option value="name">Sort by Name</option>
          <option value="category">Sort by Category</option>
          <option value="value">Sort by Value</option>
        </select>
      </div>

      <VirtuosoDataTable style={LIST_STYLE} model={model}>
        <Column field="id">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>ID</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="name">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="category">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Category</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="value">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Value</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </VirtuosoDataTable>
    </div>
  )
}

// --- Grouping Story ---

interface GroupLabel {
  label: string
}

function groupItems(
  data: (Item | GroupLabel)[],
  field: keyof Item | null
): { data: (Item | GroupLabel)[]; groups: { index: number; level: number }[] } {
  if (!field) {
    return { data, groups: [] }
  }

  const items = data.filter((d): d is Item => 'id' in d)
  const bucketMap = new Map<string, Item[]>()
  for (const item of items) {
    const key = String(item[field])
    let bucket = bucketMap.get(key)
    if (!bucket) {
      bucket = []
      bucketMap.set(key, bucket)
    }
    bucket.push(item)
  }

  const flatData: (Item | GroupLabel)[] = []
  const groups: { index: number; level: number }[] = []

  for (const [key, bucketItems] of bucketMap) {
    groups.push({ index: flatData.length, level: 0 })
    flatData.push({ label: `${field}: ${key} (${bucketItems.length})` })
    flatData.push(...bucketItems)
  }

  return { data: flatData, groups }
}

export function GroupByCategory() {
  const [groupField, setGroupField] = useState<string>('')

  const model = useMemo(
    () =>
      localSource<Item, GroupLabel>({
        data: ITEMS,
        pipeline: ['filter', 'group'],
        actions: {
          filter: {
            stage: 'filter',
            handler({ data, payload }: { data: (Item | GroupLabel)[]; payload: unknown }) {
              const category = payload as string
              if (!category) {
                return data
              }
              return data.filter((item): item is Item => 'id' in item && (item as Item).category === category)
            },
          },
          group: {
            stage: 'group',
            handler({ data, payload }: { data: (Item | GroupLabel)[]; payload: unknown }) {
              return groupItems(data, payload as keyof Item | null)
            },
          },
        },
      }),
    []
  )

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <select
          value={groupField}
          onChange={(e) => {
            setGroupField(e.target.value)
            model.send({ action: 'group', payload: e.target.value || null })
          }}
        >
          <option value="">No Grouping</option>
          <option value="category">By Category</option>
          <option value="name">By Name</option>
        </select>
      </div>

      <VirtuosoDataTable style={LIST_STYLE} model={model}>
        <GroupHeaderCell>{({ row }) => <div style={GROUP_HEADER_STYLE}>{(row.data as GroupLabel).label}</div>}</GroupHeaderCell>
        <Column field="id">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>ID</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="name">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="category">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Category</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="value">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Value</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </VirtuosoDataTable>
    </div>
  )
}

// --- Protocol Lifecycle Story ---

const LOG_STYLE: CSSProperties = {
  height: 200,
  overflow: 'auto',
  border: '1px solid #ccc',
  padding: 8,
  fontFamily: 'monospace',
  fontSize: 12,
  marginBottom: 8,
  background: '#fafafa',
}

const TYPE_COLORS: Record<string, string> = {
  ack: '#2196f3',
  result: '#4caf50',
  error: '#f44336',
  cancel: '#ff9800',
  event: '#9c27b0',
}

function formatMessage(msg: MessageEnvelope): string {
  const parts = [`[${msg.type}]`, `req=${msg.requestId}`, `action=${msg.action}`]
  if (msg.operationVersion !== undefined) {
    parts.push(`opV=${msg.operationVersion}`)
  }
  if (msg.dataVersion !== undefined) {
    parts.push(`dataV=${msg.dataVersion}`)
  }
  if (msg.error) {
    parts.push(`err="${msg.error.message}"`)
  }
  return parts.join(' ')
}

export function ProtocolLifecycle() {
  const [messages, setMessages] = useState<MessageEnvelope[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  const addMessage = useCallback((msg: MessageEnvelope) => {
    setMessages((prev) => [...prev, msg])
    requestAnimationFrame(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight
      }
    })
  }, [])

  const model = useMemo(() => {
    let throwNext = false
    const m = localSource<Item>({
      data: ITEMS.slice(0, 20),
      pipeline: ['transform'],
      actions: {
        transform: {
          stage: 'transform',
          handler: ({ data, payload }: { data: Item[]; payload: unknown }) => {
            const mode = payload as string
            if (mode === 'error') {
              throwNext = true
            }
            if (throwNext) {
              throwNext = false
              throw new Error('Simulated failure')
            }
            if (mode === 'reverse') {
              return data.toReversed()
            }
            if (mode === 'shuffle') {
              return data.toSorted(() => Math.random() - 0.5)
            }
            return data
          },
        },
      },
    })

    m.subscribe(addMessage)
    return m
  }, [addMessage])

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <button onClick={() => model.send({ action: 'transform', payload: 'reverse', requestId: `r-${Date.now()}` })}>
          Reverse (success)
        </button>
        <button onClick={() => model.send({ action: 'transform', payload: 'shuffle', requestId: `s-${Date.now()}` })}>
          Shuffle (success)
        </button>
        <button
          onClick={() => model.send({ action: 'transform', payload: 'error', requestId: `e-${Date.now()}` })}
          style={{ color: '#f44336' }}
        >
          Trigger Error (reverts)
        </button>
        <button onClick={() => setMessages([])} style={{ marginLeft: 'auto' }}>
          Clear Log
        </button>
      </div>

      <div ref={logRef} style={LOG_STYLE}>
        {messages.map((msg, i) => (
          // oxlint-disable-next-line no-array-index-key
          <div key={i} style={{ color: TYPE_COLORS[msg.type] ?? '#333' }}>
            {formatMessage(msg)}
          </div>
        ))}
        {messages.length === 0 && <span style={{ color: '#999' }}>No messages yet. Click a button above.</span>}
      </div>

      <VirtuosoDataTable style={LIST_STYLE} model={model}>
        <Column field="id">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>ID</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="name">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="category">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Category</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </VirtuosoDataTable>
    </div>
  )
}
