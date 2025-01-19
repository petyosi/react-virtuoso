import * as React from 'react'
import { Virtuoso } from '../src/'

export function Example() {
  return (
    <Virtuoso
      computeItemKey={(key) => `item-${key}`}
      totalCount={10}
      initialTopMostItemIndex={9}
      itemContent={(index) => <div style={{ backgroundColor: '#e5e5e5', height: index % 2 ? 800 : 100 }}>Group {index}</div>}
      style={{ height: 500 }}
    />
  )
}
