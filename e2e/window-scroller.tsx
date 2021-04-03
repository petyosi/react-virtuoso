import * as React from 'react'
import { Virtuoso, VirtuosoHandle } from '../src/'

export default function App() {
  const ref = React.useRef<VirtuosoHandle>(null)
  return (
    <div style={{ padding: '100px' }}>
      <button onClick={() => ref.current!.scrollToIndex(20)}>Scroll</button>
      <Virtuoso
        ref={ref}
        totalCount={100}
        itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
        style={{ border: '1px solid red', height: '300px' }}
        useWindowScroll={true}
      />
    </div>
  )
}
