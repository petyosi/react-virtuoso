import { groupCountsToIndicesAndCount } from '../src/groupedListSystem'
describe('grouped list system', () => {
  describe('groupCountsToIndicesAndCount', () => {
    it('calculates total count and marks the group indices', () => {
      const counts = [10, 5, 20]
      const result = groupCountsToIndicesAndCount(counts)
      expect(result.totalCount).toEqual(10 + 5 + 20 + 3 /* 3 groups */)
      expect(result.groupIndices).toEqual([0, 11, 17])
    })
  })
})
