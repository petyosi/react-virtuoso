import * as React from 'react'

import { GroupedVirtuoso } from '../src'

export function Example() {
  return (
    <GroupedVirtuoso
      components={{
        Footer: () => <div style={{ height: 60 }}>Footer</div>,
        Group: ({ children, ...props }) => (
          <div {...props} style={{ border: '1px solid blue' }}>
            {children}
          </div>
        ),
        Item: ({ children, ...props }) => (
          <div {...props} style={{ border: '1px solid red' }}>
            {children}
          </div>
        ),
        List: React.forwardRef(({ children, style }, ref) => (
          <span ref={ref} style={{ ...style, background: 'grey', display: 'block' }}>
            {children}
          </span>
        )),
      }}
      groupCounts={[10, 10, 10, 10, 10]}
      itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
      style={{ height: 300 }}
      topItemCount={2}
    />
  )
}
