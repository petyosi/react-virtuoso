import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { describe, expect, it } from 'vitest'

import { ranges$, sizeState$ } from '../../../resize/sizes'
import { cardGeometry, cardWindow, EMPTY_CARD_MEASUREMENT } from '../../geometry'
import { cardMeasurement$ } from '../../state'

const measurement = { width: 160, height: 120, containerWidth: 500, columnGap: 10, rowGap: 12 }

describe('card geometry', () => {
  it('does not read or write the row measurement store', () => {
    const engine = new Engine()
    const rowState = engine.getValue(sizeState$)
    engine.pub(cardMeasurement$, measurement)
    expect(engine.getValue(sizeState$)).toBe(rowState)
    engine.pub(ranges$, [{ startIndex: 0, endIndex: 10, size: 37 }])
    expect(engine.getValue(cardMeasurement$)).toBe(measurement)
    engine.dispose()
  })
  it('measures columns and an incomplete last line without a trailing gap', () => {
    expect(cardGeometry(measurement, 10)).toMatchObject({ ready: true, columns: 3, totalHeight: 516 })
    expect(cardGeometry({ ...measurement, containerWidth: 330 }, 10).columns).toBe(2)
  })

  it('renders complete lines with independent vertical padding', () => {
    expect(cardWindow(measurement, 100, 264, 250, 0)).toEqual({ start: 6, end: 12, paddingTop: 264, paddingBottom: 3960 })
    expect(cardWindow(measurement, 100, 264, 250, 132)).toMatchObject({ start: 3, end: 15 })
  })

  it('does not round fractional widths up to an extra column', () => {
    expect(cardGeometry({ ...measurement, containerWidth: 499.75 }, 10)).toMatchObject({ columns: 2, totalHeight: 648 })
    expect(cardGeometry({ ...measurement, width: 200.09375, containerWidth: 600, columnGap: 0 }, 10).columns).toBe(2)
    expect(cardGeometry({ ...measurement, width: 160.34375, containerWidth: 501.015625, gridColumns: 3 }, 10).columns).toBe(3)
  })

  it('probes one card until measurable and handles empty and hidden lists', () => {
    expect(cardWindow(EMPTY_CARD_MEASUREMENT, 100, 1000, 300, 0)).toEqual({ start: 0, end: 1, paddingTop: 0, paddingBottom: 0 })
    expect(cardWindow(measurement, 0, 0, 300, 0)).toEqual({ start: 0, end: 0, paddingTop: 0, paddingBottom: 0 })
    expect(cardWindow(measurement, 10, 0, 0, 0).end).toBe(1)
  })
})
