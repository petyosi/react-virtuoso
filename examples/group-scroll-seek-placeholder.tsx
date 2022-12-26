import * as React from 'react'
import { GroupedVirtuoso } from '../src/'

export function Example() {
  return (
    <>
      <p>Scroll fast, groups should be green placeholders</p>
      <GroupedVirtuoso
        groupCounts={Array.from({ length: 20 }).fill(20) as number[]}
        itemContent={(index) => <div style={{ height: '20px' }}>Item {index}</div>}
        groupContent={(index) => <div style={{ height: '30px' }}>Group {index}</div>}
        computeItemKey={(key) => `item-${key}`}
        style={{ height: 800 }}
        scrollSeekConfiguration={{
          enter: (velocity) => Math.abs(velocity) > 200,
          exit: (velocity) => Math.abs(velocity) < 30,
        }}
        components={{
          ScrollSeekPlaceholder: ({ height, index, type }) => (
            <div style={{ height, color: type === 'group' ? 'green' : 'red' }}>Placeholder {index}</div>
          ),
        }}
      />
    </>
  )
}
