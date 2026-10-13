import { describe, expect, it, vi } from 'vitest'

import { listSystem } from '../src/listSystem'
import * as u from '../src/urx'

describe('window scroller system', () => {
  it('measures the list before it enters the window viewport', () => {
    const {
      fixedHeaderHeight,
      headerHeight,
      listState,
      propsReady,
      sizeRanges,
      totalCount,
      totalListHeight,
      windowScrollContainerState,
      windowViewportRect,
    } = u.init(listSystem)

    u.publish(totalCount, 100)
    u.publish(propsReady, true)
    u.publish(headerHeight, 60)
    u.publish(fixedHeaderHeight, 20)
    u.publish(windowViewportRect, { listHeight: 0, offsetTop: 1200, visibleHeight: -400 })
    u.publish(windowScrollContainerState, { scrollHeight: 1200, scrollTop: 0, viewportHeight: 800 })

    expect(u.getValue(listState)).toMatchObject({
      items: [{ index: 0, offset: 0, size: 0 }],
    })

    u.publish(sizeRanges, [{ endIndex: 0, size: 40, startIndex: 0 }])

    expect(u.getValue(totalListHeight)).toBe(4080)
    expect(u.getValue(listState).items).toHaveLength(1)
  })

  it('offsets the window scroll top with the element offset top', () => {
    const { scrollTop, windowScrollContainerState, windowViewportRect } = u.init(listSystem)
    const sub = vi.fn()
    u.subscribe(scrollTop, sub)
    u.publish(windowViewportRect, { listHeight: 1000, offsetTop: 100, visibleHeight: 1000 })
    u.publish(windowScrollContainerState, { scrollHeight: 1000, scrollTop: 0, viewportHeight: 400 })
    expect(sub).toHaveBeenCalledWith(0)
    u.publish(windowScrollContainerState, { scrollHeight: 1000, scrollTop: 200, viewportHeight: 400 })
    expect(sub).toHaveBeenCalledWith(100)
  })

  it('offsets the scrollTo calls with offsetTop', () => {
    const { scrollTo, windowScrollTo, windowViewportRect } = u.init(listSystem)
    const sub = vi.fn()
    u.subscribe(windowScrollTo, sub)
    u.publish(windowViewportRect, { listHeight: 1000, offsetTop: 200, visibleHeight: 1000 })
    u.publish(scrollTo, { top: 300 })
    expect(sub).toHaveBeenCalledWith({ top: 500 })
  })

  it('uses the list element height as scrollHeight', () => {
    const { scrollContainerState, windowScrollContainerState, windowViewportRect } = u.init(listSystem)
    const sub = vi.fn()
    u.subscribe(scrollContainerState, sub)
    u.publish(windowViewportRect, { listHeight: 4000, offsetTop: 60, visibleHeight: 800 })
    u.publish(windowScrollContainerState, { scrollHeight: 5000, scrollTop: 200, viewportHeight: 800 })

    expect(sub).toHaveBeenCalledWith(
      expect.objectContaining({
        scrollHeight: 4000, // list element height, not document height
        scrollTop: 140, // 200 - 60
        viewportHeight: 800,
      })
    )
  })

  it('reports atBottom correctly when content exists above Virtuoso', () => {
    const { isAtBottom, windowScrollContainerState, windowViewportRect, atBottomThreshold } = u.init(listSystem)
    const sub = vi.fn()
    u.subscribe(isAtBottom, sub)

    const offsetTop = 60
    const listHeight = 4000
    const viewportHeight = 800

    u.publish(atBottomThreshold, 4)
    u.publish(windowViewportRect, { listHeight, offsetTop, visibleHeight: viewportHeight })

    // Scroll so that the list bottom reaches the viewport bottom:
    // listBottom = offsetTop + listHeight = 4060
    // viewportBottom = scrollTop + viewportHeight
    // At bottom when: scrollTop + viewportHeight >= offsetTop + listHeight
    // scrollTop >= offsetTop + listHeight - viewportHeight = 60 + 4000 - 800 = 3260
    const scrollTopAtBottom = offsetTop + listHeight - viewportHeight
    u.publish(windowScrollContainerState, { scrollHeight: 5000, scrollTop: scrollTopAtBottom, viewportHeight })

    expect(sub).toHaveBeenLastCalledWith(true)
  })

  it('reports atBottom as false when not scrolled to bottom with offset', () => {
    const { isAtBottom, windowScrollContainerState, windowViewportRect, atBottomThreshold } = u.init(listSystem)
    const sub = vi.fn()
    u.subscribe(isAtBottom, sub)

    const offsetTop = 60
    const listHeight = 4000
    const viewportHeight = 800

    u.publish(atBottomThreshold, 4)
    u.publish(windowViewportRect, { listHeight, offsetTop, visibleHeight: viewportHeight })

    // Scroll to somewhere in the middle
    u.publish(windowScrollContainerState, { scrollHeight: 5000, scrollTop: 2000, viewportHeight })

    expect(sub).toHaveBeenLastCalledWith(false)
  })

  it('reports atBottom correctly with zero offsetTop', () => {
    const { isAtBottom, windowScrollContainerState, windowViewportRect, atBottomThreshold } = u.init(listSystem)
    const sub = vi.fn()
    u.subscribe(isAtBottom, sub)

    const listHeight = 5000
    const viewportHeight = 800

    u.publish(atBottomThreshold, 4)
    u.publish(windowViewportRect, { listHeight, offsetTop: 0, visibleHeight: viewportHeight })

    // Scroll to the very bottom
    const scrollTopAtBottom = listHeight - viewportHeight
    u.publish(windowScrollContainerState, { scrollHeight: 5000, scrollTop: scrollTopAtBottom, viewportHeight })

    expect(sub).toHaveBeenLastCalledWith(true)
  })

  it('reports atBottom correctly with large offsetTop', () => {
    const { isAtBottom, windowScrollContainerState, windowViewportRect, atBottomThreshold } = u.init(listSystem)
    const sub = vi.fn()
    u.subscribe(isAtBottom, sub)

    const offsetTop = 200
    const listHeight = 4000
    const viewportHeight = 800

    u.publish(atBottomThreshold, 4)
    u.publish(windowViewportRect, { listHeight, offsetTop, visibleHeight: viewportHeight })

    // Scroll so list bottom reaches viewport bottom
    const scrollTopAtBottom = offsetTop + listHeight - viewportHeight
    u.publish(windowScrollContainerState, { scrollHeight: 5000, scrollTop: scrollTopAtBottom, viewportHeight })

    expect(sub).toHaveBeenLastCalledWith(true)
  })

  it('reports atBottom based on list bottom, not page bottom', () => {
    const { isAtBottom, windowScrollContainerState, windowViewportRect, atBottomThreshold } = u.init(listSystem)
    const sub = vi.fn()
    u.subscribe(isAtBottom, sub)

    const offsetTop = 200
    const listHeight = 3000
    const viewportHeight = 800
    // Page has 1000px of content below the list
    const pageScrollHeight = offsetTop + listHeight + 1000

    u.publish(atBottomThreshold, 4)
    u.publish(windowViewportRect, { listHeight, offsetTop, visibleHeight: viewportHeight })

    // Scroll so list bottom reaches viewport bottom, but NOT page bottom
    const scrollTopAtListBottom = offsetTop + listHeight - viewportHeight
    u.publish(windowScrollContainerState, { scrollHeight: pageScrollHeight, scrollTop: scrollTopAtListBottom, viewportHeight })

    // Should be at bottom (list bottom is at viewport bottom)
    expect(sub).toHaveBeenLastCalledWith(true)
  })
})
