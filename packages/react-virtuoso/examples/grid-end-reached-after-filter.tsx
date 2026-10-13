import { useState } from 'react'

import { VirtuosoGrid } from '../src'

function generateItems(length: number, prefix: string) {
  return Array.from({ length }, (_, index) => `${prefix} ${index}`)
}

const itemContent = (_: number, data: string) => {
  return <div style={{ height: 20 }}>{data}</div>
}

// Regression coverage for https://github.com/petyosi/react-virtuoso/issues/1242 --
// endReached never fired again if a filter operation brought the item count back
// down to a value it had already reported.
export function Example() {
  const [data, setData] = useState(() => generateItems(20, 'Item'))
  const [endReachedCount, setEndReachedCount] = useState(0)
  const [lastEndReachedIndex, setLastEndReachedIndex] = useState<null | number>(null)

  const onEndReached = (index: number) => {
    setEndReachedCount((count) => count + 1)
    setLastEndReachedIndex(index)
  }

  return (
    <div>
      <button
        data-testid="enable-filter"
        onClick={() => {
          // Replace the data with a different (filtered) array -- same length as the
          // very first one, but a new identity, with more pages potentially available.
          setData(generateItems(20, 'Filtered'))
        }}
      >
        Enable filter
      </button>
      <div data-testid="end-reached-count">{endReachedCount}</div>
      <div data-testid="last-end-reached-index">{lastEndReachedIndex ?? ''}</div>
      <VirtuosoGrid data={data} endReached={onEndReached} itemContent={itemContent} style={{ height: 1000 }} />
    </div>
  )
}
