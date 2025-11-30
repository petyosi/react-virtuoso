/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AANode, walk } from '../src/AATree'
import { listSystem } from '../src/listSystem'
import { getValue, init, publish, subscribe } from '../src/urx'

describe('list engine', () => {
  describe('basics', () => {
    it('returns empty rows by default', () => {
      const { listState } = init(listSystem)
      expect(getValue(listState)).toMatchObject({ items: [] })
    })

    it('returns a probe row when location / dimensions are reported', () => {
      const { listState, propsReady, scrollTop, totalCount, viewportHeight } = init(listSystem)
      publish(totalCount, 1000)
      publish(propsReady, true)
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      expect(getValue(listState)).toMatchObject({
        items: [{ index: 0, offset: 0, size: 0 }],
      })
    })

    it('returns the full set if a default item height is set', () => {
      const { defaultItemHeight, listState, propsReady, scrollTop, totalCount, viewportHeight } = init(listSystem)

      publish(scrollTop, 0)
      publish(totalCount, 1000)
      publish(defaultItemHeight, 30)
      publish(propsReady, true)

      publish(viewportHeight, 200)
      // 7 items should be rendered
      expect(getValue(listState).items).toHaveLength(7)
    })

    it('returns the full set if a an initialItemCount is set', () => {
      const { initialItemCount, listState, propsReady } = init(listSystem)

      publish(initialItemCount, 10)
      publish(propsReady, true)
      expect(getValue(listState).items).toHaveLength(10)
    })

    it('returns the full set if a fixed item height is set', () => {
      const { fixedItemHeight, listState, propsReady, scrollTop, totalCount, viewportHeight } = init(listSystem)

      publish(scrollTop, 0)
      publish(totalCount, 1000)
      publish(fixedItemHeight, 30)
      publish(propsReady, true)

      publish(viewportHeight, 200)
      expect(getValue(listState).items).toHaveLength(7)
    })

    it('updates the rows when new sizes are reported', () => {
      const { listState, propsReady, scrollTop, sizeRanges, totalCount, viewportHeight } = init(listSystem)

      const sub = vi.fn()
      subscribe(listState, sub)

      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(totalCount, 1000)
      publish(propsReady, true)

      // probe item is sent
      expect(getValue(listState)).toMatchObject({
        items: [{ index: 0, offset: 0, size: 0 }],
      })
      publish(sizeRanges, [{ endIndex: 0, size: 30, startIndex: 0 }])

      // 7 items should be rendered
      expect(getValue(listState).items).toHaveLength(7)

      expect(getValue(listState)).toMatchObject({
        offsetBottom: 29790,
        offsetTop: 0,
      })

      // check if we don't render too much due to streams diamond shapes
      expect(sub).toHaveBeenCalledTimes(3)
    })
  })

  describe('initial index', () => {
    it('starts from a specified location', () => {
      const INITIAL_INDEX = 300
      const SIZE = 30
      const { initialTopMostItemIndex, listState, propsReady, scrollTo, scrollTop, sizeRanges, totalCount, viewportHeight } =
        init(listSystem)

      publish(initialTopMostItemIndex, INITIAL_INDEX)
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(totalCount, 1000)
      publish(propsReady, true)
      expect(getValue(listState)).toMatchObject({
        items: [{ index: INITIAL_INDEX, offset: 0, size: 0 }],
      })

      const sub = vi.fn()
      subscribe(scrollTo, sub)

      publish(sizeRanges, [{ endIndex: INITIAL_INDEX, size: SIZE, startIndex: INITIAL_INDEX }])

      expect(getValue(listState).items).toHaveLength(0)

      return new Promise((resolve) => {
        setTimeout(() => {
          expect(sub).toHaveBeenCalledWith({
            behavior: 'auto',
            top: INITIAL_INDEX * SIZE,
          })

          // the UI responds by publishing back through the scrollTop stream
          publish(scrollTop, INITIAL_INDEX * SIZE)
          expect(getValue(listState).items).toHaveLength(7)
          resolve(true)
        }, 100)
      })
    })

    it('starts from a specified location with fixed item size', () => {
      const INITIAL_INDEX = 300
      const SIZE = 30
      const { fixedItemHeight, initialTopMostItemIndex, listState, propsReady, scrollTo, scrollTop, totalCount, viewportHeight } =
        init(listSystem)

      publish(initialTopMostItemIndex, INITIAL_INDEX)
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(totalCount, 1000)
      publish(propsReady, true)
      publish(fixedItemHeight, SIZE)
      expect(getValue(listState)).toMatchObject({
        items: [],
      })

      const sub = vi.fn()
      subscribe(scrollTo, sub)

      expect(getValue(listState).items).toHaveLength(0)

      return new Promise((resolve) => {
        setTimeout(() => {
          expect(sub).toHaveBeenCalledWith({
            behavior: 'auto',
            top: INITIAL_INDEX * SIZE,
          })

          // the UI responds by publishing back through the scrollTop stream
          publish(scrollTop, INITIAL_INDEX * SIZE)
          expect(getValue(listState).items).toHaveLength(7)
          resolve(true)
        }, 100)
      })
    })
  })

  describe('scroll to index', () => {
    let sub: any
    let sti: any
    let sr: any

    const INDEX = 300
    const SIZE = 30
    const VIEWPORT = 200
    const TOTAL_COUNT = 1000
    beforeEach(() => {
      const { propsReady, scrollTo, scrollToIndex, scrollTop, sizeRanges, totalCount, viewportHeight } = init(listSystem)

      sti = scrollToIndex
      sr = sizeRanges
      publish(scrollTop, 0)
      publish(viewportHeight, VIEWPORT)
      publish(totalCount, TOTAL_COUNT)

      sub = vi.fn()
      subscribe(scrollTo, sub)

      publish(sizeRanges, [{ endIndex: 0, size: SIZE, startIndex: 0 }])
      publish(scrollToIndex, INDEX)
      publish(propsReady, true)

      expect(sub).toHaveBeenCalledWith({
        behavior: 'auto',
        top: INDEX * SIZE,
      })
    })

    it('navigates to index', () => {
      publish(sti, INDEX)

      expect(sub).toHaveBeenCalledWith({
        behavior: 'auto',
        top: INDEX * SIZE,
      })
    })

    it('navigates to index with center', () => {
      publish(sti, { align: 'center', index: INDEX })

      expect(sub).toHaveBeenCalledWith({
        behavior: 'auto',
        top: INDEX * SIZE - VIEWPORT / 2 + SIZE / 2,
      })
    })

    it('navigates to index with end', () => {
      publish(sti, { align: 'end', index: INDEX })

      expect(sub).toHaveBeenCalledWith({
        behavior: 'auto',
        top: INDEX * SIZE - VIEWPORT + SIZE,
      })
    })

    it('navigates to last index', () => {
      publish(sti, { align: 'end', index: 'LAST' })

      expect(sub).toHaveBeenCalledWith({
        behavior: 'auto',
        top: TOTAL_COUNT * SIZE - VIEWPORT,
      })
    })

    it('readjusts once when new sizes are reported', () => {
      const DEVIATION = 20
      publish(sti, { align: 'end', index: INDEX })

      expect(sub).toHaveBeenCalledWith({
        behavior: 'auto',
        top: INDEX * SIZE - VIEWPORT + SIZE,
      })

      publish(sr, [{ endIndex: INDEX - 1, size: SIZE + DEVIATION, startIndex: INDEX - 1 }])

      return new Promise((resolve) => {
        setTimeout(() => {
          expect(sub).toHaveBeenCalledWith({
            behavior: 'auto',
            top: INDEX * SIZE - VIEWPORT + SIZE + DEVIATION,
          })
          resolve(true)
        }, 20)
      })
    })
  })

  describe('scrolling up after a jump', () => {
    it('readjusts measurements to avoid jump', () => {
      const INITIAL_INDEX = 300
      const SIZE = 30
      const {
        initialTopMostItemIndex,
        listState,
        propsReady,
        scrollBy,
        scrollContainerState,
        scrollTo,
        sizeRanges,
        totalCount,
        viewportHeight,
      } = init(listSystem)

      publish(initialTopMostItemIndex, INITIAL_INDEX)
      publish(scrollContainerState, { scrollHeight: 1000 * 30, scrollTop: 0, viewportHeight: 200 })
      publish(viewportHeight, 200)
      publish(totalCount, 1000)
      publish(propsReady, true)
      expect(getValue(listState)).toMatchObject({
        items: [{ index: INITIAL_INDEX, offset: 0, size: 0 }],
      })

      const sub = vi.fn()
      subscribe(scrollTo, sub)

      const scrollBySub = vi.fn()
      subscribe(scrollBy, scrollBySub)

      publish(sizeRanges, [{ endIndex: INITIAL_INDEX, size: SIZE, startIndex: INITIAL_INDEX }])

      expect(getValue(listState).items).toHaveLength(0)

      return new Promise((resolve) => {
        setTimeout(() => {
          expect(sub).toHaveBeenCalledWith({
            behavior: 'auto',
            top: INITIAL_INDEX * SIZE,
          })

          setTimeout(() => {
            publish(scrollContainerState, {
              scrollHeight: 1000 * 30,
              scrollTop: INITIAL_INDEX * SIZE,
              viewportHeight: 200,
            })

            publish(scrollContainerState, {
              scrollHeight: 1000 * 30,
              scrollTop: INITIAL_INDEX * SIZE - 2,
              viewportHeight: 200,
            })

            publish(sizeRanges, [
              {
                endIndex: INITIAL_INDEX - 1,
                size: SIZE + 40,
                startIndex: INITIAL_INDEX - 1,
              },
            ])

            expect(scrollBySub).toHaveBeenCalledWith({ behavior: 'auto', top: 40 })
            resolve(true)
          }, 1000)
        }, 100)
      })
    })
  })

  describe('top items', () => {
    it('puts the top list items in topItems', () => {
      const { listState, propsReady, scrollTop, sizeRanges, topItemsIndexes, totalCount, viewportHeight } = init(listSystem)
      publish(topItemsIndexes, [0, 1, 2])
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(totalCount, 1000)
      publish(propsReady, true)

      expect(getValue(listState)).toMatchObject({
        items: [{ index: 0, offset: 0, size: 0 }],
        topItems: [],
      })

      publish(sizeRanges, [{ endIndex: 0, size: 30, startIndex: 0 }])

      // 4 items should be rendered
      expect(getValue(listState).items).toHaveLength(4)
      expect(getValue(listState)).toMatchObject({
        topItems: [
          { index: 0, offset: 0, size: 30 },
          { index: 1, offset: 30, size: 30 },
          { index: 2, offset: 60, size: 30 },
        ],
        topListHeight: 90,
      })

      expect(getValue(listState)).toMatchObject({
        offsetBottom: 29790,
        offsetTop: 90,
      })
    })
  })

  describe('grouped mode', () => {
    it('creates total count from groupCounts', () => {
      const { groupCounts, totalCount } = init(listSystem)
      const sub = vi.fn()
      subscribe(totalCount, sub)
      publish(groupCounts, [10, 10, 10])
      expect(sub).toHaveBeenCalledWith(33)
    })

    it('probes with a group item / item tuple', () => {
      const { groupCounts, listState, propsReady, scrollTop, viewportHeight } = init(listSystem)
      publish(groupCounts, [10, 10, 10])
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(propsReady, true)

      expect(getValue(listState)).toMatchObject({
        items: [
          { index: 0, offset: 0, size: 0, type: 'group' },
          { groupIndex: 0, index: 0, offset: 0, size: 0 },
        ],
      })
    })

    it('probes with a correct group item / item tuple for initialTopMostItemIndex ', () => {
      const { groupCounts, initialTopMostItemIndex, listState, propsReady, scrollTop, viewportHeight } = init(listSystem)
      publish(initialTopMostItemIndex, 22)
      publish(groupCounts, [10, 10, 10])
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(propsReady, true)

      expect(getValue(listState)).toMatchObject({
        items: [
          { index: 2, offset: 0, size: 0, type: 'group' },
          { groupIndex: 2, index: 22, offset: 0, size: 0 },
        ],
      })
    })

    it('renders groups and items', () => {
      const { groupCounts, listState, propsReady, scrollTop, sizeRanges, viewportHeight } = init(listSystem)
      publish(groupCounts, [3, 3, 3, 10])
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(propsReady, true)

      publish(sizeRanges, [
        { endIndex: 0, size: 30, startIndex: 0 },
        { endIndex: 5, size: 20, startIndex: 1 },
      ])

      expect(getValue(listState)).toMatchObject({
        topItems: [{ index: 0, offset: 0, size: 30, type: 'group' }],
        topListHeight: 30,
      })

      expect(getValue(listState)).toMatchObject({
        items: [
          { groupIndex: 0, index: 0, offset: 30, size: 20 },
          { groupIndex: 0, index: 1, offset: 50, size: 20 },
          { groupIndex: 0, index: 2, offset: 70, size: 20 },
          { index: 1, offset: 90, size: 30, type: 'group' },
          { groupIndex: 1, index: 3, offset: 120, size: 20 },
          { groupIndex: 1, index: 4, offset: 140, size: 20 },
          { groupIndex: 1, index: 5, offset: 160, size: 20 },
          { index: 2, offset: 180, size: 30, type: 'group' },
        ],
      })
    })

    it('takes header height into account', () => {
      const { groupCounts, headerHeight, listState, propsReady, scrollTop, sizeRanges, viewportHeight } = init(listSystem)
      publish(
        groupCounts,
        Array.from({ length: 20 }, () => 3)
      )
      publish(scrollTop, 0)
      publish(viewportHeight, 300)
      publish(propsReady, true)

      publish(sizeRanges, [
        { endIndex: 0, size: 30, startIndex: 0 },
        { endIndex: 3, size: 20, startIndex: 1 },
      ])

      publish(headerHeight, 80)

      expect(getValue(listState)).toMatchObject({
        topItems: [{ index: 0, offset: 0, size: 30, type: 'group' }],
        topListHeight: 30,
      })

      publish(scrollTop, 90)

      expect(getValue(listState)).toMatchObject({
        topItems: [{ index: 0, offset: 0, size: 30, type: 'group' }],
      })

      /*
        expect(getValue(listState)).toMatchObject({
          items: [
            { index: 0, groupIndex: 0, size: 20, offset: 30 },
            { index: 1, groupIndex: 0, size: 20, offset: 50 },
            { index: 2, groupIndex: 0, size: 20, offset: 70 },
            { type: 'group', index: 1, size: 30, offset: 90 },
            { index: 3, groupIndex: 1, size: 20, offset: 120 },
            { index: 4, groupIndex: 1, size: 20, offset: 140 },
            { index: 5, groupIndex: 1, size: 20, offset: 160 },
            { type: 'group', index: 2, size: 30, offset: 180 },
          ],
        })
           */
    })
  })

  describe('headerHeight', () => {
    it('offsets the list at the top mode', () => {
      const { headerHeight, listState, propsReady, scrollTop, sizeRanges, totalCount, viewportHeight } = init(listSystem)

      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(totalCount, 1000)
      publish(headerHeight, 50)
      publish(sizeRanges, [{ endIndex: 0, size: 30, startIndex: 0 }])
      publish(propsReady, true)

      // 7 items should be rendered
      expect(getValue(listState).items).toHaveLength(5)
    })
  })

  describe('total height changed', () => {
    it('includes the header and the total list height', () => {
      const {
        footerHeight,
        headerHeight,
        listState,
        propsReady,
        scrollTop,
        sizeRanges,
        totalCount,
        totalListHeightChanged,
        viewportHeight,
      } = init(listSystem)

      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(totalCount, 1000)
      publish(headerHeight, 50)
      publish(footerHeight, 40)
      publish(sizeRanges, [{ endIndex: 0, size: 30, startIndex: 0 }])
      const sub = vi.fn()
      subscribe(totalListHeightChanged, sub)
      publish(propsReady, true)

      expect(sub).toHaveBeenCalledWith(50 + 40 + 1000 * 30)
      // 7 items should be rendered
      expect(getValue(listState).items).toHaveLength(5)
    })
  })

  describe('align to bottom', () => {
    it('pads the top with the difference of the viewport and the list size', () => {
      const { alignToBottom, paddingTopAddition, propsReady, scrollTop, sizeRanges, totalCount, viewportHeight } = init(listSystem)

      publish(alignToBottom, true)
      publish(scrollTop, 0)
      publish(viewportHeight, 1200)
      publish(totalCount, 5)
      publish(sizeRanges, [{ endIndex: 0, size: 30, startIndex: 0 }])
      const sub = vi.fn()
      subscribe(paddingTopAddition, sub)
      publish(propsReady, true)

      // throttling is necessary due to react 18
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(sub).toHaveBeenCalledWith(1200 - 5 * 30)
          publish(viewportHeight, 1100)
          setTimeout(() => {
            expect(sub).toHaveBeenCalledWith(1100 - 5 * 30)
            resolve(void 0)
          })
        })
      })
    })
  })

  describe('shifting items', () => {
    it.skip('preserves the last item size and removes the ones at the top', () => {
      const { firstItemIndex, sizeRanges, sizes, totalCount } = init(listSystem)
      publish(totalCount, 100)
      publish(firstItemIndex, 4000)
      publish(sizeRanges, [{ endIndex: 0, size: 30, startIndex: 0 }])

      publish(sizeRanges, [{ endIndex: 99, size: 20, startIndex: 99 }])

      publish(totalCount, 95)
      publish(firstItemIndex, 4005)

      expect(toKV(getValue(sizes).sizeTree)).toEqual([
        [0, 30],
        [94, 20],
      ])
    })
  })

  describe('unshifting group items', () => {
    it('updates the size tree when unshifting with new group counts and decreasing firstItemIndex', () => {
      const { firstItemIndex, groupCounts, sizeRanges, sizes } = init(listSystem)
      publish(groupCounts, [3, 3])
      publish(firstItemIndex, 4000)
      publish(sizeRanges, [
        { endIndex: 0, size: 30, startIndex: 0 },
        { endIndex: 1, size: 20, startIndex: 1 },
      ])

      publish(sizeRanges, [{ endIndex: 2, size: 25, startIndex: 2 }])

      publish(groupCounts, [3, 5, 3])
      publish(firstItemIndex, 4000 - 5)

      expect(toKV(getValue(sizes).sizeTree)).toEqual([
        [0, 30],
        [1, 20],
        [4, 30],
        [5, 20],
        [8, 25],
        [9, 20],
        [10, 30],
        [11, 20],
      ])
    })

    it.skip('shifts the first group size correctly when shifting (increasing firstItemIndex)', () => {
      const { firstItemIndex, groupCounts, sizeRanges, sizes } = init(listSystem)
      publish(groupCounts, [3, 3, 3, 3])
      publish(firstItemIndex, 4000)
      publish(sizeRanges, [
        { endIndex: 0, size: 30, startIndex: 0 },
        { endIndex: 1, size: 20, startIndex: 1 },
      ])

      publish(sizeRanges, [{ endIndex: 7, size: 25, startIndex: 7 }])

      let theSizeTree = toKV(getValue(sizes).sizeTree)

      publish(groupCounts, [1, 3, 3])
      publish(firstItemIndex, 4000 + 5)

      theSizeTree = toKV(getValue(sizes).sizeTree)

      expect(theSizeTree).toEqual([
        [0, 30],
        [1, 25],
        [2, 30],
        [3, 20],
        [6, 30],
        [7, 20],
      ])
    })

    it.skip('re-creates the size record that the group deletes', () => {
      const { firstItemIndex, groupCounts, sizeRanges, sizes } = init(listSystem)
      publish(groupCounts, [3, 3, 3, 3])
      publish(firstItemIndex, 4000)
      publish(sizeRanges, [
        { endIndex: 0, size: 30, startIndex: 0 },
        { endIndex: 1, size: 20, startIndex: 1 },
      ])

      let theSizeTree = toKV(getValue(sizes).sizeTree)

      publish(groupCounts, [1, 3, 3])
      publish(firstItemIndex, 4000 + 5)

      theSizeTree = toKV(getValue(sizes).sizeTree)

      expect(theSizeTree).toEqual([
        [0, 30],
        [1, 20],
        [2, 30],
        [3, 20],
        [6, 30],
        [7, 20],
      ])
    })
  })

  describe('minOverscanItemCount', () => {
    it('appends extra items after the visible range', () => {
      const { defaultItemHeight, listState, minOverscanItemCount, propsReady, scrollTop, totalCount, viewportHeight } = init(listSystem)

      publish(scrollTop, 0)
      publish(totalCount, 100)
      publish(defaultItemHeight, 50)
      publish(minOverscanItemCount, 3)
      publish(propsReady, true)
      publish(viewportHeight, 200)

      const state = getValue(listState)
      // 200px viewport / 50px items = 4 visible + 3 overscan = 7 items
      // But we start at index 0, so we can only append after
      expect(state.items.length).toBeGreaterThanOrEqual(7)
      // Last item index should be at least 6 (0-6 = 7 items)
      expect(state.items[state.items.length - 1].index).toBeGreaterThanOrEqual(6)
    })

    it('prepends extra items before the visible range when scrolled', () => {
      const { defaultItemHeight, listState, minOverscanItemCount, propsReady, scrollTop, totalCount, viewportHeight } = init(listSystem)

      publish(totalCount, 100)
      publish(defaultItemHeight, 50)
      publish(minOverscanItemCount, 3)
      publish(propsReady, true)
      publish(viewportHeight, 200)
      // Scroll to show items starting around index 20
      publish(scrollTop, 1000)

      const state = getValue(listState)
      // First item should be 3 items before the visible range
      // Visible range starts at 1000/50 = 20, so first item should be 17
      expect(state.items[0].index).toBeLessThanOrEqual(17)
    })

    it('handles asymmetric top/bottom configuration', () => {
      const { defaultItemHeight, listState, minOverscanItemCount, propsReady, scrollTop, totalCount, viewportHeight } = init(listSystem)

      publish(totalCount, 100)
      publish(defaultItemHeight, 50)
      publish(minOverscanItemCount, { bottom: 5, top: 2 })
      publish(propsReady, true)
      publish(viewportHeight, 200)
      // Scroll to middle of list
      publish(scrollTop, 1000)

      const state = getValue(listState)
      const visibleStartIndex = 20 // 1000/50
      const visibleEndIndex = 23 // (1000+200)/50 - 1

      // First item should be at most 2 before visible start
      expect(state.items[0].index).toBeLessThanOrEqual(visibleStartIndex)
      expect(state.items[0].index).toBeGreaterThanOrEqual(visibleStartIndex - 2)

      // Last item should be at least 5 after visible end
      expect(state.items[state.items.length - 1].index).toBeGreaterThanOrEqual(visibleEndIndex + 5)
    })

    it('does not prepend items beyond the start of the list', () => {
      const { defaultItemHeight, listState, minOverscanItemCount, propsReady, scrollTop, totalCount, viewportHeight } = init(listSystem)

      publish(scrollTop, 0)
      publish(totalCount, 100)
      publish(defaultItemHeight, 50)
      publish(minOverscanItemCount, 10)
      publish(propsReady, true)
      publish(viewportHeight, 200)

      const state = getValue(listState)
      // Even with 10 overscan, first item should be 0 when at top
      expect(state.items[0].index).toBe(0)
    })

    it('does not append items beyond the end of the list', () => {
      const { defaultItemHeight, listState, minOverscanItemCount, propsReady, scrollTop, totalCount, viewportHeight } = init(listSystem)

      publish(totalCount, 10)
      publish(defaultItemHeight, 50)
      publish(minOverscanItemCount, 20)
      publish(propsReady, true)
      publish(viewportHeight, 200)
      // Scroll to near end
      publish(scrollTop, 300)

      const state = getValue(listState)
      // Last item should not exceed totalCount - 1
      expect(state.items[state.items.length - 1].index).toBeLessThanOrEqual(9)
    })

    it('recalculates when minOverscanItemCount changes', () => {
      const { defaultItemHeight, listState, minOverscanItemCount, propsReady, scrollTop, totalCount, viewportHeight } = init(listSystem)

      publish(scrollTop, 0)
      publish(totalCount, 100)
      publish(defaultItemHeight, 50)
      publish(propsReady, true)
      publish(viewportHeight, 200)

      const initialState = getValue(listState)
      const initialCount = initialState.items.length

      publish(minOverscanItemCount, 5)

      const newState = getValue(listState)
      // Should have more items after setting overscan
      expect(newState.items.length).toBeGreaterThan(initialCount)
    })
  })
})

function toKV<T>(tree: AANode<T>) {
  return walk(tree).map((node) => [node.k, node.v] as [number, T])
}
