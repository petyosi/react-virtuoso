import * as React from 'react'
import { Virtuoso } from '../src/'

export function Example() {
  return (
    <Virtuoso
      computeItemKey={(key) => `item-${key}`}
      totalCount={1000}
      itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
      style={{ height: 300 }}
      scrollSeekConfiguration={{
        enter: (velocity) => Math.abs(velocity) > 200,
        exit: (velocity) => Math.abs(velocity) < 30,
      }}
      components={{
        ScrollSeekPlaceholder: ({ height, index }) => (
          <div aria-label="placeholder" style={{ height, color: 'red' }}>
            Placeholder {index}
          </div>
        ),
      }}
    />
  )
}
