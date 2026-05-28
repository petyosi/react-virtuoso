import type { CSSProperties } from 'react'
import { useState } from 'react'

import { Cell } from '..'
import { Column } from '../columns/Column'
import { ColumnHeader } from '../columns/ColumnHeader'
import { LocalDataTable as VirtuosoDataTable } from '../tests/LocalDataTable'

const COLUMN_COUNT = 20
const ITEM_COUNT = 100

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, rowIndex) => {
  const row: Record<string, string> = {
    id: `id-${rowIndex}`,
    name: `User ${rowIndex}`,
  }
  for (let colIndex = 0; colIndex < COLUMN_COUNT; colIndex++) {
    row[`col${colIndex}`] = `R${rowIndex + 1}C${colIndex + 1}`
  }
  row.actions = 'Edit | Delete'
  return row
})

const LIST_STYLE: CSSProperties = { height: 400, width: 600 }
const CUSTOM_SCROLL_PARENT_STYLE: CSSProperties = {
  border: '1px solid #ccc',
  height: 360,
  overflow: 'auto',
  width: 600,
}
const CUSTOM_SCROLL_TOOLBAR_STYLE: CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid #ddd',
  fontWeight: 'bold',
  padding: '8px 12px',
  position: 'sticky',
  top: 0,
  zIndex: 5,
}
const CUSTOM_SCROLL_TABLE_STYLE: CSSProperties = { width: 600 }
const WINDOW_SCROLL_SPACER_STYLE: CSSProperties = {
  background: '#f8f8f8',
  border: '1px solid #ddd',
  marginBottom: 16,
  padding: 16,
}
const HEADER_STYLE: CSSProperties = { fontWeight: 'bold', borderBottom: '1px solid #ccc', padding: '8px 12px' }
const STICKY_HEADER_STYLE: CSSProperties = { ...HEADER_STYLE, background: '#f0f0f0' }
const STICKY_CELL_STYLE: CSSProperties = { padding: '8px 12px', width: 120, background: '#f8f8f8' }

export function ScrollbarOverlayHandling() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      <Column field="id" sticky="left">
        <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>ID</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
      <Column field="actions" sticky="right">
        <ColumnHeader>
          {({ overlaidByScrollbar }) => (
            <div
              style={{
                ...STICKY_HEADER_STYLE,
                paddingRight: overlaidByScrollbar ? 'calc(8px + var(--overlay-scrollbar-visible-size))' : '8px',
              }}
            >
              Actions
            </div>
          )}
        </ColumnHeader>
        <Cell>
          {({ cellValue, overlaidByScrollbar }) => (
            <div
              style={{
                ...STICKY_CELL_STYLE,
                paddingRight: overlaidByScrollbar ? 'calc(8px + var(--overlay-scrollbar-visible-size))' : '8px',
              }}
            >
              {String(cellValue)}
            </div>
          )}
        </Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

export function CustomScrollParentOverlay() {
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null)

  return (
    <div style={CUSTOM_SCROLL_PARENT_STYLE} ref={setScrollParent}>
      <div style={CUSTOM_SCROLL_TOOLBAR_STYLE}>Workspace toolbar</div>
      <VirtuosoDataTable customScrollParent={scrollParent} source={ITEMS} style={CUSTOM_SCROLL_TABLE_STYLE}>
        <Column field="id" sticky="left">
          <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>ID</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={STICKY_CELL_STYLE}>{String(cellValue)}</div>}</Cell>
        </Column>
        {Array.from({ length: COLUMN_COUNT }, (_, i) => (
          <Column key={`col${i}`} field={`col${i}`}>
            <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => <div style={STICKY_CELL_STYLE}>{String(cellValue)}</div>}</Cell>
          </Column>
        ))}
        <Column field="actions" sticky="right">
          <ColumnHeader>
            {({ overlaidByScrollbar }) => (
              <div
                style={{
                  ...STICKY_HEADER_STYLE,
                  paddingRight: overlaidByScrollbar ? 'calc(8px + var(--overlay-scrollbar-visible-size))' : '8px',
                }}
              >
                Actions
              </div>
            )}
          </ColumnHeader>
          <Cell>
            {({ cellValue, overlaidByScrollbar }) => (
              <div
                style={{
                  ...STICKY_CELL_STYLE,
                  paddingRight: overlaidByScrollbar ? 'calc(8px + var(--overlay-scrollbar-visible-size))' : '8px',
                }}
              >
                {String(cellValue)}
              </div>
            )}
          </Cell>
        </Column>
      </VirtuosoDataTable>
    </div>
  )
}

export function WindowScroll() {
  return (
    <div>
      <div style={WINDOW_SCROLL_SPACER_STYLE}>Scroll the page. The table uses the window as its scroll container.</div>
      <VirtuosoDataTable source={ITEMS} useWindowScroll>
        <Column field="id">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>ID</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={STICKY_CELL_STYLE}>{String(cellValue)}</div>}</Cell>
        </Column>
        <Column field="name">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => <div style={STICKY_CELL_STYLE}>{String(cellValue)}</div>}</Cell>
        </Column>
      </VirtuosoDataTable>
    </div>
  )
}
