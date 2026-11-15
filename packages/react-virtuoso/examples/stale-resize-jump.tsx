import * as React from 'react'
import { flushSync } from 'react-dom'

import { Virtuoso } from '../src'

// Repro for https://github.com/petyosi/react-virtuoso/issues/1571
// A clamp jump recorded when the last row shrinks stays latched in lastJumpDueToItemResize
// and is added again to the next unrelated height change while scrolling up.

const COUNT = 100
const ROW = 100
const LAST_TALL = 400
const SHRINK = LAST_TALL - ROW
const SCROLL_UP = 150

const nextFrames = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

function Repro({ onReset }: { onReset: () => void }) {
  const scroller = React.useRef<HTMLElement | null>(null)
  const [lastShrunk, setLastShrunk] = React.useState(false)
  const [grown, setGrown] = React.useState<number | null>(null)
  const [log, setLog] = React.useState<string[]>([])
  const armed = React.useRef(false)
  const lastScrollTop = React.useRef(0)

  const snapshot = React.useCallback((label: string) => {
    const el = scroller.current
    if (!el) {
      return
    }
    const fromBottom = Math.round(el.scrollHeight - el.clientHeight - el.scrollTop)
    setLog((l) => [...l, `${label}: scrollTop=${Math.round(el.scrollTop)}, distance from bottom=${fromBottom}px`])
  }, [])

  const record = React.useCallback(
    async (label: string) => {
      await nextFrames()
      await nextFrames()
      snapshot(label)
    },
    [snapshot]
  )

  // The compensation only runs while scrollDirection is UP, which Virtuoso resets 50ms after the last scroll event,
  // so the 1px re-measure has to land during the scroll, like a row correcting its estimate as a wheel notch reveals it.
  const growTopRow = React.useCallback(() => {
    if (!armed.current) {
      return
    }
    armed.current = false
    const index = Math.floor((scroller.current?.scrollTop ?? 0) / ROW)
    // After Virtuoso has handled the scroll event (or it still sees the list at the bottom and followOutput takes over),
    // but well inside its 50ms scroll direction window.
    setTimeout(() => {
      flushSync(() => {
        setGrown(index)
      })
      void record(`3. row ${index} (straddling the viewport top) re-measured 1px taller during that scroll`)
    }, 0)
  }, [record])

  const onScroll = React.useCallback(() => {
    const el = scroller.current
    if (!el) {
      return
    }
    const goingUp = el.scrollTop < lastScrollTop.current
    lastScrollTop.current = el.scrollTop
    if (goingUp) {
      growTopRow()
    }
  }, [growTopRow])

  const shrink = async () => {
    setLastShrunk(true)
    await record(`1. last row shrank by ${SHRINK}px (browser clamps scrollTop)`)
    armed.current = true
  }

  const scrollUp = () => {
    if (scroller.current) {
      scroller.current.scrollTop -= SCROLL_UP
    }
    snapshot(`2. scrolled up ${SCROLL_UP}px`)
  }

  const runAll = async () => {
    await record('0. start, following the bottom')
    await shrink()
    scrollUp()
  }

  return (
    <div style={{ display: 'flex', fontFamily: 'sans-serif', fontSize: 14, gap: 16 }}>
      <Virtuoso
        defaultItemHeight={ROW}
        followOutput
        initialTopMostItemIndex={COUNT - 1}
        itemContent={(index) => {
          let height = ROW
          if (index === COUNT - 1 && !lastShrunk) {
            height = LAST_TALL
          }
          if (index === grown) {
            height = ROW + 1
          }
          return (
            <div style={{ borderBottom: '1px solid #ccc', boxSizing: 'border-box', height, padding: 8 }}>
              Item {index} ({height}px)
            </div>
          )
        }}
        scrollerRef={(el) => {
          scroller.current?.removeEventListener('scroll', onScroll)
          scroller.current = el as HTMLElement | null
          scroller.current?.addEventListener('scroll', onScroll)
        }}
        style={{ height: 500, outline: '1px solid #999', width: 360 }}
        totalCount={COUNT}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 }}>
        <button onClick={() => void runAll()}>Run all steps</button>
        <button onClick={() => void shrink()}>1. Shrink last row by {SHRINK}px</button>
        <button onClick={scrollUp}>2. Scroll up {SCROLL_UP}px (or use the wheel)</button>
        <button onClick={onReset}>Reset</button>
        <p>
          After step 1, the first upward scroll makes the topmost rendered row 1px taller (step 3).
          <br />
          Expected after step 3: distance from bottom stays ~{SCROLL_UP}px (Virtuoso compensates the 1px with scrollBy(1)).
          <br />
          Bug: Virtuoso adds the stale {SHRINK}px jump, calls scrollBy({SHRINK + 1}), and the list snaps back to the bottom.
        </p>
        <ol data-testid="log" style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export function Example() {
  const [key, setKey] = React.useState(0)
  return <Repro key={key} onReset={() => setKey((k) => k + 1)} />
}
