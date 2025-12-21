import { describe, expect, it } from 'vitest'

import type { AANode } from '../../sizing/AATree'

import * as AA from '../../sizing/AATree'

function range(start: number, end: number) {
  const result = []
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

function partition(array: number[], predicate: (input: number) => boolean) {
  const result: [number[], number[]] = [[], []]
  return array.reduce((result, value) => {
    result[predicate(value) ? 0 : 1].push(value)
    return result
  }, result)
}

const RANGE_END = 100

function numbersToAATree(numbers: number[]): AANode {
  return numbers.reduce((tree: AANode, n) => {
    return AA.insert(tree, n, n)
  }, AA.newTree())
}

function keyMatchesValues(numbers: number[], tree: AANode): void {
  for (const n of numbers) {
    expect(AA.find(tree, n)).toStrictEqual(n)
  }
}

function isInvariant(node: AANode): boolean {
  if (AA.empty(node)) {
    return true
  }

  const { l: left, lvl: level, r: right } = node

  if (level !== left.lvl + 1) {
    return false
  }
  if (level !== right.lvl && level !== right.lvl + 1) {
    return false
  }
  if (!AA.empty(right) && level <= right.r.lvl) {
    return false
  }
  return isInvariant(left) && isInvariant(right)
}

describe('AATree', () => {
  it('starts with an empty tree', () => {
    const tree: AANode = AA.newTree()
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
      { end: Number.POSITIVE_INFINITY, start: 20, value: 20 },
    ])
  })

  it('produces ranges for a collapsed range', () => {
    const tree = numbersToAATree([0, 1, 2, 3, 4])
    expect(AA.rangesWithin(tree, 3, 3)).toEqual([{ end: Number.POSITIVE_INFINITY, start: 3, value: 3 }])
  })

  it('finds the largest number that does not exceed a given value', () => {
    const tree = numbersToAATree([0, 1, 2, 3, 4, 7, 20])
    expect(AA.findMaxKeyValue(tree, 3)[0]).toEqual(3)
    expect(AA.findMaxKeyValue(tree, 12)[0]).toEqual(7)
    expect(AA.findMaxKeyValue(tree, 100)[0]).toEqual(20)
  })

  it('can modify items in the tree', () => {
    const tree = numbersToAATree([0, 4, 10, 15, 20])

    const updatedTree = AA.partialUpdate(tree, 4, Number.POSITIVE_INFINITY, (key, value) => {
      return [key + 10, value]
    })

    expect(AA.walk(updatedTree)).toEqual([
      { k: 0, v: 0 },
      { k: 4, v: 4 },
      { k: 20, v: 10 },
      { k: 25, v: 15 },
      { k: 30, v: 20 },
    ])
  })

  it('can delete ranges of items', () => {
    const tree = numbersToAATree([0, 4, 10, 15, 20])
    const updatedTree = AA.deleteRange(tree, 6, 8)

    expect(AA.walk(updatedTree)).toEqual([
      { k: 0, v: 0 },
      { k: 4, v: 4 },
      { k: 6, v: 10 },
      { k: 7, v: 15 },
      { k: 12, v: 20 },
    ])
  })

  it('can delete ranges of items (2)', () => {
    let tree = AA.newTree()
    tree = AA.insert(tree, 0, 10)
    tree = AA.insert(tree, 4, 20)
    tree = AA.insert(tree, 10, 10)
    tree = AA.insert(tree, 15, 20)

    const updatedTree = AA.deleteRange(tree, 2, 5)

    expect(AA.walk(updatedTree)).toEqual([
      { k: 0, v: 10 },
      { k: 2, v: 20 },
      { k: 10 - 5, v: 10 },
      { k: 15 - 5, v: 20 },
    ])
  })

  it('merges ranges after deletion of a range', () => {
    let tree = AA.newTree()
    tree = AA.insert(tree, 0, 10)
    tree = AA.insert(tree, 4, 20)
    tree = AA.insert(tree, 10, 10)
    tree = AA.insert(tree, 15, 20)

    const updatedTree = AA.deleteRange(tree, 4, 6)

    expect(AA.walk(updatedTree)).toEqual([
      { k: 0, v: 10 },
      { k: 9, v: 20 },
    ])
  })
})
