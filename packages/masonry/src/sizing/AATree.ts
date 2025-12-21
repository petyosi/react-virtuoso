interface NilNode {
  lvl: 0
}

const NIL_NODE: NilNode = { lvl: 0 }

interface NodeData {
  k: number
  v: number
}

export interface NonNilAANode {
  k: number
  l: NilNode | NonNilAANode
  lvl: number
  r: NilNode | NonNilAANode
  v: number
}

export interface Range {
  end: number
  start: number
  value: number
}

export type AANode = NilNode | NonNilAANode

function newAANode(k: number, v: number, lvl: number, l: AANode = NIL_NODE, r: AANode = NIL_NODE): NonNilAANode {
  return { k, l, lvl, r, v }
}

export function empty(node: AANode): node is NilNode {
  return node === NIL_NODE
}

export function newTree(): AANode {
  return NIL_NODE
}

export function remove(node: AANode, key: number): AANode {
  if (empty(node)) return NIL_NODE

  const { k, l, r } = node

  if (key === k) {
    if (empty(l)) {
      return r
    }
    if (empty(r)) {
      return l
    }
    const [lastKey, lastValue] = last(l)
    return adjust(clone(node, { k: lastKey, l: deleteLast(l), v: lastValue }))
  }
  if (key < k) {
    return adjust(clone(node, { l: remove(l, key) }))
  }
  return adjust(clone(node, { r: remove(r, key) }))
}

export function find(node: AANode, key: number): number | undefined {
  if (empty(node)) {
    return
  }

  if (key === node.k) {
    return node.v
  }
  if (key < node.k) {
    return find(node.l, key)
  }
  return find(node.r, key)
}

export function findMaxKeyValue(node: AANode, value: number, field: 'k' | 'v' = 'k'): [number, number | undefined] {
  if (empty(node)) {
    return [Number.NEGATIVE_INFINITY, undefined]
  }

  if (node[field] === value) {
    return [node.k, node.v]
  }

  if (node[field] < value) {
    const r = findMaxKeyValue(node.r, value, field)
    if (r[0] === Number.NEGATIVE_INFINITY) {
      return [node.k, node.v]
    }
    return r
  }

  return findMaxKeyValue(node.l, value, field)
}

export function insert(node: AANode, k: number, v: number): NonNilAANode {
  if (empty(node)) {
    return newAANode(k, v, 1)
  }
  if (k === node.k) {
    return clone(node, { k, v })
  }
  if (k < node.k) {
    return rebalance(clone(node, { l: insert(node.l, k, v) }))
  }
  return rebalance(clone(node, { r: insert(node.r, k, v) }))
}

function walkWithin(node: AANode, start: number, end: number): NodeData[] {
  if (empty(node)) {
    return []
  }

  const { k, l, r, v } = node
  let result: NodeData[] = []
  if (k > start) {
    result = result.concat(walkWithin(l, start, end))
  }

  if (k >= start && k <= end) {
    result.push({ k, v })
  }

  if (k <= end) {
    result = result.concat(walkWithin(r, start, end))
  }

  return result
}

export function partialUpdate(node: AANode, start: number, end: number, cb: (k: number, v: number) => [number, number]): AANode {
  if (empty(node)) {
    return NIL_NODE
  }
  let result = newTree()
  for (const { k, v } of walk(node)) {
    if (k > start && k <= end) {
      result = insert(result, ...cb(k, v))
    } else {
      result = insert(result, k, v)
    }
  }
  return result
}

export function deleteRange(node: AANode, offset: number, count: number): AANode {
  let result = newTree()
  let lastValue = -1
  for (const { end, start, value } of ranges(node)) {
    if (start < offset) {
      // before the deleted range
      result = insert(result, start, value)
      lastValue = value
    } else if (start > offset + count) {
      // after the deleted range
      result = insert(result, start - count, value)
    } else if (end >= offset + count && lastValue !== value) {
      // inside the deleted range, but the end is after the deleted range
      result = insert(result, offset, value)
    }
  }
  return result
}

export function walk(node: AANode): NodeData[] {
  if (empty(node)) {
    return []
  }

  return [...walk(node.l), { k: node.k, v: node.v }, ...walk(node.r)]
}

function last(node: NonNilAANode): [number, number] {
  return empty(node.r) ? [node.k, node.v] : last(node.r)
}

function deleteLast(node: NonNilAANode): AANode {
  return empty(node.r) ? node.l : adjust(clone(node, { r: deleteLast(node.r) }))
}

function clone(node: NonNilAANode, args: Partial<NonNilAANode>): NonNilAANode {
  return newAANode(args.k ?? node.k, args.v ?? node.v, args.lvl ?? node.lvl, args.l ?? node.l, args.r ?? node.r)
}

function isSingle(node: AANode) {
  return empty(node) || node.lvl > node.r.lvl
}

function rebalance(node: NonNilAANode): NonNilAANode {
  return split(skew(node))
}

function adjust(node: NonNilAANode): NonNilAANode {
  const { l, lvl, r } = node
  if (r.lvl >= lvl - 1 && l.lvl >= lvl - 1) {
    return node
  }
  if (lvl > r.lvl + 1) {
    if (isSingle(l)) {
      return skew(clone(node, { lvl: lvl - 1 }))
    }

    if (!empty(l) && !empty(l.r)) {
      return clone(l.r, {
        l: clone(l, { r: l.r.l }),
        lvl,
        r: clone(node, {
          l: l.r.r,
          lvl: lvl - 1,
        }),
      })
    }

    throw new Error('Unexpected empty nodes')
  }
  if (isSingle(node)) {
    return split(clone(node, { lvl: lvl - 1 }))
  }
  if (!empty(r) && !empty(r.l)) {
    const rl = r.l
    const rlvl = isSingle(rl) ? r.lvl - 1 : r.lvl

    return clone(rl, {
      l: clone(node, {
        lvl: lvl - 1,
        r: rl.l,
      }),
      lvl: rl.lvl + 1,
      r: split(clone(r, { l: rl.r, lvl: rlvl })),
    })
  }
  throw new Error('Unexpected empty nodes')
}

export function keys(node: AANode): number[] {
  if (empty(node)) {
    return []
  }
  return [...keys(node.l), node.k, ...keys(node.r)]
}

function ranges(node: AANode): Range[] {
  return toRanges(walk(node))
}

export function rangesWithin(node: AANode, startIndex: number, endIndex: number): Range[] {
  if (empty(node)) {
    return []
  }
  const adjustedStart = findMaxKeyValue(node, startIndex)[0]
  return toRanges(walkWithin(node, adjustedStart, endIndex))
}

export function arrayToRanges<T, V>(
  items: T[],
  parser: (item: T) => { index: number; value: V }
): { end: number; start: number; value: V }[] {
  const length = items.length
  if (length === 0) {
    return []
  }

  let { index: start, value } = parser(items[0])

  const result = []

  for (let i = 1; i < length; i++) {
    const { index: nextIndex, value: nextValue } = parser(items[i])
    result.push({ end: nextIndex - 1, start, value })

    start = nextIndex
    value = nextValue
  }

  result.push({ end: Number.POSITIVE_INFINITY, start, value })
  return result
}

function toRanges(nodes: NodeData[]): Range[] {
  return arrayToRanges(nodes, ({ k: index, v: value }) => ({ index, value }))
}

function split(node: NonNilAANode): NonNilAANode {
  const { lvl, r } = node

  return !empty(r) && !empty(r.r) && r.lvl === lvl && r.r.lvl === lvl ? clone(r, { l: clone(node, { r: r.l }), lvl: lvl + 1 }) : node
}

function skew(node: NonNilAANode): NonNilAANode {
  const { l } = node

  return !empty(l) && l.lvl === node.lvl ? clone(l, { r: clone(node, { l: l.r }) }) : node
}
