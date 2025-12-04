import * as React from 'react'

import { Virtuoso } from '../src'

type ExpandedContextType = [boolean, React.Dispatch<React.SetStateAction<boolean>>]

const Expanded = React.createContext<ExpandedContextType>([false, () => undefined])

// Simulate expensive render by blocking for ~30ms
function simulateExpensiveRender() {
  const start = performance.now()
  while (performance.now() - start < 30) {
    // blocking loop
  }
}

/**
 * Item that is expensive to render (~30ms each).
 * This makes it obvious when items render fresh (visible jank when
 * many items render at once) vs. pre-rendered (smooth).
 */
const Item = ({ index }: { index: number }) => {
  const [expanded, setExpanded] = React.useContext(Expanded)

  // Only expensive on first render
  const hasRendered = React.useRef(false)
  if (!hasRendered.current) {
    simulateExpensiveRender()
    hasRendered.current = true
  }

  return (
    <div
      style={{
        alignItems: 'center',
        backgroundColor: index % 2 === 0 ? '#f5f5f5' : '#fff',
        border: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'row',
        height: index === 0 && !expanded ? 800 : 100,
        padding: '0 12px',
      }}
    >
      <div style={{ flex: 1 }}>
        <strong>Item {index}</strong>
      </div>
      {index === 0 && (
        <button
          onClick={() => {
            setExpanded(!expanded)
          }}
          style={{ fontSize: 14, padding: '8px 16px' }}
        >
          {expanded ? 'Expand' : 'Collapse'}
        </button>
      )}
    </div>
  )
}

/**
 * Demonstrates minOverscanItemCount which ensures N items are always
 * rendered before/after the visible viewport.
 *
 * Each item takes ~30ms to render. When you collapse item 0:
 * - OFF: Visible jank as items below render (~30ms each)
 * - ON: Smooth! Items were pre-rendered
 */
export function Example() {
  const [useMinOverscan, setUseMinOverscan] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const [key, setKey] = React.useState(0)

  return (
    <Expanded.Provider value={[expanded, setExpanded]}>
      <div style={{ fontFamily: 'system-ui', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useMinOverscan}
              onChange={(e) => {
                setUseMinOverscan(e.target.checked)
                setExpanded(false)
                setKey((k) => k + 1) // Reset list to re-render items
              }}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontWeight: 500 }}>minOverscanItemCount={useMinOverscan ? '5' : '0'}</span>
          </label>
        </div>
        <p style={{ color: '#666', fontSize: 14, margin: '0 0 12px' }}>
          Click Collapse on item 0. {useMinOverscan ? 'Smooth! Items were pre-rendered.' : 'Notice the jank as items render.'}
        </p>
        <Virtuoso
          key={key}
          itemContent={(index) => <Item index={index} />}
          minOverscanItemCount={useMinOverscan ? 5 : undefined}
          style={{ border: '2px solid #ccc', height: 500 }}
          totalCount={100}
        />
      </div>
    </Expanded.Provider>
  )
}
