import { AATree } from './AATree'
import { Item } from './OffsetList'

export interface RecordItem extends Item {
  type: 'item'
  transposedIndex: number
  groupIndex: number
}

export interface GroupItem extends Item {
  type: 'group'
  groupIndex: number
}

export type ListItem = RecordItem | GroupItem

export class StubIndexTransposer {
  public transpose(items: Item[]): RecordItem[] {
    return items.map(item => {
      return {
        groupIndex: 0,
        index: item.index,
        offset: item.offset,
        size: item.size,
        transposedIndex: item.index,
        type: 'item',
      }
    })
  }
}

export class GroupIndexTransposer {
  public tree: AATree<[number, number]>
  private count: number

  public constructor(counts: number[]) {
    this.count = counts.reduce((acc, groupCount) => acc + groupCount + 1, 0)
    let tree = AATree.empty<[number, number]>()
    let groupIndex = 0
    let total = 0
    for (const groupCount of counts) {
      tree = tree.insert(total, [groupIndex, total])
      groupIndex++
      total += groupCount + 1
    }
    this.tree = tree
  }

  public totalCount(): number {
    return this.count
  }

  public transpose(items: Item[]): ListItem[] {
    return items.map(item => {
      const groupMatch = this.tree.find(item.index)
      if (groupMatch) {
        return {
          groupIndex: groupMatch[0],
          index: item.index,
          offset: item.offset,
          size: item.size,
          type: 'group',
        }
      }

      const [groupIndex] = this.tree.findMaxValue(item.index)!
      return {
        groupIndex: groupIndex,
        index: item.index,
        offset: item.offset,
        size: item.size,
        transposedIndex: item.index - groupIndex - 1,
        type: 'item',
      }
    })
  }

  public groupIndices() {
    return this.tree.keys()
  }
}
