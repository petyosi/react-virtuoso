import { Virtuoso } from '../src/'

export function Example() {
  return (
    <Virtuoso
      computeItemKey={(key) => `item-${key}`}
      initialScrollTop={50}
      itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
      style={{ height: 300 }}
      totalCount={100}
    />
  )
}
