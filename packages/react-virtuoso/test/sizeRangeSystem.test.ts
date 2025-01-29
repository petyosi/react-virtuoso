import { describe, expect, it, vi } from 'vitest'

import { domIOSystem } from '../src/domIOSystem'
import { BOTTOM, getOverscan, sizeRangeSystem, TOP } from '../src/sizeRangeSystem'
import { DOWN, UP } from '../src/stateFlagsSystem'
import { getValue, init, publish, subscribe, system, tup } from '../src/urx'

void getValue
void publish
void subscribe

describe('overscan calculation', () => {
  it('returns the number for the respective direction', () => {
    expect(getOverscan(50, TOP, UP)).toBe(50)
    expect(getOverscan(50, TOP, DOWN)).toBe(0)
    expect(getOverscan(50, BOTTOM, DOWN)).toBe(50)
    expect(getOverscan(50, BOTTOM, UP)).toBe(0)
  })

  it('returns the number for the respective direction', () => {
    const overscan = { main: 50, reverse: 30 }
    expect(getOverscan(overscan, TOP, UP)).toBe(50)
    expect(getOverscan(overscan, TOP, DOWN)).toBe(30)
    expect(getOverscan(overscan, BOTTOM, DOWN)).toBe(50)
    expect(getOverscan(overscan, BOTTOM, UP)).toBe(30)
  })
})

describe('extend viewport by', () => {
  it('increases the calculated range statically', () => {
    const sys = system(([a, b]) => ({ ...a, ...b }), tup(sizeRangeSystem, domIOSystem))
    const { increaseViewportBy, listBoundary, scrollTop, viewportHeight, visibleRange } = init(sys)
    const spy = vi.fn()
    subscribe(visibleRange, spy)
    publish(scrollTop, 0)
    publish(viewportHeight, 200)
    publish(increaseViewportBy, 100)
    publish(listBoundary, [0, 0])

    expect(spy).toHaveBeenCalledWith([0, 300])
  })

  it('allows separate config for each list end', () => {
    const sys = system(([a, b]) => ({ ...a, ...b }), tup(sizeRangeSystem, domIOSystem))
    const { increaseViewportBy, listBoundary, scrollTop, viewportHeight, visibleRange } = init(sys)
    const spy = vi.fn()
    subscribe(visibleRange, spy)
    publish(scrollTop, 200)
    publish(viewportHeight, 200)
    publish(increaseViewportBy, { bottom: 100, top: 50 })
    publish(listBoundary, [0, 0])

    expect(spy).toHaveBeenCalledWith([150, 500])
  })
})
