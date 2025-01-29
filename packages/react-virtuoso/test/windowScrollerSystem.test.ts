import * as u from '../src/urx'
import { listSystem } from '../src/listSystem'
import { describe, it, expect, vi } from 'vitest'

describe('window scroller system', () => {
  it('offsets the window scroll top with the element offset top', () => {
    const { windowViewportRect, scrollTop, windowScrollContainerState } = u.init(listSystem)
    const sub = vi.fn()
    u.subscribe(scrollTop, sub)
    u.publish(windowViewportRect, { offsetTop: 100, visibleHeight: 1000 })
    u.publish(windowScrollContainerState, { scrollTop: 0, scrollHeight: 1000, viewportHeight: 400 })
    expect(sub).toHaveBeenCalledWith(0)
    u.publish(windowScrollContainerState, { scrollTop: 200, scrollHeight: 1000, viewportHeight: 400 })
    expect(sub).toHaveBeenCalledWith(100)
  })
  it('offsets the scrollTo calls with offsetTop', () => {
    const { windowViewportRect, scrollTo, windowScrollTo } = u.init(listSystem)
    const sub = vi.fn()
    u.subscribe(windowScrollTo, sub)
    u.publish(windowViewportRect, { offsetTop: 200, visibleHeight: 1000 })
    u.publish(scrollTo, { top: 300 })
    expect(sub).toHaveBeenCalledWith({ top: 500 })
  })
})
