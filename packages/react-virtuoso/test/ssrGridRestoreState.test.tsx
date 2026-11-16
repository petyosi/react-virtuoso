// @vitest-environment node
import ReactDOMServer from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { VirtuosoGrid } from '../src/VirtuosoGrid'

describe('SSR grid with restored state', () => {
  it('renders the empty full-height list without scrolling', () => {
    expect(typeof window).toBe('undefined')
    const html = ReactDOMServer.renderToString(
      <VirtuosoGrid
        id="root"
        itemContent={(index) => <div>{index}</div>}
        restoreStateFrom={{
          gap: { column: 0, row: 0 },
          item: { height: 80, width: 300 },
          scrollTop: 2000,
          viewport: { height: 300, width: 1200 },
        }}
        totalCount={1000}
      />
    )

    // matches the first client render: no items, but the full height of the list (250 rows of 80px)
    expect(html).toContain('padding-bottom:20000px')
    expect(html).not.toContain('<div>0</div>')
  })
})
