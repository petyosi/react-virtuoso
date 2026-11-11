import * as React from 'react'

import { Virtuoso } from '../src'

import type { Components, StateSnapshot, VirtuosoHandle } from '../src'

const components = {
  Header: () => <div style={{ background: 'orange', height: 50 }}>Header</div>,
  List: React.forwardRef(({ children, style, ...props }, ref) => (
    <div ref={ref} style={{ ...style, display: 'flex', flexDirection: 'column', gap: 10 }} {...props}>
      {children}
    </div>
  )),
} satisfies Components

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)

  const [snapshot, setSnapshot] = React.useState<StateSnapshot>()
  const [generation, setGeneration] = React.useState(0)
  const noHeader = new URLSearchParams(window.location.search).has('noHeader')

  return (
    <>
      <Virtuoso
        components={noHeader ? { List: components.List } : components}
        key={generation}
        {...(snapshot ? { restoreStateFrom: snapshot } : {})}
        computeItemKey={(key) => `item-${key}`}
        itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
        ref={ref}
        style={{ height: 300 }}
        totalCount={100}
      />
      <div>
        <button
          id="offset-0"
          onClick={() => {
            ref.current!.scrollToIndex({ index: 0, offset: 100 })
          }}
        >
          Index 0 with offset
        </button>
        <button
          id="restore"
          onClick={() => {
            ref.current!.getState((state) => {
              setSnapshot(state)
              setGeneration((value) => value + 1)
            })
          }}
        >
          Save and restore
        </button>
        <button
          id="index-50"
          onClick={() => {
            ref.current!.scrollToIndex({ index: 50 })
          }}
        >
          Index 50
        </button>
        <button
          id="index-0"
          onClick={() => {
            ref.current!.scrollToIndex({ index: 0 })
          }}
        >
          Index 0
        </button>
        <button
          id="index-1"
          onClick={() => {
            ref.current!.scrollToIndex({ index: 1 })
          }}
        >
          Index 1
        </button>
        <button
          id="into-view-0"
          onClick={() => {
            ref.current!.scrollIntoView({ index: 0 })
          }}
        >
          Into view 0
        </button>
      </div>
    </>
  )
}
