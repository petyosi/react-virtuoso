import * as React from 'react'
import { Virtuoso, VirtuosoHandle } from '../src'

export default function App() {
  const ref = React.createRef<VirtuosoHandle>()
  return (
    <>
      <div>
        <button id="start-30" onClick={() => ref.current.scrollToIndex({ index: 30, align: 'start' })}>
          Start 30
        </button>
        <button id="center-50" onClick={() => ref.current.scrollToIndex({ index: 50, align: 'center' })}>
          Center 50
        </button>
        <button id="end-99" onClick={() => ref.current.scrollToIndex({ index: 99, align: 'end' })}>
          End 99
        </button>
      </div>
      <Virtuoso
        ref={ref}
        totalCount={100}
        itemContent={index => <div style={{ height: index % 2 ? 30 : 20, background: 'white' }}>Item {index}</div>}
        style={{ height: 300 }}
      />
    </>
  )
}
