import type { CSSProperties } from 'react'

import { Cell } from '..'
import { Column } from '../columns/Column'
import { ColumnGroup } from '../columns/ColumnGroup'
import { ColumnGroupHeader } from '../columns/ColumnGroupHeader'
import { ColumnHeader } from '../columns/ColumnHeader'
import { LocalDataTable as VirtuosoDataTable } from '../tests/LocalDataTable'

import type { ColumnGroupHeaderCustomComponent } from '../columns/ColumnGroupHeader'

const COLUMN_COUNT = 15
const ITEM_COUNT = 100

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, rowIndex) => {
  const row: Record<string, string> = {
    id: `id-${rowIndex}`,
    firstName: `First ${rowIndex}`,
    lastName: `Last ${rowIndex}`,
    email: `user${rowIndex}@example.com`,
    phone: `555-${String(rowIndex).padStart(4, '0')}`,
    street: `${rowIndex} Main St`,
    city: `City ${rowIndex % 10}`,
    zip: `${10_000 + rowIndex}`,
    salary: `$${(rowIndex * 1000 + 50_000).toLocaleString()}`,
    bonus: `$${(rowIndex * 100).toLocaleString()}`,
    actions: 'Edit | Delete',
  }
  for (let i = 0; i < COLUMN_COUNT; i++) {
    row[`col${i}`] = `R${rowIndex + 1}C${i + 1}`
  }
  return row
})

const LIST_STYLE: CSSProperties = { height: 400, width: 800 }
const HEADER_STYLE: CSSProperties = { fontWeight: 'bold', borderBottom: '1px solid #ccc', padding: '8px 12px' }
const STICKY_HEADER_STYLE: CSSProperties = { ...HEADER_STYLE, background: '#e8e8e8' }

const GROUP_HEADER_STYLE: CSSProperties = {
  padding: '4px 8px',
  background: '#ddd',
  fontWeight: 'bold',
  fontSize: '0.9em',
  borderBottom: '1px solid #bbb',
}

const NESTED_GROUP_HEADER_STYLE: CSSProperties = {
  ...GROUP_HEADER_STYLE,
  background: '#ccc',
  fontSize: '0.85em',
}

const STICKY_GROUP_HEADER_STYLE: CSSProperties = {
  ...GROUP_HEADER_STYLE,
  background: '#d0d0d0',
}

export function BasicColumnGroup() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      <Column field="id">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>ID</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>

      <ColumnGroup>
        <ColumnGroupHeader>{() => <div style={GROUP_HEADER_STYLE}>Personal Info</div>}</ColumnGroupHeader>
        <Column field="firstName">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>First Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="lastName">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Last Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </ColumnGroup>

      {Array.from({ length: 5 }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

export function NestedColumnGroups() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      <Column field="id">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>ID</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>

      <ColumnGroup>
        <ColumnGroupHeader>{() => <div style={GROUP_HEADER_STYLE}>Personal Info</div>}</ColumnGroupHeader>
        <Column field="firstName">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>First Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="lastName">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Last Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>

        <ColumnGroup>
          <ColumnGroupHeader>{() => <div style={NESTED_GROUP_HEADER_STYLE}>Contact</div>}</ColumnGroupHeader>
          <Column field="email">
            <ColumnHeader>{() => <div style={HEADER_STYLE}>Email</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => String(cellValue)}</Cell>
          </Column>
          <Column field="phone">
            <ColumnHeader>{() => <div style={HEADER_STYLE}>Phone</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => String(cellValue)}</Cell>
          </Column>
        </ColumnGroup>
      </ColumnGroup>

      {Array.from({ length: 5 }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

export function DeeplyNestedGroups() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      <Column field="id">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>ID</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>

      <ColumnGroup>
        <ColumnGroupHeader>{() => <div style={GROUP_HEADER_STYLE}>Employee Data</div>}</ColumnGroupHeader>

        <ColumnGroup>
          <ColumnGroupHeader>{() => <div style={NESTED_GROUP_HEADER_STYLE}>Identity</div>}</ColumnGroupHeader>
          <Column field="firstName">
            <ColumnHeader>{() => <div style={HEADER_STYLE}>First</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => String(cellValue)}</Cell>
          </Column>
          <Column field="lastName">
            <ColumnHeader>{() => <div style={HEADER_STYLE}>Last</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => String(cellValue)}</Cell>
          </Column>
        </ColumnGroup>

        <ColumnGroup>
          <ColumnGroupHeader>{() => <div style={NESTED_GROUP_HEADER_STYLE}>Location</div>}</ColumnGroupHeader>

          <ColumnGroup>
            <ColumnGroupHeader>{() => <div style={{ ...NESTED_GROUP_HEADER_STYLE, background: '#bbb' }}>Address</div>}</ColumnGroupHeader>
            <Column field="street">
              <ColumnHeader>{() => <div style={HEADER_STYLE}>Street</div>}</ColumnHeader>
              <Cell>{({ cellValue }) => String(cellValue)}</Cell>
            </Column>
            <Column field="city">
              <ColumnHeader>{() => <div style={HEADER_STYLE}>City</div>}</ColumnHeader>
              <Cell>{({ cellValue }) => String(cellValue)}</Cell>
            </Column>
            <Column field="zip">
              <ColumnHeader>{() => <div style={HEADER_STYLE}>ZIP</div>}</ColumnHeader>
              <Cell>{({ cellValue }) => String(cellValue)}</Cell>
            </Column>
          </ColumnGroup>
        </ColumnGroup>
      </ColumnGroup>

      {Array.from({ length: 5 }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Col {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

export function StickyLeftColumnGroup() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      <ColumnGroup sticky="left">
        <ColumnGroupHeader>{() => <div style={STICKY_GROUP_HEADER_STYLE}>Sticky Group</div>}</ColumnGroupHeader>
        <Column field="id">
          <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>ID</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="firstName">
          <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>First Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </ColumnGroup>

      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

export function StickyRightColumnGroup() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}

      <ColumnGroup sticky="right">
        <ColumnGroupHeader>{() => <div style={STICKY_GROUP_HEADER_STYLE}>Compensation</div>}</ColumnGroupHeader>
        <Column field="salary">
          <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Salary</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="bonus">
          <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Bonus</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </ColumnGroup>
    </VirtuosoDataTable>
  )
}

export function BothSideStickyGroups() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      <ColumnGroup sticky="left">
        <ColumnGroupHeader>{() => <div style={STICKY_GROUP_HEADER_STYLE}>Identity</div>}</ColumnGroupHeader>
        <Column field="id">
          <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>ID</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="firstName">
          <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>First</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="lastName">
          <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Last</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </ColumnGroup>

      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}

      <ColumnGroup sticky="right">
        <ColumnGroupHeader>{() => <div style={STICKY_GROUP_HEADER_STYLE}>Actions</div>}</ColumnGroupHeader>
        <Column field="salary">
          <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Salary</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="actions">
          <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Actions</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </ColumnGroup>
    </VirtuosoDataTable>
  )
}

const CustomGroupHeader: ColumnGroupHeaderCustomComponent = ({ columnKeys, totalWidth }) => (
  <div style={{ ...GROUP_HEADER_STYLE, display: 'flex', justifyContent: 'space-between' }}>
    <span>Custom Header ({columnKeys.length} cols)</span>
    <span style={{ fontSize: '0.8em', color: '#666' }}>~{totalWidth}px</span>
  </div>
)

export function CustomGroupHeaderComponent() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      <Column field="id">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>ID</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>

      <ColumnGroup>
        <ColumnGroupHeader component={CustomGroupHeader} />
        <Column field="firstName">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>First Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="lastName">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Last Name</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="email">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Email</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </ColumnGroup>

      {Array.from({ length: 5 }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}

export function StickyGroupWithNestedGroups() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      <ColumnGroup sticky="left">
        <ColumnGroupHeader>{() => <div style={STICKY_GROUP_HEADER_STYLE}>Employee</div>}</ColumnGroupHeader>
        <Column field="id">
          <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>ID</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>

        <ColumnGroup>
          <ColumnGroupHeader>{() => <div style={{ ...NESTED_GROUP_HEADER_STYLE, background: '#c8c8c8' }}>Name</div>}</ColumnGroupHeader>
          <Column field="firstName">
            <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>First</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => String(cellValue)}</Cell>
          </Column>
          <Column field="lastName">
            <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Last</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => String(cellValue)}</Cell>
          </Column>
        </ColumnGroup>
      </ColumnGroup>

      {Array.from({ length: COLUMN_COUNT }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Column {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}

      <ColumnGroup sticky="right">
        <ColumnGroupHeader>{() => <div style={STICKY_GROUP_HEADER_STYLE}>Financials</div>}</ColumnGroupHeader>

        <ColumnGroup>
          <ColumnGroupHeader>
            {() => <div style={{ ...NESTED_GROUP_HEADER_STYLE, background: '#c8c8c8' }}>Compensation</div>}
          </ColumnGroupHeader>
          <Column field="salary">
            <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Salary</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => String(cellValue)}</Cell>
          </Column>
          <Column field="bonus">
            <ColumnHeader>{() => <div style={STICKY_HEADER_STYLE}>Bonus</div>}</ColumnHeader>
            <Cell>{({ cellValue }) => String(cellValue)}</Cell>
          </Column>
        </ColumnGroup>
      </ColumnGroup>
    </VirtuosoDataTable>
  )
}

export function MixedGroupsAndColumns() {
  return (
    <VirtuosoDataTable style={LIST_STYLE} source={ITEMS}>
      <Column field="id">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>ID</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>

      <ColumnGroup>
        <ColumnGroupHeader>{() => <div style={GROUP_HEADER_STYLE}>Name</div>}</ColumnGroupHeader>
        <Column field="firstName">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>First</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="lastName">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Last</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </ColumnGroup>

      <Column field="email">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>Email</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>

      <ColumnGroup>
        <ColumnGroupHeader>{() => <div style={GROUP_HEADER_STYLE}>Address</div>}</ColumnGroupHeader>
        <Column field="street">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Street</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="city">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>City</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="zip">
          <ColumnHeader>{() => <div style={HEADER_STYLE}>ZIP</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </ColumnGroup>

      <Column field="phone">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>Phone</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue)}</Cell>
      </Column>

      {Array.from({ length: 3 }, (_, i) => (
        <Column key={`col${i}`} field={`col${i}`}>
          <ColumnHeader>{() => <div style={HEADER_STYLE}>Col {i + 1}</div>}</ColumnHeader>
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      ))}
    </VirtuosoDataTable>
  )
}
