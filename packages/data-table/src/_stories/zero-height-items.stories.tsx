import { useState } from 'react'
import type { CSSProperties } from 'react'

import { Cell } from '..'
import { Column } from '../columns/Column'
import { ColumnHeader } from '../columns/ColumnHeader'
import { LocalDataTable as VirtuosoDataTable } from '../tests/LocalDataTable'

const ITEM_COUNT = 200

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, i) => ({
  id: i,
  name: `User ${i + 1}`,
  value: `Value ${i + 1}`,
}))

const LIST_STYLE: CSSProperties = { height: 400 }
const HEADER_STYLE: CSSProperties = { fontWeight: 'bold', borderBottom: '1px solid gray', padding: '4px 8px' }

export function ZeroHeightCells() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      <Column field="name">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>Name</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ height: 0, overflow: 'hidden' }}>{String(cellValue)}</div>}</Cell>
      </Column>
      <Column field="value">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>Value</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => <div style={{ height: 0, overflow: 'hidden' }}>{String(cellValue)}</div>}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

export function MixedZeroAndNormalHeight() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      <Column field="name">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>Name</div>}</ColumnHeader>
        <Cell>
          {({ cellValue, row }) => <div style={{ height: row.index % 5 === 0 ? 0 : 30, overflow: 'hidden' }}>{String(cellValue)}</div>}
        </Cell>
      </Column>
      <Column field="value">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>Value</div>}</ColumnHeader>
        <Cell>
          {({ cellValue, row }) => <div style={{ height: row.index % 5 === 0 ? 0 : 30, overflow: 'hidden' }}>{String(cellValue)}</div>}
        </Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

export function CollapsibleRows() {
  const [collapsed, setCollapsed] = useState(new Set<number>())

  return (
    <div>
      <button
        onClick={() => {
          setCollapsed(new Set(ITEMS.filter((_, i) => i % 3 === 0).map((_, i) => i * 3)))
        }}
      >
        Collapse every 3rd row
      </button>
      <button onClick={() => setCollapsed(new Set())}>Expand all</button>

      <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
        <Column field="name">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Name</div>}</ColumnHeader>
          <Cell>
            {({ cellValue, row }) => (
              <div style={{ height: collapsed.has(row.index) ? 0 : 30, overflow: 'hidden', transition: 'height 0.2s' }}>
                {String(cellValue)}
              </div>
            )}
          </Cell>
        </Column>
        <Column field="value">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Value</div>}</ColumnHeader>
          <Cell>
            {({ cellValue, row }) => (
              <div style={{ height: collapsed.has(row.index) ? 0 : 30, overflow: 'hidden', transition: 'height 0.2s' }}>
                {String(cellValue)}
              </div>
            )}
          </Cell>
        </Column>
      </VirtuosoDataTable>
    </div>
  )
}
