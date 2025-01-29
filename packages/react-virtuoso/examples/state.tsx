import * as React from 'react'
import { StateSnapshot, Virtuoso, VirtuosoHandle } from '../src'

function Header() {
  return <div>Header</div>
}

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)
  const state = React.useRef<StateSnapshot | undefined>(undefined)
  const [key, setKey] = React.useState(0)

  return (
    <div>
      <button
        onClick={() => {
          ref.current?.getState((snapshot) => {
            state.current = snapshot
          })
          setKey((value) => value + 1)
        }}
      >
        Save state and reload
      </button>
      <button onClick={() => setKey((value) => value + 1)}>Reload</button>

      <Virtuoso
        key={key}
        ref={ref}
        restoreStateFrom={state.current}
        computeItemKey={(key: number) => `item-${key.toString()}`}
        components={{
          Header,
        }}
        totalCount={100}
        itemContent={(index) => <div style={{ height: index % 2 ? 30 : 20 }}>Item {index}</div>}
        style={{ height: 300 }}
      />
    </div>
  )
}
