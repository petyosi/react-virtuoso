import * as React from 'react'
import { Virtuoso, VirtuosoHandle } from '../src'

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)

  return (
    <>
      <Virtuoso
        ref={ref}
        totalCount={100}
        itemContent={(index) => (
          <div style={{ height: index % 2 ? 30 : 20, background: 'white', color: index === 50 ? 'red' : 'black' }}>Item {index}</div>
        )}
        style={{ height: 300 }}
      />
      <div>
        <button id="start" onClick={() => ref.current!.scrollIntoView({ index: 50, align: 'start' })}>
          Item 50 Start
        </button>
        <button id="offset-30" onClick={() => ref.current!.scrollIntoView({ index: 50, align: 'center' })}>
          Item 50 Center
        </button>
        <button id="center-50" onClick={() => ref.current!.scrollIntoView({ index: 50, align: 'end' })}>
          Item 50 End
        </button>
      </div>
    </>
  )
}
