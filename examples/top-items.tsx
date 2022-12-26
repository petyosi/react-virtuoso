import * as React from 'react'
import { Virtuoso } from '../src'

export function Example() {
  return (
    <Virtuoso
      totalCount={100}
      topItemCount={3}
      itemContent={(index) => <div style={{ height: index % 2 ? 30 : 20, background: 'white' }}>Item {index}</div>}
      style={{ height: 300 }}
    />
  )
}
