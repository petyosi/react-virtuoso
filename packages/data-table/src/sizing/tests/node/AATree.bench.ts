import { bench, describe } from 'vitest'

import * as AA from '../../AATree'

function buildVariableTree(count: number) {
  let tree = AA.newTree()
  for (let i = 0; i < count; i++) {
    tree = AA.insert(tree, i, 20 + (i % 37))
  }
  return tree
}

describe('walk - full tree traversal', () => {
  const small = buildVariableTree(50)
  const medium = buildVariableTree(500)
  const large = buildVariableTree(5000)

  bench('50 nodes', () => {
    AA.walk(small)
  })

  bench('500 nodes', () => {
    AA.walk(medium)
  })

  bench('5,000 nodes', () => {
    AA.walk(large)
  })
})

describe('walkWithin - bounded traversal', () => {
  const medium = buildVariableTree(500)
  const large = buildVariableTree(5000)

  bench('500-node tree, 50-node window', () => {
    AA.walkWithin(medium, 200, 250)
  })

  bench('5,000-node tree, 50-node window', () => {
    AA.walkWithin(large, 2000, 2050)
  })

  bench('5,000-node tree, 500-node window', () => {
    AA.walkWithin(large, 2000, 2500)
  })
})

describe('keys - full key extraction', () => {
  const medium = buildVariableTree(500)
  const large = buildVariableTree(5000)

  bench('500 nodes', () => {
    AA.keys(medium)
  })

  bench('5,000 nodes', () => {
    AA.keys(large)
  })
})

describe('ranges - full traversal + conversion', () => {
  const medium = buildVariableTree(500)
  const large = buildVariableTree(5000)

  bench('500 nodes', () => {
    AA.ranges(medium)
  })

  bench('5,000 nodes', () => {
    AA.ranges(large)
  })
})

describe('rangesWithin - bounded traversal + conversion', () => {
  const large = buildVariableTree(5000)

  bench('5,000-node tree, 50-node window', () => {
    AA.rangesWithin(large, 2000, 2050)
  })

  bench('5,000-node tree, 500-node window', () => {
    AA.rangesWithin(large, 2000, 2500)
  })
})
