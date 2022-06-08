import * as React from 'react'
import { Virtuoso } from '../src'

export default function App() {
  const [total, setTotal] = React.useState(10)
  return (
    <div style={{ display: 'flex', height: '500px', flexDirection: 'column', border: '1px solid red' }}>
      <Virtuoso
        computeItemKey={(key) => `item-${key}`}
        alignToBottom={true}
        totalCount={total}
        followOutput={'smooth'}
        itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
        style={{ height: '100%', flex: 1 }}
        components={{
          Header: () => <div>header</div>,
        }}
      />
      <div style={{ padding: '1rem' }}>
        <button onClick={() => setTotal((val) => val + 2)}>bump</button>
      </div>
    </div>
  )
}
