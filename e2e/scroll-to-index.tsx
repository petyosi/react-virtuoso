import * as React from 'react'
import { Virtuoso, VirtuosoHandle } from '../src'

export default function App() {
  const ref = React.useRef<VirtuosoHandle>(null)
  const [visible, setVisible] = React.useState(true)
  return (
    <>
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
        <button onClick={() => setVisible(!visible)}>Toggle</button>
      </div>
      <Virtuoso
        ref={ref}
        startReached={() => console.log('start')}
        totalCount={100}
        itemContent={(index) => <div style={{ height: index % 2 ? 30 : 20, background: 'white' }}>Item {index}</div>}
        style={{ height: 300, display: visible ? 'block' : 'none' }}
      />
    </>
  )
}
