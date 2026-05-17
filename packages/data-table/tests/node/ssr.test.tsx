import { JSDOM } from 'jsdom'
import ReactDOMServer from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { VirtuosoDataTable, localModel } from '../../src'
import { CellDefinition as Cell } from '../../src/columns/Cell'
import { Column } from '../../src/columns/Column'

describe('SSR', () => {
  it('renders without crashing and produces a non-empty DOM', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }))
    const model = localModel({ data })

    const html = ReactDOMServer.renderToString(
      <VirtuosoDataTable id="root" model={model} style={{ height: 400, width: 600 }}>
        <Column field="id">
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
        <Column field="name">
          <Cell>{({ cellValue }) => String(cellValue)}</Cell>
        </Column>
      </VirtuosoDataTable>
    )

    const { document } = new JSDOM(html).window
    const root = document.querySelector('#root')
    expect(root).not.toBeNull()
  })
})
