import * as React from 'react'
import { GroupedVirtuoso } from '../src'

export default function App() {
  return (
    <GroupedVirtuoso
      groupCounts={[10, 10, 10, 10, 10]}
      topItemCount={2}
      components={{
        Item: ({ children, ...props }) => (
          <div {...props} style={{ border: '1px solid red' }}>
            {children}
          </div>
        ),
        Group: ({ children, ...props }) => (
          <div {...props} style={{ border: '1px solid blue' }}>
            {children}
          </div>
        ),
        Footer: () => <div style={{ height: 60 }}>Footer</div>,
        List: React.forwardRef(({ style, children }, ref) => (
          <span ref={ref} style={{ ...style, display: 'block', background: 'grey' }}>
            {children}
          </span>
        )),
      }}
      itemContent={index => <div style={{ height: 30 }}>Item {index}</div>}
      style={{ height: 300 }}
    />
  )
}
