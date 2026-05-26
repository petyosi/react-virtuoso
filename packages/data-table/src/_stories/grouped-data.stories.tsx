import type { CSSProperties } from 'react'

import { Cell } from '..'
import { Column } from '../columns/Column'
import { ColumnHeader } from '../columns/ColumnHeader'
import { GroupHeaderCell } from '../rows/GroupHeaderCell'
import { LocalDataTable as VirtuosoDataTable } from '../tests/LocalDataTable'

const HEADER_STYLE: CSSProperties = { fontWeight: 'bold', borderBottom: '1px solid #ccc', padding: '8px 12px' }
const GROUP_HEADER_STYLE: CSSProperties = {
  padding: '8px 12px',
  fontWeight: 'bold',
  background: '#e0e0e0',
  borderBottom: '1px solid #bbb',
}

interface DataItem {
  name: string
  value: string
}

interface GroupItem {
  groupName: string
}

function buildSingleLevelData() {
  const data: (DataItem | GroupItem)[] = []
  const groups: { index: number; level: number }[] = []

  const groupNames = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports']

  for (const groupName of groupNames) {
    const groupIndex = data.length
    data.push({ groupName })
    groups.push({ index: groupIndex, level: 0 })

    const itemCount = 8 + Math.floor(Math.random() * 12)
    for (let i = 0; i < itemCount; i++) {
      data.push({
        name: `${groupName} Item ${i + 1}`,
        value: `$${(Math.random() * 100).toFixed(2)}`,
      })
    }
  }

  return { data, groups }
}

function buildMultiLevelData() {
  const data: (DataItem | GroupItem | { groupName: string })[] = []
  const groups: { index: number; level: number }[] = []

  const hierarchy = [
    {
      name: 'North America',
      children: [
        { name: 'USA', items: ['New York', 'Los Angeles', 'Chicago', 'Houston'] },
        { name: 'Canada', items: ['Toronto', 'Vancouver', 'Montreal'] },
      ],
    },
    {
      name: 'Europe',
      children: [
        { name: 'UK', items: ['London', 'Manchester', 'Birmingham'] },
        { name: 'Germany', items: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'] },
        { name: 'France', items: ['Paris', 'Lyon', 'Marseille'] },
      ],
    },
    {
      name: 'Asia',
      children: [
        { name: 'Japan', items: ['Tokyo', 'Osaka', 'Kyoto'] },
        { name: 'South Korea', items: ['Seoul', 'Busan'] },
      ],
    },
  ]

  for (const continent of hierarchy) {
    const continentIndex = data.length
    data.push({ groupName: continent.name })
    groups.push({ index: continentIndex, level: 0 })

    for (const country of continent.children) {
      const countryIndex = data.length
      data.push({ groupName: country.name })
      groups.push({ index: countryIndex, level: 1 })

      for (const city of country.items) {
        data.push({ name: city, value: `Pop: ${Math.floor(Math.random() * 10_000_000).toLocaleString()}` })
      }
    }
  }

  return { data, groups }
}

function buildLargeMultiLevelData() {
  const data: (DataItem | GroupItem)[] = []
  const groups: { index: number; level: number }[] = []

  for (let g = 0; g < 100; g++) {
    const groupIndex = data.length
    data.push({ groupName: `Department ${g + 1}` })
    groups.push({ index: groupIndex, level: 0 })

    for (let s = 0; s < 10; s++) {
      const subGroupIndex = data.length
      data.push({ groupName: `Team ${g + 1}-${s + 1}` })
      groups.push({ index: subGroupIndex, level: 1 })

      for (let r = 0; r < 30; r++) {
        data.push({
          name: `Employee ${g + 1}-${s + 1}-${r + 1}`,
          value: `$${(40_000 + Math.random() * 80_000).toFixed(0)}`,
        })
      }
    }
  }

  return { data, groups }
}

const LIST_STYLE: CSSProperties = { height: 500, width: 600 }

export function SingleLevelGrouping() {
  const tableData = buildSingleLevelData()

  return (
    <VirtuosoDataTable style={LIST_STYLE} source={tableData}>
      <GroupHeaderCell>{({ row }) => <div style={GROUP_HEADER_STYLE}>{(row.data as GroupItem).groupName}</div>}</GroupHeaderCell>
      <Column field="name">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>Name</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue ?? '')}</Cell>
      </Column>
      <Column field="value">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>Price</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue ?? '')}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

const LEVEL_STYLES: Record<number, CSSProperties> = {
  0: { ...GROUP_HEADER_STYLE, background: '#c0c0c0', fontSize: '1.1em' },
  1: { ...GROUP_HEADER_STYLE, background: '#d8d8d8', paddingLeft: 24 },
}

export function MultiLevelGrouping() {
  const tableData = buildMultiLevelData()

  return (
    <VirtuosoDataTable style={LIST_STYLE} source={tableData}>
      <GroupHeaderCell>
        {({ row, level }) => <div style={LEVEL_STYLES[level] ?? GROUP_HEADER_STYLE}>{(row.data as GroupItem).groupName}</div>}
      </GroupHeaderCell>
      <Column field="name">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>City</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue ?? '')}</Cell>
      </Column>
      <Column field="value">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>Population</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue ?? '')}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}

export function LargeMultiLevelGrouping() {
  const tableData = buildLargeMultiLevelData()

  return (
    <VirtuosoDataTable style={LIST_STYLE} source={tableData} increaseViewportBy={400}>
      <GroupHeaderCell>
        {({ row, level }) => <div style={LEVEL_STYLES[level] ?? GROUP_HEADER_STYLE}>{(row.data as GroupItem).groupName}</div>}
      </GroupHeaderCell>
      <Column field="name">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>Name</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue ?? '')}</Cell>
      </Column>
      <Column field="value">
        <ColumnHeader>{() => <div style={HEADER_STYLE}>Salary</div>}</ColumnHeader>
        <Cell>{({ cellValue }) => String(cellValue ?? '')}</Cell>
      </Column>
    </VirtuosoDataTable>
  )
}
