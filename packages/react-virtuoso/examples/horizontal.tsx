import { Virtuoso } from '../src'

export function Example() {
  return (
    <div style={{ height: 100, overflow: 'hidden', resize: 'both', width: 500 }}>
      <Virtuoso
        computeItemKey={(key: number) => `item-${key.toString()}`}
        horizontalDirection
        itemContent={(index) => <div style={{ aspectRatio: '1 / 1', background: '#ccc', height: '100%' }}>Item {index}</div>}
        style={{ height: '100%' }}
        totalCount={100}
      />
    </div>
  )
}
