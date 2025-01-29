import { Virtuoso } from '../src'

// globalThis['VIRTUOSO_LOG_LEVEL'] = 0

export function Example() {
  return (
    <Virtuoso
      defaultItemHeight={1000}
      initialTopMostItemIndex={99}
      itemContent={(index) => <div style={{ height: 100 }}>Item {index}</div>}
      style={{ height: 500 }}
      totalCount={100}
    />
  )
}
