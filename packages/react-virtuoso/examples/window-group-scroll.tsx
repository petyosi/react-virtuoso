import * as React from 'react'
import { GroupedVirtuoso } from '../src'

export function Example() {
  return (
    <GroupedVirtuoso
      useWindowScroll
      groupCounts={Array.from({ length: 20 }).fill(3) as number[]}
      itemContent={(index) => <div style={{ height: '20px' }}>Item {index}</div>}
      groupContent={(index) => <div style={{ height: '30px', backgroundColor: 'gray' }}>Group {index}</div>}
      style={{ height: '300px' }}
    />
  )
}
