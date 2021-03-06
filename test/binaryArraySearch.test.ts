import { findClosestSmallerOrEqual, findRange } from '../src/utils/binaryArraySearch'

function exampleComparator(item: number, value: number) {
  return value === item ? 0 : value < item ? -1 : 1
}

describe('find closest smaller number in array', () => {
  it('returns the only value if 1 sized', () => {
    expect(findClosestSmallerOrEqual([0], 20, exampleComparator)).toBe(0)
  })

  it('finds the closest smaller value (3 items)', () => {
    expect(findClosestSmallerOrEqual([0, 3, 6], 5, exampleComparator)).toBe(3)
  })

  it('finds the closest smaller value (4 items)', () => {
    expect(findClosestSmallerOrEqual([0, 3, 6, 9], 5, exampleComparator)).toBe(3)
  })

  it('finds the closest smaller value (5 items)', () => {
    expect(findClosestSmallerOrEqual([0, 3, 6, 9, 12], 5, exampleComparator)).toBe(3)
  })

  it('returns the last item if value is outside of the range', () => {
    expect(findClosestSmallerOrEqual([0, 3, 6, 9, 12], 15, exampleComparator)).toBe(12)
  })

  it('brute force test', () => {
    for (let count = 1; count < 20; count++) {
      for (let step = 1; step < 8; step++) {
        const tests = Array.from({ length: count }, (_, i) => [i, Math.floor(i / step) * step])
        const data = Array.from({ length: count }, (_, index) => index * step)
        tests.forEach(([value, result]) => {
          expect(findClosestSmallerOrEqual(data, value, exampleComparator)).toBe(result)
        })
      }
    }
  })
})

describe('find range', () => {
  it('returns the items within the specified ranges', () => {
    expect(findRange([0, 3, 6, 9, 12], 5, 11, exampleComparator)).toEqual([3, 6, 9])
  })
})
