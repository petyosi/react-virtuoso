import * as React from 'react'

import { Virtuoso } from '../src'

import type { ListRange } from '../src'

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
  const [direction, setDirection] = React.useState<'ltr' | 'rtl'>('ltr')
  const [range, setRange] = React.useState<ListRange>({ endIndex: 0, startIndex: 0 })

  return (
    <div style={{ height: 160, width: 520 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button id="toggle-direction" onClick={() => setDirection((current) => (current === 'ltr' ? 'rtl' : 'ltr'))}>
          Toggle direction
        </button>
        <span data-testid="direction">{direction}</span>
        <span data-testid="range">
          {range.startIndex}-{range.endIndex}
        </span>
      </div>
      <Virtuoso
        computeItemKey={(key: number) => `item-${key.toString()}`}
        horizontalDirection
        itemContent={(index) => <div style={itemStyle}>Item {index}</div>}
        rangeChanged={setRange}
        style={{ direction, height: 100, width: '100%' }}
        totalCount={100}
      />
    </div>
  )
}
