interface NilNode {
  lvl: 0
}

const NIL_NODE: NilNode = { lvl: 0 }

interface NodeData<T> {
  k: number
  v: T
}

interface NonNilAANode<T> {
  k: number
  v: T
  lvl: number
  l: NonNilAANode<T> | NilNode
  r: NonNilAANode<T> | NilNode
}

export interface Range<T> {
  start: number
  end: number
  value: T
}

export type AANode<T> = NilNode | NonNilAANode<T>

function newAANode<T>(k: number, v: T, lvl: number, l: AANode<T> = NIL_NODE, r: AANode<T> = NIL_NODE): NonNilAANode<T> {
  return { k, v, lvl, l, r }
}

export function empty(node: AANode<any>): node is NilNode {
  return node === NIL_NODE
}

export function newTree<T>(): AANode<T> {
  return NIL_NODE
}

export function remove<T>(node: AANode<T>, key: number): AANode<T> {
  if (empty(node)) return NIL_NODE

  const { k, l, r } = node

  if (key === k) {
    if (empty(l)) {
      return r
    } else if (empty(r)) {
      return l
    } else {
      const [lastKey, lastValue] = last(l)
      return adjust(clone(node, { k: lastKey, v: lastValue, l: deleteLast(l) }))
    }
  } else if (key < k) {
    return adjust(clone(node, { l: remove(l, key) }))
  } else {
    return adjust(clone(node, { r: remove(r, key) }))
  }
}

export function find<T>(node: AANode<T>, key: number): T | undefined {
  if (empty(node)) {
    return
  }

  if (key === node.k) {
    return node.v
  } else if (key < node.k) {
    return find(node.l, key)
  } else {
    return find(node.r, key)
  }
}

export function findMaxKeyValue<T>(node: AANode<T>, value: number, field: 'k' | 'v' = 'k'): [number, T | undefined] {
  if (empty(node)) {
    return [-Infinity, undefined]
  }

  if (node[field] === value) {
    return [node.k, node.v]
  }

  if (node[field] < value) {
    const r = findMaxKeyValue(node.r, value, field)
    if (r[0] === -Infinity) {
      return [node.k, node.v]
    } else {
      return r
    }
  }

  return findMaxKeyValue(node.l, value, field)
}

export function insert<T>(node: AANode<T>, k: number, v: T): NonNilAANode<T> {
  if (empty(node)) {
    return newAANode(k, v, 1)
  }
  if (k === node.k) {
    return clone(node, { k, v })
  } else if (k < node.k) {
    return rebalance(clone(node, { l: insert(node.l, k, v) }))
  } else {
    return rebalance(clone(node, { r: insert(node.r, k, v) }))
  }
}

export function walkWithin<T>(node: AANode<T>, start: number, end: number): NodeData<T>[] {
  if (empty(node)) {
    return []
  }

  const { k, v, l, r } = node
  let result: NodeData<T>[] = []
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

export function walk<T>(node: AANode<T>): NodeData<T>[] {
  if (empty(node)) {
    return []
  }

  return [...walk(node.l), { k: node.k, v: node.v }, ...walk(node.r)]
}

function last<T>(node: NonNilAANode<T>): [number, T] {
  return empty(node.r) ? [node.k, node.v] : last(node.r)
}

function deleteLast<T>(node: NonNilAANode<T>): AANode<T> {
  return empty(node.r) ? node.l : adjust(clone(node, { r: deleteLast(node.r) }))
}

function clone<T>(node: NonNilAANode<T>, args: Partial<NonNilAANode<T>>): NonNilAANode<T> {
  return newAANode(
    args.k !== undefined ? args.k : node.k,
    args.v !== undefined ? args.v : node.v,
    args.lvl !== undefined ? args.lvl : node.lvl,
    args.l !== undefined ? args.l : node.l,
    args.r !== undefined ? args.r : node.r
  )
}

function isSingle(node: AANode<any>) {
  return empty(node) || node.lvl > node.r.lvl
}

function rebalance<T>(node: NonNilAANode<T>): NonNilAANode<T> {
  return split(skew(node))
}

function adjust<T>(node: NonNilAANode<T>): NonNilAANode<T> {
  const { l, r, lvl } = node
  if (r.lvl >= lvl - 1 && l.lvl >= lvl - 1) {
    return node
  } else if (lvl > r.lvl + 1) {
    if (isSingle(l)) {
      return skew(clone(node, { lvl: lvl - 1 }))
    } else {
      if (!empty(l) && !empty(l.r)) {
        return clone(l.r, {
          l: clone(l, { r: l.r.l }),
          r: clone(node, {
            l: l.r.r,
            lvl: lvl - 1,
          }),
          lvl: lvl,
        })
      } else {
        throw new Error('Unexpected empty nodes')
      }
    }
  } else {
    if (isSingle(node)) {
      return split(clone(node, { lvl: lvl - 1 }))
    } else {
      if (!empty(r) && !empty(r.l)) {
        const rl = r.l
        const rlvl = isSingle(rl) ? r.lvl - 1 : r.lvl

        return clone(rl, {
          l: clone(node, {
            r: rl.l,
            lvl: lvl - 1,
          }),
          r: split(clone(r, { l: rl.r, lvl: rlvl })),
          lvl: rl.lvl + 1,
        })
      } else {
        throw new Error('Unexpected empty nodes')
      }
    }
  }
}

export function keys(node: AANode<any>): number[] {
  if (empty(node)) {
    return []
  }
  return [...keys(node.l), node.k, ...keys(node.r)]
}

export function ranges<T>(node: AANode<T>): Range<T>[] {
  return toRanges(walk(node))
}

export function rangesWithin<T>(node: AANode<T>, startIndex: number, endIndex: number): Range<T>[] {
  if (empty(node)) {
    return []
  }
  const adjustedStart = findMaxKeyValue(node, startIndex)[0]
  return toRanges(walkWithin(node, adjustedStart, endIndex))
}

export function arrayToRanges<T, V>(
  items: T[],
  parser: (item: T) => { index: number; value: V }
): Array<{ start: number; end: number; value: V }> {
  const length = items.length
  if (length === 0) {
    return []
  }

  let { index: start, value } = parser(items[0])

  const result = []

  for (let i = 1; i < length; i++) {
    const { index: nextIndex, value: nextValue } = parser(items[i])
    result.push({ start, end: nextIndex - 1, value })

    start = nextIndex
    value = nextValue
  }

  result.push({ start, end: Infinity, value })
  return result
}

function toRanges<T>(nodes: NodeData<T>[]): Range<T>[] {
  return arrayToRanges(nodes, ({ k: index, v: value }) => ({ index, value }))
}

function split<T>(node: NonNilAANode<T>): NonNilAANode<T> {
  const { r, lvl } = node

  return !empty(r) && !empty(r.r) && r.lvl === lvl && r.r.lvl === lvl ? clone(r, { l: clone(node, { r: r.l }), lvl: lvl + 1 }) : node
}

function skew<T>(node: NonNilAANode<T>): NonNilAANode<T> {
  const { l } = node

  return !empty(l) && l.lvl === node.lvl ? clone(l, { r: clone(node, { l: l.r }) }) : node
}
