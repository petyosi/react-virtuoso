import * as React from 'react'

import { Virtuoso } from '../src'

import type { ListRange, VirtuosoHandle } from '../src'

const itemStyle: React.CSSProperties = {
  alignItems: 'center',
  background: '#e8edf5',
  border: '1px solid #aeb7c6',
  boxSizing: 'border-box',
  display: 'flex',
  height: '100%',
  justifyContent: 'center',
  width: 100,
}

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)
  const [range, setRange] = React.useState<ListRange>({ endIndex: 0, startIndex: 0 })

  return (
    <div style={{ height: 160, width: 520 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          id="start-0"
          onClick={() => {
            ref.current!.scrollToIndex({ align: 'start', index: 0 })
          }}
        >
          Start 0
        </button>
        <button
          id="start-20"
          onClick={() => {
            ref.current!.scrollToIndex({ align: 'start', index: 20 })
          }}
        >
          Start 20
        </button>
        <button
          id="end-20"
          onClick={() => {
            ref.current!.scrollToIndex({ align: 'end', index: 20 })
          }}
        >
          End 20
        </button>
        <span data-testid="range">
          {range.startIndex}-{range.endIndex}
        </span>
      </div>
      <Virtuoso
        computeItemKey={(key: number) => `item-${key.toString()}`}
        horizontalDirection
        itemContent={(index) => <div style={itemStyle}>Item {index}</div>}
        rangeChanged={setRange}
        ref={ref}
        style={{ direction: 'rtl', height: 100, width: '100%' }}
        totalCount={100}
      />
    </div>
  )
}
