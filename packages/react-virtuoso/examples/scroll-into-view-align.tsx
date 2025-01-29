import * as React from 'react'

import { Virtuoso, VirtuosoHandle } from '../src'

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)

  return (
    <>
      <Virtuoso
        itemContent={(index) => (
          <div style={{ background: 'white', color: index === 50 ? 'red' : 'black', height: index % 2 ? 30 : 20 }}>Item {index}</div>
        )}
        ref={ref}
        style={{ height: 300 }}
        totalCount={100}
      />
      <div>
        <button
          id="start"
          onClick={() => {
            ref.current!.scrollIntoView({ align: 'start', index: 50 })
          }}
        >
          Item 50 Start
        </button>
        <button
          id="offset-30"
          onClick={() => {
            ref.current!.scrollIntoView({ align: 'center', index: 50 })
          }}
        >
          Item 50 Center
        </button>
        <button
          id="center-50"
          onClick={() => {
            ref.current!.scrollIntoView({ align: 'end', index: 50 })
          }}
        >
          Item 50 End
        </button>
      </div>
    </>
  )
}
