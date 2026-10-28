import * as React from 'react'

import { Virtuoso } from '../src'

import type { VirtuosoHandle } from '../src'

// Heights vary widely, so the estimated offset of an unrendered item is off
// and a smooth scrollToIndex has to retry after measuring.
const heightOf = (index: number) => 20 + ((index * 37) % 9) * 22

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)
  return (
    <>
      <div>
        <button
          id="smooth-80"
          onClick={() => {
            ref.current!.scrollToIndex({ behavior: 'smooth', index: 80 })
          }}
        >
          Smooth to 80
        </button>
        <button
          id="jump-then-smooth-80"
          onClick={() => {
            ref.current!.scrollToIndex({ index: 0 })
            setTimeout(() => {
              ref.current!.scrollToIndex({ behavior: 'smooth', index: 80 })
            }, 50)
          }}
        >
          Scroll to 0, then smooth to 80 after 50 ms
        </button>
      </div>
      <Virtuoso
        itemContent={(index) => (
          <div data-item-index={index} style={{ background: 'white', height: heightOf(index) }}>
            Item {index}
          </div>
        )}
        ref={ref}
        style={{ height: 400 }}
        totalCount={1000}
      />
    </>
  )
}
