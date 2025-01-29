import { describe, expect, it, vi } from 'vitest'

import { listSystem } from '../src/listSystem'
import * as u from '../src/urx'

describe('window scroller system', () => {
  it('offsets the window scroll top with the element offset top', () => {
    const { scrollTop, windowScrollContainerState, windowViewportRect } = u.init(listSystem)
    const sub = vi.fn()
    u.subscribe(scrollTop, sub)
    u.publish(windowViewportRect, { offsetTop: 100, visibleHeight: 1000 })
    u.publish(windowScrollContainerState, { scrollHeight: 1000, scrollTop: 0, viewportHeight: 400 })
    expect(sub).toHaveBeenCalledWith(0)
    u.publish(windowScrollContainerState, { scrollHeight: 1000, scrollTop: 200, viewportHeight: 400 })
    expect(sub).toHaveBeenCalledWith(100)
  })
  it('offsets the scrollTo calls with offsetTop', () => {
    const { scrollTo, windowScrollTo, windowViewportRect } = u.init(listSystem)
    const sub = vi.fn()
    u.subscribe(windowScrollTo, sub)
    u.publish(windowViewportRect, { offsetTop: 200, visibleHeight: 1000 })
    u.publish(scrollTo, { top: 300 })
    expect(sub).toHaveBeenCalledWith({ top: 500 })
  })
})
