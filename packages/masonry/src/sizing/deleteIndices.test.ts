import { describe, expect, it } from 'vitest'

import { insert, newTree, walk } from './AATree'
import { deleteIndices } from './deleteIndices'

describe('deleting indices from an AA tree', () => {
  it('decreases the indices of the existing tree', () => {
    let tree = newTree()
    tree = insert(tree, 0, 20)
    tree = insert(tree, 10, 30)
    tree = insert(tree, 20, 20)
    tree = insert(tree, 30, 30)

    const updatedTree = deleteIndices(tree, [1, 3, 5, 15, 25])

    expect(walk(updatedTree)).toMatchObject([
      { k: 0, v: 20 },
      { k: 7, v: 30 },
      { k: 16, v: 20 },
      { k: 25, v: 30 },
    ])
  })
  it('merges same sized indices', () => {
    let tree = newTree()
    tree = insert(tree, 0, 20)
    tree = insert(tree, 1, 30)
    tree = insert(tree, 2, 20)
    tree = insert(tree, 3, 30)
    tree = insert(tree, 4, 20)
    tree = insert(tree, 5, 30)
    tree = insert(tree, 6, 20)

    const updatedTree = deleteIndices(tree, [1, 3])

    expect(walk(updatedTree)).toMatchObject([
      { k: 0, v: 20 },
      { k: 3, v: 30 },
      { k: 4, v: 20 },
    ])
  })
})
