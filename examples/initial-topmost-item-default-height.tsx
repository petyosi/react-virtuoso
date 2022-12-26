import * as React from 'react'
import { Virtuoso } from '../src'

//
const itemContent = (index: number) => <div style={{ height: index % 2 ? 30 : 20, background: 'white' }}>Item {index}</div>
export function Example() {
  return (
    <div>
      <h2>Randomly buggy in safari, container height gets reported later</h2>
      <Virtuoso totalCount={100} defaultItemHeight={30} itemContent={itemContent} initialTopMostItemIndex={60} style={{ height: 300 }} />
    </div>
  )
}
