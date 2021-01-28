import * as React from 'react'
import { Virtuoso } from '../src/'

export default function App() {
  return (
    <Virtuoso
      computeItemKey={key => `item-${key}`}
      totalCount={10}
      initialTopMostItemIndex={9}
      itemContent={index => <div style={{ height: index % 2 ? 800 : 100 }}>Group {index}</div>}
      style={{ height: 500 }}
    />
  )
}
