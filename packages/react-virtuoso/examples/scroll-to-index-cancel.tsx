import * as React from 'react'

import { Virtuoso } from '../src'

import type { VirtuosoHandle } from '../src'

// Heights vary widely, so scrollToIndex lands on an estimate and retries
// when the rendered items are measured.
const heightOf = (index: number) => 20 + ((index * 37) % 9) * 22

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)
  const cancelOnWheel = React.useRef(true)
  return (
    <>
      <div>
        <button
          id="scroll-to-600"
          onClick={() => {
            ref.current!.scrollToIndex({ index: 600 })
          }}
        >
          Scroll to 600
        </button>
        <label>
          <input
            defaultChecked
            id="cancel-on-wheel"
            onChange={(event) => {
              cancelOnWheel.current = event.target.checked
            }}
            type="checkbox"
          />
          Cancel scrollToIndex on wheel
        </label>
      </div>
      <Virtuoso
        itemContent={(index) => (
          <div data-item-index={index} style={{ background: 'white', height: heightOf(index) }}>
            Item {index}
          </div>
        )}
        ref={ref}
        scrollerRef={(scroller) => {
          scroller?.addEventListener(
            'wheel',
            () => {
              if (cancelOnWheel.current) {
                ref.current?.cancelScrollToIndex()
              }
            },
            { passive: true }
          )
        }}
        style={{ height: 400 }}
        totalCount={1000}
      />
    </>
  )
}
