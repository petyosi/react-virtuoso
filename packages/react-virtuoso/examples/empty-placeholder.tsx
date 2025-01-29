import { useState } from 'react'

import { Virtuoso } from '../src'

export function Example() {
  const [totalCount, setTotalCount] = useState(1000)
  return (
    <div>
      <button
        onClick={() => {
          setTotalCount(totalCount === 1000 ? 0 : 1000)
        }}
      >
        Toggle
      </button>
      <Virtuoso
        components={{
          EmptyPlaceholder: () => {
            console.log('empty placeholder rendered')
            return <div>Nothing to See here!</div>
          },
        }}
        computeItemKey={(key) => `item-${key}`}
        itemContent={(index) => <div style={{ height: 30 }}>Item {index}</div>}
        style={{ height: 300 }}
        totalCount={totalCount}
      />
      <p>Empty placeholder should not be flashed in default rendering. check the console for logs.</p>
    </div>
  )
}
