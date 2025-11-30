import { useMemo, useState } from 'react'
import { Virtuoso } from '../src'

// Simulate a scenario where item heights vary widely
function generateItemHeights(count: number) {
  const heights: number[] = []
  for (let i = 0; i < count; i++) {
    // Mix of small items (40-100px), medium items (150-400px), and large items (500-2000px)
    const rand = Math.random()
    if (rand < 0.6) {
      // 60% small items
      heights.push(40 + Math.floor(Math.random() * 60))
    } else if (rand < 0.9) {
      // 30% medium items
      heights.push(150 + Math.floor(Math.random() * 250))
    } else {
      // 10% large items
      heights.push(500 + Math.floor(Math.random() * 1500))
    }
  }
  return heights
}

export function Example() {
  const [useEstimates, setUseEstimates] = useState(true)
  const heightEstimates = useMemo(() => generateItemHeights(1000), [])

  return (
    <div>
      <label style={{ display: 'block', marginBottom: 12, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={useEstimates}
          onChange={(e) => {
            setUseEstimates(e.target.checked)
          }}
        />{' '}
        Use height estimates (toggle and scroll to see the difference)
      </label>
      <Virtuoso
        key={useEstimates ? 'with-estimates' : 'without-estimates'}
        computeItemKey={(key) => `item-${key}`}
        heightEstimates={useEstimates ? heightEstimates : undefined}
        itemContent={(index) => (
          <div
            style={{
              height: heightEstimates[index],
              padding: '8px 16px',
              borderBottom: '1px solid #eee',
              background: heightEstimates[index] > 400 ? '#f0f8ff' : '#fff',
            }}
          >
            <strong>Item {index}</strong>
            <div style={{ color: '#666', fontSize: 12 }}>Height: {heightEstimates[index]}px</div>
            {heightEstimates[index] > 200 && <div style={{ marginTop: 8, color: '#888' }}>This is a larger item with more content...</div>}
          </div>
        )}
        style={{ height: 600 }}
        totalCount={1000}
      />
    </div>
  )
}
