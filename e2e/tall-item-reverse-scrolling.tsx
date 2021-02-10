import * as React from 'react'
import { Virtuoso } from '../src/'

export default function App() {
  return (
    <Virtuoso
      totalCount={100}
      itemContent={(index) => (
        <div style={{ border: '1px solid black' }}>
          Item {index}
          <div>
            {Array.from({ length: index % 2 ? 3 : 20 }, (_, i) => (
              <div key={i}>Line {i}</div>
            ))}
          </div>
        </div>
      )}
      initialTopMostItemIndex={99}
      style={{ height: 300 }}
    />
  )
}
