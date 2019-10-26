/* eslint @typescript-eslint/explicit-function-return-type: 0 */

import { AATree } from '../src/AATree'
import { range, shuffle, partition } from 'lodash'

describe('aa tree behavior', () => {
  const RANGE_END = 100

  function numbersToAATree(numbers: number[]): AATree<number> {
    return numbers.reduce((tree: AATree<number>, n) => tree.insert(n, n), AATree.empty<number>())
  }

  function keyMatchesValues(numbers: number[], tree: AATree<number>): void {
    numbers.forEach(n => {
      expect(tree.find(n)).toStrictEqual(n)
    })
  }

  it('initially generates empty generator', () => {
    const tree: AATree<number> = AATree.empty()
    expect(Array.from(tree.keys())).toEqual([])

    expect(tree.find(0)).toBeUndefined()
  })

  it('preserves increasing sequence', () => {
    const numbers = range(0, RANGE_END)
    const tree = numbersToAATree(numbers)

    expect(tree.isInvariant()).toStrictEqual(true)

    expect(Array.from(tree.keys())).toEqual(numbers)

    keyMatchesValues(numbers, tree)
  })

  it('preserves decreasing sequence', () => {
    const numbers = range(0, RANGE_END)
    const tree = numbersToAATree([...numbers].reverse())

    expect(tree.isInvariant()).toStrictEqual(true)

    expect(Array.from(tree.keys())).toEqual(numbers)
    Array.from(tree.keys())

    keyMatchesValues(numbers, tree)
  })

  it('preserves random sequence', () => {
    const numbers = range(0, RANGE_END)
    const tree = numbersToAATree(shuffle(numbers))

    expect(tree.isInvariant()).toStrictEqual(true)
    expect(Array.from(tree.keys())).toEqual(numbers)
    keyMatchesValues(numbers, tree)
  })

  it('remains invariant after removal', () => {
    const numbers = range(0, RANGE_END)
    const tree = numbersToAATree(shuffle(numbers))
    const [evens, odds] = partition(numbers, x => x % 2 === 0)

    const trimmedAATree = odds.reduce((tree, n) => tree.remove(n), tree)

    expect(Array.from(trimmedAATree.keys())).toEqual(evens)
    expect(trimmedAATree.isInvariant()).toStrictEqual(true)

    const emptyAATree = evens.reduce((tree, n) => tree.remove(n), trimmedAATree)

    expect(emptyAATree.isInvariant()).toStrictEqual(true)
    expect(Array.from(emptyAATree.keys())).toEqual([])
  })

  it('yields tuples for a given range', () => {
    const tree = numbersToAATree([0, 4, 10, 15, 20])

    expect(Array.from(tree.rangesWithin(3, 22))).toEqual([
      { start: 0, end: 3, value: 0 },
      { start: 4, end: 9, value: 4 },
      { start: 10, end: 14, value: 10 },
      { start: 15, end: 19, value: 15 },
      { start: 20, end: Infinity, value: 20 },
    ])
  })

  it('finds the largest number that does not exceed a given value', () => {
    const tree = numbersToAATree([0, 1, 2, 3, 4, 7, 20])
    expect(tree.findMax(3)).toEqual(3)
    expect(tree.findMax(12)).toEqual(7)
    expect(tree.findMax(100)).toEqual(20)
  })

  it('yields tuples for a given range (2nd example)', () => {
    const tree = numbersToAATree([0, 1, 2, 3, 4])
    expect(Array.from(tree.rangesWithin(3, 3))).toEqual([{ start: 3, end: Infinity, value: 3 }])
  })
})
