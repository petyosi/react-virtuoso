/* eslint @typescript-eslint/explicit-function-return-type: 0 */
import { describe, expect, it } from 'vitest'

import * as AA from '../src/AATree'
import { AANode } from '../src/AATree'

function partition(array: number[], predicate: (input: number) => boolean) {
  const result: [number[], number[]] = [[], []]
  return array.reduce((result, value) => {
    result[predicate(value) ? 0 : 1].push(value)
    return result
  }, result)
}

function range(start: number, end: number) {
  const result = [] as number[]
  for (let index = start; index <= end; index++) {
    result.push(index)
  }
  return result
}

function shuffle(array: number[]) {
  let index = -1
  const lastIndex = array.length - 1
  const result = array.slice()
  while (++index < array.length) {
    const rand = index + Math.floor(Math.random() * (lastIndex - index + 1))
    const value = result[rand]
    result[rand] = result[index]
    result[index] = value
  }
  return result
}

const RANGE_END = 100

function isInvariant(node: AANode<any>): boolean {
  if (AA.empty(node)) {
    return true
  }

  const { l: left, lvl: level, r: right } = node

  if (level !== left.lvl + 1) {
    return false
  } else if (level !== right.lvl && level !== right.lvl + 1) {
    return false
  } else if (!AA.empty(right) && level <= right.r.lvl) {
    return false
  } else {
    return isInvariant(left) && isInvariant(right)
  }
}

function keyMatchesValues(numbers: number[], tree: AANode<number>): void {
  numbers.forEach((n) => {
    expect(AA.find(tree, n)).toStrictEqual(n)
  })
}

function numbersToAATree(numbers: number[]): AANode<number> {
  return numbers.reduce((tree: AANode<number>, n) => {
    return AA.insert(tree, n, n)
  }, AA.newTree<number>())
}

describe('AATree', () => {
  it('starts with an empty tree', () => {
    const tree: AANode<number> = AA.newTree()
    expect(AA.keys(tree)).toEqual([])
    expect(AA.find(tree, 0)).toBeUndefined()
  })

  it('preserves increasing sequence', () => {
    const numbers = range(0, RANGE_END)
    const tree = numbersToAATree(numbers)
    expect(isInvariant(tree)).toStrictEqual(true)
    expect(AA.keys(tree)).toEqual(numbers)
    keyMatchesValues(numbers, tree)
  })

  it('preserves decreasing sequence', () => {
    const numbers = range(0, RANGE_END)
    const tree = numbersToAATree([...numbers].reverse())

    expect(isInvariant(tree)).toStrictEqual(true)
    expect(AA.keys(tree)).toEqual(numbers)

    keyMatchesValues(numbers, tree)
  })

  it('preserves random sequence', () => {
    const numbers = range(0, RANGE_END)
    const tree = numbersToAATree(shuffle(numbers))
    expect(isInvariant(tree)).toStrictEqual(true)
    expect(AA.keys(tree)).toEqual(numbers)
    keyMatchesValues(numbers, tree)
  })

  it('remains invariant after removal', () => {
    const numbers = range(0, RANGE_END)
    const tree = numbersToAATree(shuffle(numbers))
    const [evens, odds] = partition(numbers, (x) => x % 2 === 0)

    const trimmedAATree = odds.reduce((tree, n) => {
      return AA.remove(tree, n)
    }, tree)
    expect(AA.keys(trimmedAATree)).toEqual(evens)
    expect(isInvariant(trimmedAATree)).toStrictEqual(true)

    const emptyAATree = evens.reduce((tree, n) => {
      return AA.remove(tree, n)
    }, trimmedAATree)

    expect(isInvariant(emptyAATree)).toStrictEqual(true)
    expect(AA.keys(emptyAATree)).toEqual([])
  })

  it('produces ranges for a given range', () => {
    const tree = numbersToAATree([0, 4, 10, 15, 20])

    expect(AA.rangesWithin(tree, 3, 22)).toEqual([
      { end: 3, start: 0, value: 0 },
      { end: 9, start: 4, value: 4 },
      { end: 14, start: 10, value: 10 },
      { end: 19, start: 15, value: 15 },
      { end: Infinity, start: 20, value: 20 },
    ])
  })

  it('produces ranges for a collapsed range', () => {
    const tree = numbersToAATree([0, 1, 2, 3, 4])
    expect(AA.rangesWithin(tree, 3, 3)).toEqual([{ end: Infinity, start: 3, value: 3 }])
  })

  it('finds the largest number that does not exceed a given value', () => {
    const tree = numbersToAATree([0, 1, 2, 3, 4, 7, 20])
    expect(AA.findMaxKeyValue(tree, 3)[0]).toEqual(3)
    expect(AA.findMaxKeyValue(tree, 12)[0]).toEqual(7)
    expect(AA.findMaxKeyValue(tree, 100)[0]).toEqual(20)
  })
})
