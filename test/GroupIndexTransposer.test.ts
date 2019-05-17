/* eslint @typescript-eslint/explicit-function-return-type: 0 */
import { GroupIndexTransposer } from '../src/GroupIndexTransposer'

describe('Group index transposer', () => {
  it('calculates the correct total index', () => {
    const transposer = new GroupIndexTransposer([10, 10, 10, 10, 10])
    expect(transposer.totalCount()).toEqual(55)
  })

  it('generates the groups indices', () => {
    const transposer = new GroupIndexTransposer([10, 10, 10, 10, 10])
    expect(transposer.groupIndices()).toEqual([0, 11, 22, 33, 44])
  })

  it('identifies an item as a group', () => {
    const transposer = new GroupIndexTransposer([10, 10, 10, 10, 10])
    expect(transposer.transpose([{ index: 0, offset: 0, size: NaN }])).toMatchObject([{ type: 'group', index: 0 }])
  })

  it('transposes the provided index', () => {
    const transposer = new GroupIndexTransposer([10, 10, 10, 10, 10])
    expect(transposer.transpose([{ index: 24, offset: 100, size: 0 }])).toMatchObject([
      {
        type: 'item',
        transposedIndex: 21,
        groupIndex: 2,
      },
    ])
  })
})
