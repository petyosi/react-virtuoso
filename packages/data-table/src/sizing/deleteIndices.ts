import { insert, newTree, walk } from './AATree'

import type { AANode } from './AATree'

export function deleteIndices(tree: AANode, indices: number[]) {
  const remainingIndices = [...indices]
  let shiftAmount = 0

  const newValues: { k: number; v: number }[] = []
  for (const { k, v } of walk(tree)) {
    while (remainingIndices.length > 0 && remainingIndices[0]! < k) {
      remainingIndices.shift()
      shiftAmount++
    }

    const newKey = Math.max(0, k - shiftAmount)
    const prevKey = newValues.at(-1)?.k ?? -1

    // zero-length range,
    if (newKey === prevKey) {
      const prevPrevValue = newValues.at(-2)?.v ?? -1
      if (prevPrevValue === v) {
        newValues.pop()
      } else {
        newValues.at(-1)!.v = v
      }
    } else {
      newValues.push({ k: newKey, v })
    }
  }

  let resultTree = newTree()
  for (const { k, v } of newValues) {
    resultTree = insert(resultTree, k, v)
  }
  return resultTree
}
