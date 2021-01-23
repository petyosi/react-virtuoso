import * as React from 'react'
import { Virtuoso } from '../src'

export default function App() {
  return (
    <Virtuoso
      computeItemKey={key => `item-${key}`}
      defaultItemHeight={30}
      totalCount={100}
      itemContent={index => <div style={{ height: 30 }}>Item {index}</div>}
      style={{ height: 300 }}
    />
  )
}

