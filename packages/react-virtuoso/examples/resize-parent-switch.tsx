import * as React from 'react'
import { flushSync } from 'react-dom'

import { Virtuoso } from '../src'

import type { VirtuosoHandle } from '../src'

export function Example() {
  const [outer, setOuter] = React.useState<HTMLDivElement | null>(null)
  const [inner, setInner] = React.useState<HTMLDivElement | null>(null)
  const [parent, setParent] = React.useState<HTMLElement | null>(null)
  const [complete, setComplete] = React.useState(false)
  const virtuoso = React.useRef<VirtuosoHandle>(null)
  const observerRef = React.useRef<ResizeObserver | null>(null)
  const frameRef = React.useRef<number | undefined>(undefined)

  React.useEffect(() => {
    if (outer) {
      setParent(outer)
    }
  }, [outer])

  React.useEffect(
    () => () => {
      observerRef.current?.disconnect()
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current)
      }
    },
    []
  )

  const switchParent = () => {
    if (!outer || !inner) {
      return
    }
    // Deliver a resize for the old parent, then change parents while that delivery is in progress.
    const observer = new ResizeObserver(() => {
      observer.disconnect()
      flushSync(() => setParent(inner))
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = undefined
        virtuoso.current?.scrollToIndex({ align: 'start', index: 20 })
        setComplete(true)
      })
    })
    observerRef.current = observer
    observer.observe(outer)
    outer.style.height = '501px'
  }

  return (
    <>
      <button disabled={!parent || complete} onClick={switchParent}>
        Switch parent and scroll to row 20
      </button>
      <div id="switch-complete">{String(complete)}</div>
      <div ref={setOuter} style={{ boxSizing: 'border-box', height: 500, overflow: 'auto', paddingTop: 50 }}>
        <div id="inner-scroll-parent" ref={setInner} style={{ boxSizing: 'border-box', height: 300, overflow: 'auto', paddingTop: 50 }}>
          {parent ? (
            <Virtuoso
              customScrollParent={parent}
              fixedItemHeight={25}
              itemContent={(index) => <div style={{ height: 25 }}>Row {index}</div>}
              ref={virtuoso}
              skipAnimationFrameInResizeObserver
              totalCount={100}
            />
          ) : null}
        </div>
      </div>
    </>
  )
}
