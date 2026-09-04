import { describe, expect, it, vi } from 'vitest'

import { domIOSystem } from '../src/domIOSystem'
import { sizeSystem } from '../src/sizeSystem'
import { upwardScrollFixSystem } from '../src/upwardScrollFixSystem'
import { init, publish, subscribe, system, tup } from '../src/urx'

const testSystem = system(
  ([upward, dom, size]) => ({ ...upward, ...dom, ...size }),
  tup(upwardScrollFixSystem, domIOSystem, sizeSystem)
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

describe('upwardScrollFixSystem — prepend compensation', () => {
  it('publishes the compensating scroll in the same task as the deviation', () => {
    // A requestAnimationFrame that never runs its callback: whatever is only
    // reachable from inside a frame callback will not have happened.
    const raf = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 0)
    const { deviations, scrolls, system: s } = setup()

    publish(s.beforeUnshiftWith, UNSHIFTED)

    expect(deviations).toContain(EXPECTED_OFFSET)
    // The regression: deferring this by a frame leaves one painted frame in
    // which the list is displaced by the full page height with nothing
    // compensating it, so the viewport renders empty.
    expect(scrolls).toEqual([{ top: EXPECTED_OFFSET }])

    raf.mockRestore()
  })

  it('still clears the deviation on the next frame', () => {
    const callbacks: FrameRequestCallback[] = []
    const raf = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      callbacks.push(cb)
      return 0
    })
    const { deviations, system: s } = setup()

    publish(s.beforeUnshiftWith, UNSHIFTED)
    expect(deviations.at(-1)).toBe(EXPECTED_OFFSET)

    expect(callbacks).toHaveLength(1)
    callbacks.forEach((cb) => { cb(0) })
    expect(deviations.at(-1)).toBe(0)

    raf.mockRestore()
  })
})
