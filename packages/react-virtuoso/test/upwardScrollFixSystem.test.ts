import { describe, expect, it, vi } from 'vitest'

import { domIOSystem } from '../src/domIOSystem'
import { recalcSystem } from '../src/recalcSystem'
import { sizeSystem } from '../src/sizeSystem'
import { upwardScrollFixSystem } from '../src/upwardScrollFixSystem'
import { init, publish, subscribe, system, tup } from '../src/urx'

const testSystem = system(
  ([upward, dom, size, recalc]) => ({ ...upward, ...dom, ...size, ...recalc }),
  tup(upwardScrollFixSystem, domIOSystem, sizeSystem, recalcSystem)
)

const ITEM_SIZE = 30
const UNSHIFTED = 10
const EXPECTED_OFFSET = ITEM_SIZE * UNSHIFTED

function setup() {
  const s = init(testSystem)
  // establish a default item size, so the unshift offset is computable
  publish(s.sizeRanges, [{ endIndex: 0, size: ITEM_SIZE, startIndex: 0 }])
  const scrolls: { top: number }[] = []
  const deviations: number[] = []
  subscribe(s.scrollBy, (v) => scrolls.push(v as { top: number }))
  subscribe(s.deviation, (v) => deviations.push(v))
  return { deviations, scrolls, system: s }
}

/** A `requestAnimationFrame` whose callbacks only run when told to. */
function heldFrames() {
  const callbacks: FrameRequestCallback[] = []
  const raf = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
    callbacks.push(cb)
    return 0
  })
  return {
    restore: () => {
      raf.mockRestore()
    },
    runNext: () => {
      const cb = callbacks.shift()
      if (cb) cb(0)
    },
    get pending() {
      return callbacks.length
    },
  }
}

/**
 * These cover the *protocol*: a prepend arms the compensation, and the scroll is
 * released by whichever arrives first — the renderer's acknowledgement that the
 * deviation reached the DOM, or the next-frame fallback — but never twice.
 *
 * They deliberately do not claim anything about DOM ordering or retained scroll
 * position; jsdom has no layout, so it cannot answer either. That is what
 * `e2e/prepend-items.test.ts` is for.
 */
describe('upwardScrollFixSystem — prepend compensation', () => {
  it('publishes the deviation but holds the scroll until it is acknowledged', () => {
    const frames = heldFrames()
    const { deviations, scrolls, system: s } = setup()

    publish(s.beforeUnshiftWith, UNSHIFTED)

    expect(deviations).toContain(EXPECTED_OFFSET)
    // Scrolling now would run against the pre-deviation layout: the content has
    // not grown yet, so the browser clamps the scroll to the old maximum and
    // part of the compensation is silently lost.
    expect(scrolls).toEqual([])

    publish(s.deviationCommitted, EXPECTED_OFFSET)
    expect(scrolls).toEqual([{ top: EXPECTED_OFFSET }])

    frames.restore()
  })

  it('ignores a deviation commit that is not the armed prepend', () => {
    const frames = heldFrames()
    const { scrolls, system: s } = setup()

    publish(s.beforeUnshiftWith, UNSHIFTED)
    // The resize and mobile-Safari paths publish deviations of their own.
    publish(s.deviationCommitted, EXPECTED_OFFSET - 1)
    publish(s.deviationCommitted, 0)

    expect(scrolls).toEqual([])

    frames.restore()
  })

  it('falls back to the deferred scroll when no acknowledgement arrives', () => {
    const frames = heldFrames()
    const { scrolls, system: s } = setup()

    publish(s.beforeUnshiftWith, UNSHIFTED)
    expect(scrolls).toEqual([])

    // No renderer acknowledged it — behave exactly as before this change.
    frames.runNext()
    expect(scrolls).toEqual([{ top: EXPECTED_OFFSET }])

    frames.restore()
  })

  it('compensates exactly once, whichever of the two arrives first', () => {
    const frames = heldFrames()
    const { scrolls, system: s } = setup()

    publish(s.beforeUnshiftWith, UNSHIFTED)
    publish(s.deviationCommitted, EXPECTED_OFFSET)
    // The fallback frame still fires afterwards; it must not scroll again.
    frames.runNext()
    expect(scrolls).toEqual([{ top: EXPECTED_OFFSET }])

    const late = init(testSystem)
    publish(late.sizeRanges, [{ endIndex: 0, size: ITEM_SIZE, startIndex: 0 }])
    const lateScrolls: { top: number }[] = []
    subscribe(late.scrollBy, (v) => lateScrolls.push(v as { top: number }))
    publish(late.beforeUnshiftWith, UNSHIFTED)
    frames.runNext()
    // A late acknowledgement, after the fallback already compensated.
    publish(late.deviationCommitted, EXPECTED_OFFSET)
    expect(lateScrolls).toEqual([{ top: EXPECTED_OFFSET }])

    frames.restore()
  })

  it('clears the deviation and releases recalc on the frame after compensating', () => {
    const frames = heldFrames()
    const { deviations, system: s } = setup()
    const recalcs: boolean[] = []
    subscribe(s.recalcInProgress, (v) => recalcs.push(v))

    publish(s.beforeUnshiftWith, UNSHIFTED)
    publish(s.deviationCommitted, EXPECTED_OFFSET)
    expect(deviations.at(-1)).toBe(EXPECTED_OFFSET)

    // The fallback frame is still queued; the clear is the one after it.
    frames.runNext()
    frames.runNext()
    expect(deviations.at(-1)).toBe(0)
    expect(recalcs.at(-1)).toBe(false)

    frames.restore()
  })

  it('does not let a repeated prepend be released by the previous acknowledgement', () => {
    const frames = heldFrames()
    const { scrolls, system: s } = setup()

    publish(s.beforeUnshiftWith, UNSHIFTED)
    publish(s.deviationCommitted, EXPECTED_OFFSET)
    expect(scrolls).toEqual([{ top: EXPECTED_OFFSET }])

    // A second page of the same size, before the deviation has been cleared.
    // Publishing it changes nothing, so no commit and no acknowledgement can
    // follow — and an acknowledgement carrying that same value is necessarily
    // the previous prepend's. It must not release this one.
    publish(s.beforeUnshiftWith, UNSHIFTED)
    publish(s.deviationCommitted, EXPECTED_OFFSET)
    expect(scrolls).toEqual([{ top: EXPECTED_OFFSET }])

    // The fallback is what compensates it, exactly once.
    frames.runNext()
    expect(scrolls).toEqual([{ top: EXPECTED_OFFSET }, { top: EXPECTED_OFFSET }])
    frames.runNext()
    frames.runNext()
    expect(scrolls).toEqual([{ top: EXPECTED_OFFSET }, { top: EXPECTED_OFFSET }])

    frames.restore()
  })
})
