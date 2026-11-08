import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import useScrollTop from '../src/hooks/useScrollTop'
import { getCSSZoom, scaleForZoom, unzoomedSize } from '../src/utils/correctItemSize'

// The values browsers report for `currentCSSZoom`, which are float32 values widened to a double.
const INEXACT_ZOOMS = [0.6000000238418579, 0.800000011920929, 0.8999999761581421, 1.100000023841858, 1.2000000476837158, 1.2999999523162842]

describe('scaleForZoom', () => {
  it('returns the value untouched for a factor of 1', () => {
    expect(scaleForZoom(33.333333333, 1)).toBe(33.333333333)
  })

  it.each(INEXACT_ZOOMS)('recovers a whole size measured at zoom %d', (zoom) => {
    for (const size of [30, 40, 100, 120, 200, 496]) {
      expect(scaleForZoom(size * zoom, 1 / zoom)).toBe(size)
    }
  })

  it.each(INEXACT_ZOOMS)('keeps sums of scaled sizes exact at zoom %d', (zoom) => {
    const height = scaleForZoom(30 * zoom, 1 / zoom)
    for (let rows = 1; rows <= 20; rows++) {
      expect(rows * height - ((rows - 1) * height + height)).toBe(0)
    }
  })
})

describe('unzoomedSize', () => {
  it('divides by the zoom of the parent, keeping the zoom set on the element itself', () => {
    const parent = document.createElement('div')
    const child = document.createElement('div')
    parent.append(child)
    Object.defineProperty(parent, 'currentCSSZoom', { value: 0.800000011920929 })
    child.getBoundingClientRect = () => ({ height: 80, width: 160 }) as DOMRect

    expect(unzoomedSize(child, 'height')).toBe(100)
    expect(unzoomedSize(child, 'width')).toBe(200)
  })

  it('falls back to a zoom of 1 when the browser does not report one', () => {
    expect(getCSSZoom(document.createElement('div'))).toBe(1)
    expect(getCSSZoom(null)).toBe(1)
  })
})

describe('useScrollTop smooth scrolling', () => {
  function setup() {
    const scroller = document.createElement('div')
    Object.defineProperty(scroller, 'scrollHeight', { value: 20000 })
    Object.defineProperty(scroller, 'offsetHeight', { value: 200 })
    scroller.getBoundingClientRect = () => ({ height: 200, width: 200 }) as DOMRect
    scroller.scrollTo = vi.fn()

    const targetReached = vi.fn()
    const { result } = renderHook(() => useScrollTop(vi.fn(), targetReached, undefined, undefined, scroller))
    result.current.scrollerRef.current = scroller
    result.current.scrollToCallback({ behavior: 'smooth', top: 1001 })

    const scrollTo = (value: number) => {
      scroller.scrollTop = value
      scroller.dispatchEvent(new Event('scroll'))
    }
    return { scrollTo, targetReached }
  }

  it('completes when zoom makes scrollTop read back a fraction away from the target', () => {
    const { scrollTo, targetReached } = setup()

    scrollTo(900)
    expect(targetReached).not.toHaveBeenCalled()

    scrollTo(1001.33)
    expect(targetReached).toHaveBeenCalledWith(true)
  })

  it('does not complete while the scroller is a pixel or more away', () => {
    const { scrollTo, targetReached } = setup()

    scrollTo(1000)
    expect(targetReached).not.toHaveBeenCalled()
  })
})
