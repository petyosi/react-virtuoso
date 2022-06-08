import * as React from 'react'
import { Virtuoso } from '../src'

// globalThis['VIRTUOSO_LOG_LEVEL'] = 0

export default function App() {
  return (
    <Virtuoso
      style={{ height: 500 }}
      initialTopMostItemIndex={99}
      totalCount={100}
      defaultItemHeight={1000}
      itemContent={(index) => <div style={{ height: 100 }}>Item {index}</div>}
    />
  )
}
