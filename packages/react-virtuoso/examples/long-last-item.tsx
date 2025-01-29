import { Virtuoso } from '../src/'

export function Example() {
  return (
    <Virtuoso
      computeItemKey={(key) => `item-${key}`}
      initialTopMostItemIndex={9}
      itemContent={(index) => <div style={{ backgroundColor: '#e5e5e5', height: index % 2 ? 800 : 100 }}>Group {index}</div>}
      style={{ height: 500 }}
      totalCount={10}
    />
  )
}
