import * as React from 'react'
import { Virtuoso } from '../src'

export function Example() {
  return (
    <div style={{ width: 500, height: 100, resize: 'both', overflow: 'hidden' }}>
      <Virtuoso
        computeItemKey={(key: number) => `item-${key.toString()}`}
        totalCount={100}
        itemContent={(index) => <div style={{ height: '100%', aspectRatio: '1 / 1', background: '#ccc' }}>Item {index}</div>}
        style={{ height: '100%' }}
        horizontalDirection
      />
    </div>
  )
}
