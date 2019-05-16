import { AATree } from './AATree'

export interface TItem {
  index: number
  groupIndex: number
  type: 'item'
}

export interface TGroup {
  index: number
  type: 'group'
}

export class GroupIndexTransposer {
  public tree: AATree<[number, number]>
  private count: number

  public constructor(counts: number[]) {
    this.count = counts.reduce((acc, groupCount) => acc + groupCount + 1, 0)
    let tree = AATree.empty<[number, number]>()
    let groupIndex = 0
    let total = 0
    for (let groupCount of counts) {
      tree = tree.insert(total, [groupIndex, total])
      groupIndex++
      total += groupCount + 1
    }
    this.tree = tree
  }

  public totalCount(): number {
    return this.count
  }

  public transpose(index: number): TGroup | TItem {
    const groupMatch = this.tree.find(index)
    if (groupMatch) {
      return { type: 'group', index: groupMatch[0] }
    }
    const [groupIndex] = this.tree.findMaxValue(index)!
    return { type: 'item', index: index - groupIndex - 1, groupIndex: groupIndex }
  }

  public groupIndices() {
    return this.tree.keys()
  }
}
