import { useEffect, useMemo, useState } from 'react'

import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { Cell } from '../../..'
import { VirtuosoDataTable } from '../../../core/VirtuosoDataTable'
import { localModel } from '../../../model/local-model'
import { Column, ColumnDeclarationScope } from '../../Column'
import { ColumnHeader } from '../../ColumnHeader'

const HEADER_HEIGHT = 32
const ROW_HEIGHT = 28
const COLUMN_WIDTH = 90
const readySelector = '[data-testid=virtuoso-table-root][data-ready]'
const headerCellSelector = '[data-table-element-role="column-header"]'

interface Item {
  id: number
  name: string
  status: string
  actions: string
}

const DATA: Item[] = [{ id: 1, name: 'Ada', status: 'Active', actions: 'Edit' }]

function TestColumn({ field, label }: { field: keyof Item; label: string }) {
  return (
    <Column field={field}>
      <ColumnHeader>{() => <div style={{ width: COLUMN_WIDTH, height: HEADER_HEIGHT }}>{label}</div>}</ColumnHeader>
      <Cell>{({ cellValue }) => <div style={{ height: ROW_HEIGHT }}>{String(cellValue)}</div>}</Cell>
    </Column>
  )
}

function RuntimeColumns() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  return (
    <ColumnDeclarationScope>
      {ready && (
        <>
          <TestColumn field="name" label="Name" />
          <TestColumn field="status" label="Status" />
        </>
      )}
    </ColumnDeclarationScope>
  )
}

function headerTexts(container: HTMLElement) {
  return [...container.querySelectorAll(headerCellSelector)].map((header) => header.textContent?.trim())
}

async function waitForReady(screen: Awaited<ReturnType<typeof render>>) {
  await expect.poll(() => screen.container.querySelector(readySelector)).not.toBeNull()
}

describe('column declaration order', () => {
  test('inserts late runtime columns between static columns declared before and after their scope', async () => {
    function TestTable() {
      const model = useMemo(() => localModel<Item>({ data: DATA }), [])

      return (
        <VirtuosoDataTable model={model} style={{ height: 180, width: 420 }}>
          <TestColumn field="id" label="ID" />
          <RuntimeColumns />
          <TestColumn field="actions" label="Actions" />
        </VirtuosoDataTable>
      )
    }

    const screen = await render(<TestTable />)
    await waitForReady(screen)

    await expect.poll(() => headerTexts(screen.container)).toStrictEqual(['ID', 'Name', 'Status', 'Actions'])
  })
})
