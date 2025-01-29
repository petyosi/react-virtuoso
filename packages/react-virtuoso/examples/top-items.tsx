import { Virtuoso } from '../src'

export function Example() {
  return (
    <Virtuoso
      itemContent={(index) => <div style={{ background: 'white', height: index % 2 ? 30 : 20 }}>Item {index}</div>}
      style={{ height: 300 }}
      topItemCount={3}
      totalCount={100}
    />
  )
}
