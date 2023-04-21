import * as React from 'react'
import { Virtuoso, VirtuosoHandle } from '../src'
import { StateSnapshot } from '../src/stateLoadSystem'

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)
  const state = React.useRef<StateSnapshot | undefined>(undefined)
  const [key, setKey] = React.useState(0)

  console.log('Rendering with key', key)
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
        Log State
      </button>

      <Virtuoso
        key={key}
        ref={ref}
        restoreStateFrom={state.current}
        computeItemKey={(key: number) => `item-${key.toString()}`}
        totalCount={100}
        itemContent={(index) => <div style={{ height: index % 2 ? 30 : 20 }}>Item {index}</div>}
        style={{ height: 300 }}
      />
    </div>
  )
}
