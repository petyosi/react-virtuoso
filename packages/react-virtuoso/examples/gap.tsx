import * as React from 'react'

import { Virtuoso, VirtuosoHandle } from '../src'

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)

  return (
    <>
      <Virtuoso
        components={{
          Item: ({ children, ...props }) => (
            <div {...props} style={{ border: '1px solid red' }}>
              {children}
            </div>
          ),
          List: React.forwardRef(({ children, style, ...props }, ref) => (
            <div ref={ref} style={{ ...style, background: 'grey', display: 'flex', flexDirection: 'column', gap: 20 }} {...props}>
              {children}
            </div>
          )),
        }}
        computeItemKey={(key) => `item-${key}`}
        itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
        ref={ref}
        style={{ height: 300 }}
        totalCount={100}
      />
      <div>
        <button
          id="start-30"
          onClick={() => {
            ref.current!.scrollToIndex({ align: 'start', index: 30 })
          }}
        >
          Start 30
        </button>
        <button
          id="offset-30"
          onClick={() => {
            ref.current!.scrollToIndex({ index: 30, offset: 5 })
          }}
        >
          Offset 30 by 5px
        </button>
        <button
          id="center-50"
          onClick={() => {
            ref.current!.scrollToIndex({ align: 'center', index: 50 })
          }}
        >
          Center 50
        </button>
        <button
          id="end-99"
          onClick={() => {
            ref.current!.scrollToIndex({ align: 'end', index: 99 })
          }}
        >
          End 99
        </button>
      </div>
    </>
  )
}
