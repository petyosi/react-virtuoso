import * as React from 'react'

import { Virtuoso, VirtuosoHandle } from '../src'

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)
  const [visible, setVisible] = React.useState(true)
  return (
    <>
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
        <button
          onClick={() => {
            setVisible(!visible)
          }}
        >
          Toggle
        </button>
      </div>
      <Virtuoso
        itemContent={(index) => <div style={{ background: 'white', height: index % 2 ? 30 : 20 }}>Item {index}</div>}
        ref={ref}
        style={{ display: visible ? 'block' : 'none', height: 300 }}
        totalCount={100}
      />
    </>
  )
}
