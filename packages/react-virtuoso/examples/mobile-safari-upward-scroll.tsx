import { Virtuoso } from '../src'

// Items taller than the viewport and its increase, each a little taller than the estimate, so scrolling up measures
// them one at a time without changing which items are rendered.
const itemHeight = (index: number) => 2000 + ((index * 37) % 11) * 30

export function Example() {
  return (
    <Virtuoso
      defaultItemHeight={2000}
      increaseViewportBy={600}
      initialTopMostItemIndex={59}
      itemContent={(index) => (
        <div style={{ borderBottom: '1px solid #ccc', boxSizing: 'border-box', height: itemHeight(index) }}>Item {index}</div>
      )}
      style={{ height: 600 }}
      totalCount={60}
    />
  )
}
