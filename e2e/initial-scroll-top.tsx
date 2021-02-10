import * as React from 'react'
import { Virtuoso } from '../src/'

export default function App() {
  return (
    <Virtuoso
      computeItemKey={(key) => `item-${key}`}
      initialItemCount={30}
      totalCount={100}
      initialScrollTop={50}
      itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
      style={{ height: 300 }}
    />
  )
}
