import { AATree } from './AATree'

interface OffsetValue {
  startIndex: number
  endIndex: number
  size: number
}

export interface Item {
  index: number
  offset: number
  size: number
}

export class OffsetList {
  public rangeTree: AATree<number>
  public offsetTree: AATree<OffsetValue>
  private nanIndices: number[] = []

  public static create(): OffsetList {
    return new OffsetList(AATree.empty<number>())
  }

  private constructor(rangeTree: AATree<number>) {
    this.rangeTree = rangeTree

    let offsetTree = AATree.empty<OffsetValue>()

    let offset = 0
    const ranges = rangeTree.ranges()

    let nanFound = false

    for (let { start: startIndex, end: endIndex, value: size } of ranges) {
      if (isNaN(size)) {
        this.nanIndices.push(startIndex)

        if (!nanFound) {
          offsetTree = offsetTree.insert(offset, {
            startIndex,
            endIndex: Infinity,
            size,
          })
        }

        nanFound = true
      } else if (!nanFound) {
        offsetTree = offsetTree.insert(offset, {
          startIndex,
          endIndex: endIndex,
          size,
        })

        offset += (endIndex - startIndex + 1) * size
      }
    }

    this.offsetTree = offsetTree
  }

  empty() {
    return this.rangeTree.empty()
  }

  public insert(start: number, end: number, size: number): OffsetList {
    let tree = this.rangeTree
    if (tree.empty()) {
      return new OffsetList(tree.insert(0, size))
    }

    // tree is in non-complete state - we know the group sizes, but not the item sizes
    if (this.nanIndices.length && this.nanIndices.indexOf(end) > -1) {
      const groupSize = tree.find(this.nanIndices[0] - 1)
      if (groupSize === size) {
        return new OffsetList(AATree.empty<number>().insert(0, size))
      }
      for (const nanIndex of this.nanIndices) {
        tree = tree.insert(nanIndex, size)
      }
      return new OffsetList(tree)
    }

    // extend the range in both directions, so that we can get adjacent neighbours.
    // if the previous / next ones have the same value as the one we are about to insert,
    // we 'merge' them.
    const overlapingRanges = tree.rangesWithin(start - 1, end + 1)

    if (
      overlapingRanges.some(range => {
        return range.start === start && (range.end === end || range.end === Infinity) && range.value === size
      })
    ) {
      return this
    }

    let firstPassDone = false
    let shouldInsert = false
    for (const { start: rangeStart, end: rangeEnd, value: rangeValue } of overlapingRanges) {
      // previous range
      if (!firstPassDone) {
        shouldInsert = rangeValue !== size
        firstPassDone = true
      } else {
        // remove the range if it starts within the new range OR if
        // it has the same value as it, in order to perfrom a merge
        if (end >= rangeStart || size === rangeValue) {
          tree = tree.remove(rangeStart)
        }
      }

      // next range
      if (rangeEnd > end && end >= rangeStart) {
        if (rangeValue !== size && !isNaN(rangeValue)) {
          tree = tree.insert(end + 1, rangeValue)
        }
      }
    }

    if (shouldInsert) {
      tree = tree.insert(start, size)
    }

    return tree === this.rangeTree ? this : new OffsetList(tree)
  }

  public insertSpots(spotIndexes: number[], value: number): OffsetList {
    if (this.empty()) {
      let tree = this.rangeTree
      for (const spot of spotIndexes) {
        tree = tree.insert(spot, value).insert(spot + 1, NaN)
      }

      return new OffsetList(tree)
    } else {
      throw new Error('attempting to overwrite non-empty tree')
    }
  }

  public offsetOf(index: number): number {
    if (this.offsetTree.empty()) {
      return 0
    }

    const find = (value: OffsetValue) => {
      if (value.startIndex > index) return -1
      if (value.endIndex < index) return 1
      return 0
    }

    const offsetRange = this.offsetTree.findWith(find)
    if (offsetRange) {
      const [offset, { startIndex, size }] = offsetRange
      return offset + (index - startIndex) * size
    } else {
      throw new Error(`Requested offset outside of the known ones, index: ${index}`)
    }
  }

  public itemAt(index: number): Item {
    const size = this.rangeTree.findMaxValue(index)
    return { index, size, offset: NaN }
  }

  public indexRange(startIndex: number, endIndex: number): Item[] {
    if (endIndex === 0) {
      return []
    }

    if (this.rangeTree.empty()) {
      return [{ index: 0, size: 0, offset: NaN }]
    }

    const ranges = this.rangeTree.rangesWithin(startIndex, endIndex)
    const result: Item[] = []

    for (const range of ranges) {
      const start = Math.max(startIndex, range.start)
      const rangeEnd = typeof range.end === 'undefined' ? Infinity : range.end
      const end = Math.min(endIndex, rangeEnd)

      for (let i = start; i <= end; i++) {
        result.push({ index: i, size: range.value, offset: NaN })
      }
    }
    return result
  }

  public range(startOffset: number, endOffset: number, minIndex: number = 0, maxIndex: number = Infinity): Item[] {
    if (this.offsetTree.empty()) {
      return [{ index: 0, size: 0, offset: 0 }]
    }

    const ranges = this.offsetTree.rangesWithin(startOffset, endOffset)

    const result: Item[] = []

    for (let {
      start: rangeOffset,
      value: { startIndex: rangeIndex, endIndex, size },
    } of ranges) {
      let offset = rangeOffset
      let startIndex = rangeIndex

      if (rangeOffset < startOffset) {
        startIndex += Math.floor((startOffset - rangeOffset) / size)
        offset += (startIndex - rangeIndex) * size
      }

      if (startIndex < minIndex) {
        offset += (minIndex - startIndex) * size
        startIndex = minIndex
      }

      // we don't know the size of this range - terminate with a probe item
      if (isNaN(size)) {
        result.push({ index: startIndex, size: 0, offset })
        return result
      }

      endIndex = Math.min(endIndex, maxIndex)

      for (let i = startIndex; i <= endIndex; i++) {
        if (offset > endOffset) {
          break
        }

        result.push({ index: i, size, offset })
        offset += size
      }
    }
    return result
  }

  public total(endIndex: number) {
    const ranges = this.rangeTree.rangesWithin(0, endIndex)

    let total = 0

    for (let { start, end, value: size } of ranges) {
      end = Math.min(end, endIndex)
      total += (end - start + 1) * (isNaN(size) ? 0 : size)
    }

    return total
  }

  public getOffsets(indices: number[]): IndexList {
    let tree = AATree.empty<number>()
    indices.forEach(index => {
      const offset = this.offsetOf(index)
      tree = tree.insert(offset, index)
    })
    return new IndexList(tree)
  }
}

export class IndexList {
  public tree: AATree<number>
  public constructor(tree: AATree<number>) {
    this.tree = tree
  }

  public findMaxValue(offset: number): number {
    return this.tree.findMaxValue(offset)
  }

  public empty(): boolean {
    return this.tree.empty()
  }
}
