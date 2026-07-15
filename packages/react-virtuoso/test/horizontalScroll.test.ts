import { describe, expect, it } from 'vitest'

import { getLogicalScrollLeft, getPhysicalScrollLeft } from '../src/utils/horizontalScroll'

describe('horizontal scroll direction', () => {
  it('normalizes negative rtl offsets', () => {
    const scroller = document.createElement('div')

    expect(getLogicalScrollLeft(scroller, -10)).toBe(10)
  })

  it('uses the current computed direction for physical offsets', () => {
    const scroller = document.createElement('div')
    scroller.style.direction = 'ltr'
    document.body.append(scroller)

    expect(getPhysicalScrollLeft(scroller, 10)).toBe(10)

    scroller.style.direction = 'rtl'

    expect(getPhysicalScrollLeft(scroller, 10)).toBe(-10)
    scroller.remove()
  })
})
