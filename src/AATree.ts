interface NodeData<T> {
  key: number
  value: T
}

interface Range<T> {
  start: number
  end: number
  value: T
}

type FindCallback<T> = (value: T) => 1 | 0 | -1

export type NodeIterator<T> = IterableIterator<NodeData<T>>
export type RangeIterator<T> = IterableIterator<Range<T>>

class NilNode {
  public level = 0

  public rebalance(): this {
    return this
  }

  public adjust(): this {
    return this
  }

  public remove(): this {
    return this
  }

  public find(): void {
    return
  }

  public findWith(): void {
    return
  }

  public findMax(): number {
    return -Infinity
  }

  public insert<T>(key: number, value: T): NonNilNode<T> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new NonNilNode<T>({ key, value, level: 1 })
  }

  public walkWithin<T>(): NodeData<T>[] {
    return []
  }

  public walk<T>(): NodeData<T>[] {
    return []
  }

  public ranges<T>(): Range<T>[] {
    return []
  }

  public rangesWithin<T>(): Range<T>[] {
    return []
  }

  public empty(): this is NilNode {
    return true
  }

  public isSingle(): true {
    return true
  }

  public isInvariant(): true {
    return true
  }

  public keys(): number[] {
    return []
  }
}

const NIL_NODE = new NilNode()

Object.freeze(NIL_NODE)

type Node<T> = NonNilNode<T> | NilNode

interface NodeConstructorArgs<T> {
  key: number
  value: T
  level: number
  left?: Node<T>
  right?: Node<T>
}

class UnreachableCaseError extends Error {
  constructor(val: never) {
    super(`Unreachable case: ${val}`)
  }
}

class NonNilNode<T> {
  public key: number
  public value: T
  public level: number
  public left: Node<T>
  public right: Node<T>

  public constructor({ key, value, level, left = NIL_NODE, right = NIL_NODE }: NodeConstructorArgs<T>) {
    this.key = key
    this.value = value
    this.level = level
    this.left = left
    this.right = right
  }

  public remove(key: number): Node<T> {
    const { left, right } = this

    if (key === this.key) {
      if (left.empty()) {
        return right
      } else if (right.empty()) {
        return left
      } else {
        const [lastKey, lastValue] = left.last()
        return this.clone({
          key: lastKey,
          value: lastValue,
          left: left.deleteLast(),
        }).adjust()
      }
    } else if (key < this.key) {
      return this.clone({
        left: left.remove(key),
      }).adjust()
    } else {
      return this.clone({
        right: right.remove(key),
      }).adjust()
    }
  }

  public empty(): this is NilNode {
    return false
  }

  public find(key: number): T | void {
    if (key === this.key) {
      return this.value
    } else if (key < this.key) {
      return this.left.find(key)
    } else {
      return this.right.find(key)
    }
  }

  public findWith(callback: FindCallback<T>): [number, T] | void {
    const result = callback(this.value)

    switch (result) {
      case -1:
        return this.left.findWith(callback)
      case 0:
        return [this.key, this.value]
      case 1:
        return this.right.findWith(callback)
      default:
        throw new UnreachableCaseError(result)
    }
  }

  public findMax(key: number): number {
    if (this.key === key) {
      return key
    }

    if (this.key < key) {
      const rightKey = this.right.findMax(key)
      if (rightKey === -Infinity) {
        return this.key
      } else {
        return rightKey
      }
    }

    return this.left.findMax(key)
  }

  public insert(key: number, value: T): NonNilNode<T> {
    if (key === this.key) {
      return this.clone({ key, value })
    } else if (key < this.key) {
      return this.clone({
        left: this.left.insert(key, value),
      }).rebalance()
    } else {
      return this.clone({
        right: this.right.insert(key, value),
      }).rebalance()
    }
  }

  public walkWithin(start: number, end: number): NodeData<T>[] {
    const { key, value } = this
    let result: NodeData<T>[] = []
    if (key > start) {
      result = result.concat(this.left.walkWithin(start, end))
    }

    if (key >= start && key <= end) {
      result.push({ key, value })
    }

    if (key <= end) {
      result = result.concat(this.right.walkWithin(start, end))
    }

    return result
  }

  public walk(): NodeData<T>[] {
    return [...this.left.walk<T>(), { key: this.key, value: this.value }, ...this.right.walk<T>()]
  }

  public last(): [number, T] {
    if (this.right.empty()) {
      return [this.key, this.value]
    } else {
      return this.right.last()
    }
  }

  public deleteLast(): Node<T> {
    if (this.right.empty()) {
      return this.left
    } else {
      return this.clone({
        right: this.right.deleteLast(),
      }).adjust()
    }
  }

  public clone(args: Partial<NodeConstructorArgs<T>>): NonNilNode<T> {
    return new NonNilNode<T>({
      key: args.key !== undefined ? args.key : this.key,
      value: args.value !== undefined ? args.value : this.value,
      level: args.level !== undefined ? args.level : this.level,
      left: args.left !== undefined ? args.left : this.left,
      right: args.right !== undefined ? args.right : this.right,
    })
  }

  public isSingle(): boolean {
    return this.level > this.right.level
  }

  public rebalance(): NonNilNode<T> {
    return this.skew().split()
  }

  public adjust(): NonNilNode<T> {
    const { left, right, level } = this
    if (right.level >= level - 1 && left.level >= level - 1) {
      return this
    } else if (level > right.level + 1) {
      if (left.isSingle()) {
        return this.clone({ level: level - 1 }).skew()
      } else {
        if (!left.empty() && !left.right.empty()) {
          return left.right.clone({
            left: left.clone({ right: left.right.left }),
            right: this.clone({
              left: left.right.right,
              level: level - 1,
            }),
            level: level,
          })
        } else {
          throw new Error('Unexpected empty nodes')
        }
      }
    } else {
      if (this.isSingle()) {
        return this.clone({ level: level - 1 }).split()
      } else {
        if (!right.empty() && !right.left.empty()) {
          const rl = right.left
          const rightLevel = rl.isSingle() ? right.level - 1 : right.level

          return rl.clone({
            left: this.clone({
              right: rl.left,
              level: level - 1,
            }),
            right: right.clone({ left: rl.right, level: rightLevel }).split(),
            level: rl.level + 1,
          })
        } else {
          throw new Error('Unexpected empty nodes')
        }
      }
    }
  }

  public isInvariant(): boolean {
    const { left, right, level } = this

    if (level !== left.level + 1) {
      return false
    } else if (level !== right.level && level !== right.level + 1) {
      return false
    } else if (!right.empty() && level <= right.right.level) {
      return false
    } else {
      return left.isInvariant() && right.isInvariant()
    }
  }

  public keys(): number[] {
    return [...this.left.keys(), this.key, ...this.right.keys()]
  }

  public ranges(): Range<T>[] {
    return this.toRanges(this.walk())
  }

  public rangesWithin(startIndex: number, endIndex: number): Range<T>[] {
    return this.toRanges(this.walkWithin(startIndex, endIndex))
  }

  private toRanges(nodes: NodeData<T>[]): Range<T>[] {
    if (nodes.length === 0) {
      return []
    }

    const first = nodes[0]

    let { key: start, value } = first

    const result = []

    for (let i = 1; i <= nodes.length; i++) {
      let nextNode = nodes[i]
      let end = nextNode ? nextNode.key - 1 : Infinity
      result.push({ start, end, value })

      if (nextNode) {
        start = nextNode.key
        value = nextNode.value
      }
    }
    return result
  }

  private split(): NonNilNode<T> {
    const { right, level } = this
    if (!right.empty() && !right.right.empty() && right.level == level && right.right.level == level) {
      return right.clone({
        left: this.clone({ right: right.left }),
        level: level + 1,
      })
    } else {
      return this
    }
  }

  private skew(): NonNilNode<T> {
    const { left } = this

    if (!left.empty() && left.level === this.level) {
      return left.clone({
        right: this.clone({ left: left.right }),
      })
    } else {
      return this
    }
  }
}

export class AATree<T> {
  private root: Node<T>

  public static empty<T>(): AATree<T> {
    return new AATree<T>(NIL_NODE)
  }

  private constructor(root: Node<T>) {
    this.root = root
  }

  public find(key: number): T | void {
    return this.root.find(key)
  }

  public findMax(key: number): number {
    return this.root.findMax(key)
  }

  public findWith(callback: FindCallback<T>): [number, T] | void {
    return this.root.findWith(callback)
  }

  public insert(key: number, value: T): AATree<T> {
    return new AATree(this.root.insert(key, value))
  }

  public remove(key: number): AATree<T> {
    return new AATree(this.root.remove(key))
  }

  public empty() {
    return this.root.empty()
  }

  public keys(): number[] {
    return this.root.keys()
  }

  public walk(): NodeData<T>[] {
    return this.root.walk()
  }

  public walkWithin(start: number, end: number): NodeData<T>[] {
    let adjustedStart = this.root.findMax(start)
    return this.root.walkWithin(adjustedStart, end)
  }

  public ranges(): Range<T>[] {
    return this.root.ranges()
  }

  public rangesWithin(start: number, end: number): Range<T>[] {
    let adjustedStart = this.root.findMax(start)
    return this.root.rangesWithin(adjustedStart, end)
  }

  public isInvariant(): boolean {
    return this.root.isInvariant()
  }
}
