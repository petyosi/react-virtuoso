import { Virtuoso } from '../src'

export function Example() {
  return (
    <Virtuoso
      computeItemKey={(key: number) => `item-${key.toString()}`}
      initialItemCount={30}
      itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
      style={{ height: 300 }}
      totalCount={100}
    />
  )
}
