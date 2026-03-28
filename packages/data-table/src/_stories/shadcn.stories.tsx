import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, DataTableCell, DataTableColumn, DataTableColumnHeader } from '@/components/ui/data-table'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: string
}

const ALL_ITEMS: User[] = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ['Admin', 'Editor', 'Viewer'][i % 3]!,
  status: i % 5 === 0 ? 'inactive' : 'active',
}))

const TABLE_STYLE: CSSProperties = { height: 400 }

export function ShadcnDataTable() {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const data = useMemo(() => {
    const filtered = filter === 'all' ? ALL_ITEMS : ALL_ITEMS.filter((item) => item.status === filter)
    return { data: filtered, groups: [] as { index: number; level: number }[] }
  }, [filter])

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>{data.data.length} users total</CardDescription>
        <div className="flex gap-2 pt-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
            All
          </Button>
          <Button variant={filter === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('active')}>
            Active
          </Button>
          <Button variant={filter === 'inactive' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('inactive')}>
            Inactive
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable data={data} style={TABLE_STYLE}>
          <DataTableColumn field="id">
            <DataTableColumnHeader>ID</DataTableColumnHeader>
            <DataTableCell>
              {({ cellValue }) => <span className="text-muted-foreground tabular-nums">{String(cellValue)}</span>}
            </DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="name">
            <DataTableColumnHeader>Name</DataTableColumnHeader>
            <DataTableCell>{({ cellValue }) => <span className="font-medium">{String(cellValue)}</span>}</DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="email">
            <DataTableColumnHeader>Email</DataTableColumnHeader>
            <DataTableCell>{({ cellValue }) => <span className="text-muted-foreground">{String(cellValue)}</span>}</DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="role">
            <DataTableColumnHeader>Role</DataTableColumnHeader>
            <DataTableCell>{({ cellValue }) => String(cellValue)}</DataTableCell>
          </DataTableColumn>

          <DataTableColumn field="status">
            <DataTableColumnHeader>Status</DataTableColumnHeader>
            <DataTableCell>
              {({ cellValue }) => {
                const active = cellValue === 'active'
                return (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {String(cellValue)}
                  </span>
                )
              }}
            </DataTableCell>
          </DataTableColumn>
        </DataTable>
      </CardContent>
    </Card>
  )
}
