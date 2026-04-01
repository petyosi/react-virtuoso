import * as React from 'react'

import { Virtuoso } from '../src'

export function Example() {
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  return (
    <div ref={scrollerRef} style={{ background: 'lightgrey', height: '50vh', overflow: 'auto', padding: '50px' }}>
      <p>This content is above the list and scrolls with it inside a custom scroll container.</p>
      <Virtuoso
        scrollElementRef={scrollerRef}
        itemContent={(index) => <div style={{ height: index % 2 ? 50 : 20 }}>Item {index}</div>}
        style={{ border: '1px solid red' }}
        totalCount={100}
      />
    </div>
  )
}
