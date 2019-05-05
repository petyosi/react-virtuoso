/* eslint @typescript-eslint/explicit-function-return-type: 0 */
import { OffsetList } from '../src/OffsetList'
import { AATree } from '../src/AATree'

describe('Offset List', () => {
  describe('range tree behavior', () => {
    function toArray<T>(tree: AATree<T>): [number, T][] {
      return Array.from(tree.walk()).map(({ key, value }) => [key, value])
    }

    it('starts with a default value and length', () => {
      let list = OffsetList.create()
      expect(toArray(list.rangeTree)).toEqual([])
    })

    it('sets the first value as the default one', () => {
      let list = OffsetList.create()
      list = list.insert(0, 0, 5)
      expect(toArray(list.rangeTree)).toEqual([[0, 5]])
    })

    describe('value insertion', () => {
      it('does not alter the list if the value is the same as the existing range', () => {
        const firstList = OffsetList.create().insert(0, 0, 5)

        let list = firstList.insert(2, 3, 5)

        expect(toArray(list.rangeTree)).toEqual([[0, 5]])
        expect(list).toBe(firstList)
      })

      it('does not alter the list if the same value is inserted', () => {
        const firstList = OffsetList.create()
          .insert(0, 0, 5)
          .insert(0, 0, 3)
        let list = firstList.insert(0, 0, 3)
        expect(list).toBe(firstList)
      })

      it('inserting at the beginning offsets the existing range', () => {
        let list = OffsetList.create().insert(0, 0, 5)
        list = list.insert(0, 0, 10)

        expect(toArray(list.rangeTree)).toEqual([[0, 10], [1, 5]])
      })

      it('merges with the previous range if values are the same', () => {
        let list = OffsetList.create().insert(0, 0, 5)
        list = list.insert(0, 0, 10)
        list = list.insert(1, 2, 10)

        expect(toArray(list.rangeTree)).toEqual([[0, 10], [3, 5]])
      })

      it('merges with the next range if values are the same', () => {
        let list = OffsetList.create().insert(0, 0, 5)
        list = list.insert(1, 2, 10)
        list = list.insert(0, 0, 10)

        expect(toArray(list.rangeTree)).toEqual([[0, 10], [3, 5]])
      })

      it('splits an existing range', () => {
        let list = OffsetList.create().insert(0, 0, 5)
        list = list.insert(2, 3, 10)

        expect(toArray(list.rangeTree)).toEqual([[0, 5], [2, 10], [4, 5]])
      })

      it('overrides an existing range', () => {
        let list = OffsetList.create().insert(0, 0, 5)
        list = list.insert(2, 3, 10)
        list = list.insert(1, 3, 20)

        expect(toArray(list.rangeTree)).toEqual([[0, 5], [1, 20], [4, 5]])
      })

      it('overrides multiple intervals', () => {
        let list = OffsetList.create().insert(0, 0, 5)
        list = list.insert(4, 5, 10)
        list = list.insert(6, 7, 20)
        list = list.insert(3, 8, 3)

        expect(toArray(list.rangeTree)).toEqual([[0, 5], [3, 3], [9, 5]])
      })

      it('joins split ranges', () => {
        let list = OffsetList.create().insert(0, 0, 5)
        list = list.insert(4, 5, 10)
        list = list.insert(6, 7, 20)
        list = list.insert(3, 8, 5)

        expect(toArray(list.rangeTree)).toEqual([[0, 5]])
      })

      it('calculates total for a given end index', () => {
        let list = OffsetList.create().insert(0, 0, 5)
        list = list.insert(4, 5, 10)
        list = list.insert(6, 7, 20)

        expect(list.total(19)).toEqual(140)
      })

      it('handles subsequent insertions correctly (bug)', () => {
        let list = OffsetList.create().insert(0, 0, 158)

        expect(list.rangeTree.ranges()).toEqual([{ start: 0, end: Infinity, value: 158 }])

        list = list.insert(1, 1, 206)

        expect(list.rangeTree.ranges()).toEqual([
          { start: 0, end: 0, value: 158 },
          { start: 1, end: 1, value: 206 },
          { start: 2, end: Infinity, value: 158 },
        ])

        list = list.insert(3, 3, 182)
        expect(list.rangeTree.ranges()).toEqual([
          { start: 0, end: 0, value: 158 },
          { start: 1, end: 1, value: 206 },
          { start: 2, end: 2, value: 158 },
          { start: 3, end: 3, value: 182 },
          { start: 4, end: Infinity, value: 158 },
        ])

        list = list.insert(4, 4, 206)

        expect(list.rangeTree.ranges()).toEqual([
          { start: 0, end: 0, value: 158 },
          { start: 1, end: 1, value: 206 },
          { start: 2, end: 2, value: 158 },
          { start: 3, end: 3, value: 182 },
          { start: 4, end: 4, value: 206 },
          { start: 5, end: Infinity, value: 158 },
        ])
      })

      it('handles subsequent insertions correctly (bug #2)', () => {
        let list = OffsetList.create()
          .insert(0, 0, 206)
          .insert(0, 0, 230)
          .insert(1, 1, 158)
          .insert(3, 3, 182)
          .insert(4, 4, 158)
          .insert(5, 5, 158)
          .insert(6, 6, 230)

        expect(list.rangeTree.ranges()).toEqual([
          { start: 0, end: 0, value: 230 },
          { start: 1, end: 1, value: 158 },
          { start: 2, end: 2, value: 206 },
          { start: 3, end: 3, value: 182 },
          { start: 4, end: 5, value: 158 },
          { start: 6, end: 6, value: 230 },
          { start: 7, end: Infinity, value: 206 },
        ])
      })
    })
  })

  describe('offset tree behavior', () => {
    function toArray(offsetList: OffsetList) {
      const result = []
      for (let {
        key: offset,
        value: { size, startIndex, endIndex },
      } of offsetList.offsetTree.walk()) {
        result.push({
          offset,
          size,
          startIndex,
          endIndex,
        })
      }
      return result
    }
    it('Starts with a single, endless value', () => {
      const offsetList = OffsetList.create().insert(0, 0, 10)
      expect(toArray(offsetList)).toEqual([{ startIndex: 0, endIndex: Infinity, offset: 0, size: 10 }])
    })

    it('Copies the inserted range in the offset tree', () => {
      let offsetList = OffsetList.create().insert(0, 0, 10)
      offsetList = offsetList.insert(2, 4, 20)

      expect(toArray(offsetList)).toEqual([
        { startIndex: 0, endIndex: 1, offset: 0, size: 10 },
        { startIndex: 2, endIndex: 4, offset: 20, size: 20 },
        { startIndex: 5, endIndex: Infinity, offset: 80, size: 10 },
      ])
    })

    it('Yields the items at a given range', () => {
      const offsetList = OffsetList.create()
        .insert(0, 0, 10)
        .insert(2, 4, 20)

      const yielded = Array.from(offsetList.range(13, 79))

      expect(yielded).toEqual([
        { index: 1, size: 10, offset: 10 },
        { index: 2, size: 20, offset: 20 },
        { index: 3, size: 20, offset: 40 },
        { index: 4, size: 20, offset: 60 },
      ])
    })
  })

  describe('index tree behavior', () => {
    it('Yields the items at a given range', () => {
      const offsetList = OffsetList.create()
        .insert(0, 0, 10)
        .insert(2, 4, 20)

      const yielded = Array.from(offsetList.indexRange(0, 6))

      expect(yielded).toEqual([
        { index: 0, size: 10, offset: NaN },
        { index: 1, size: 10, offset: NaN },
        { index: 2, size: 20, offset: NaN },
        { index: 3, size: 20, offset: NaN },
        { index: 4, size: 20, offset: NaN },
        { index: 5, size: 10, offset: NaN },
        { index: 6, size: 10, offset: NaN },
      ])
    })
  })
})
