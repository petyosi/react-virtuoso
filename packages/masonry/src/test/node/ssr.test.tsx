import { parse } from 'node-html-parser'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { VirtuosoMasonry, type VirtuosoMasonryProps } from '../../VirtuosoMasonry'

const ItemContent: VirtuosoMasonryProps<number, unknown>['ItemContent'] = ({ data }) => <div>{data}</div>

describe('ssr', () => {
  it('works', () => {
    const result = renderToString(
      <VirtuosoMasonry
        columnCount={3}
        initialItemCount={10}
        data={Array.from({ length: 1000 }).map((_, index) => index)}
        ItemContent={ItemContent}
      />
    )
    const root = parse(result)
    expect(root.firstChild?.childNodes.length).toBe(3)
    expect(root.firstChild?.childNodes[0].childNodes.length).toBe(4)
    expect(root.firstChild?.childNodes[1].childNodes.length).toBe(3)
    expect(root.firstChild?.childNodes[2].childNodes.length).toBe(3)
  })
})
