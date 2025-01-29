import * as React from 'react'
import { Virtuoso, VirtuosoHandle } from '../src'

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)

  return (
    <>
      <Virtuoso
        ref={ref}
        computeItemKey={(key) => `item-${key}`}
        totalCount={100}
        components={{
          Item: ({ children, ...props }) => (
            <div {...props} style={{ border: '1px solid red' }}>
              {children}
            </div>
          ),
          List: React.forwardRef(({ style, children, ...props }, ref) => (
            <div ref={ref} style={{ ...style, display: 'flex', flexDirection: 'column', gap: 20, background: 'grey' }} {...props}>
              {children}
            </div>
          )),
        }}
        itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
        style={{ height: 300 }}
      />
      <div>
        <button id="start-30" onClick={() => ref.current!.scrollToIndex({ index: 30, align: 'start' })}>
          Start 30
        </button>
        <button id="offset-30" onClick={() => ref.current!.scrollToIndex({ index: 30, offset: 5 })}>
          Offset 30 by 5px
        </button>
        <button id="center-50" onClick={() => ref.current!.scrollToIndex({ index: 50, align: 'center' })}>
          Center 50
        </button>
        <button id="end-99" onClick={() => ref.current!.scrollToIndex({ index: 99, align: 'end' })}>
          End 99
        </button>
      </div>
    </>
  )
}
