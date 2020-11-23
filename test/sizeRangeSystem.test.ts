import { BOTTOM, getOverscan, TOP } from '../src/sizeRangeSystem'
import { DOWN, UP } from '../src/domIOSystem'

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
