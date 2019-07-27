import { VirtuosoStore } from '../src/VirtuosoStore'

describe('Virtuoso Store', () => {
  it('calculates the total height of the list', done => {
    const { totalHeight, itemHeights } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    let i = 0

    totalHeight(val => {
      if (i == 0) {
        expect(val).toBe(0)
      } else {
        expect(val).toBe(5000)
        done()
      }
      i++
    })

    itemHeights([{ start: 0, end: 0, size: 50 }])
  })

  it('leaves space for the footer', done => {
    const { totalHeight, footerHeight, itemHeights } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    itemHeights([{ start: 0, end: 0, size: 50 }])
    footerHeight(50)

    totalHeight(val => {
      expect(val).toBe(5050)
      done()
    })
  })

  it('recalculates total when item height changes', done => {
    const { totalHeight, itemHeights } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    itemHeights([{ start: 0, end: 0, size: 50 }])
    itemHeights([{ start: 0, end: 0, size: 30 }])

    totalHeight(val => {
      expect(val).toBe(4980)
      done()
    })
  })

  it('emits a single item when the size is unknown', () => {
    const { viewportHeight, list } = VirtuosoStore({ overscan: 0, totalCount: 100 })
    viewportHeight(230)

    list(items => {
      expect(items).toHaveLength(1)
    })
  })

  it('fills in the space with enough items', () => {
    const { itemHeights, viewportHeight, list } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    viewportHeight(230)
    itemHeights([{ start: 0, end: 0, size: 50 }])

    list(items => {
      expect(items).toHaveLength(5)
    })
  })

  it('fills in the space with enough items given initial item count', () => {
    const { initialItemCount, list } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    initialItemCount(5)

    list(items => {
      expect(items).toHaveLength(5)
    })
  })

  it('removes items when total is reduced', () => {
    const { totalCount, itemHeights, viewportHeight, list } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    viewportHeight(230)
    itemHeights([{ start: 0, end: 0, size: 50 }])

    let i = 0
    list(items => {
      switch (i++) {
        case 0:
          expect(items).toHaveLength(5)
          break
        case 1:
          expect(items).toHaveLength(0)
          break
        case 2:
          expect(items).toHaveLength(1)
          break
        default:
          throw new Error('should not get that many updates')
      }
    })

    totalCount(0)
    totalCount(1)
  })

  it('provides exact items for a given size', () => {
    const { itemHeights, viewportHeight, list } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    viewportHeight(250)

    itemHeights([{ start: 0, end: 0, size: 50 }])

    list(items => {
      expect(items).toHaveLength(5)
    })
  })

  it('moves to the correct window', () => {
    const { itemHeights, viewportHeight, list, scrollTop } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    viewportHeight(250)
    scrollTop(120)
    itemHeights([{ start: 0, end: 0, size: 50 }])

    list(items => {
      expect(items[0].index).toEqual(2)
      expect(items).toHaveLength(6)
    })
  })

  it('fills in the overscan', () => {
    const { itemHeights, viewportHeight, list, scrollTop } = VirtuosoStore({ overscan: 25, totalCount: 100 })

    viewportHeight(250)
    scrollTop(120)
    itemHeights([{ start: 0, end: 0, size: 50 }])

    list(items => {
      expect(items[0].index).toEqual(2)
      expect(items).toHaveLength(7)
    })
  })

  it('skips the fixed items', () => {
    const { topItemCount, itemHeights, viewportHeight, list } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    topItemCount(3)
    viewportHeight(250)
    itemHeights([{ start: 0, end: 0, size: 50 }])

    list(items => {
      expect(items[0].index).toEqual(3)
      expect(items).toHaveLength(2)
    })
  })

  it('picks the sticky items', done => {
    const { topList, groupCounts, itemHeights, viewportHeight, list } = VirtuosoStore({
      overscan: 0,
    })

    groupCounts([10, 90, 100])
    viewportHeight(250)
    itemHeights([{ start: 0, end: 0, size: 50 }])
    itemHeights([{ start: 1, end: 1, size: 50 }])

    topList(topItems => {
      expect(topItems).toHaveLength(1)
      expect(topItems[0]).toMatchObject({ index: 0, size: 50, offset: NaN })
    })

    list(items => {
      expect(items[0].index).toEqual(1)
      expect(items).toHaveLength(4)
      done()
    })
  })

  it('selects the closest sticky item', done => {
    const { topList, groupCounts, scrollTop, itemHeights, viewportHeight } = VirtuosoStore({
      overscan: 0,
      totalCount: 100,
    })

    groupCounts([10, 90, 100])
    viewportHeight(250)
    itemHeights([{ start: 0, end: 0, size: 50 }])
    itemHeights([{ start: 1, end: 1, size: 50 }])
    scrollTop(2000) // should scroll past the first item, into the second

    topList(topItems => {
      expect(topItems).toHaveLength(1)
      expect(topItems[0]).toMatchObject({ index: 11, size: 50, offset: NaN })
      done()
    })
  })

  it('infers total height for a grouped list from the first group and the first item', done => {
    const { totalHeight, groupCounts, itemHeights } = VirtuosoStore({
      overscan: 0,
    })

    groupCounts([10, 90, 100])
    itemHeights([{ start: 0, end: 0, size: 50 }])
    itemHeights([{ start: 1, end: 1, size: 20 }])

    totalHeight((total: number) => {
      expect(total).toEqual(3 * 50 + (10 + 90 + 100) * 20)
      done()
    })
  })

  it('translates the scrollToIndex to a given offset', done => {
    const { itemHeights, scrollToIndex, scrollTo } = VirtuosoStore({ totalCount: 100 })
    itemHeights([{ start: 0, end: 0, size: 50 }])

    scrollTo(offset => {
      expect(offset).toEqual(500)
      done()
    })

    scrollToIndex(10)
  })

  it('scrolls to display the item at the bottom of the visible viewport', done => {
    const { viewportHeight, itemHeights, scrollToIndex, scrollTo } = VirtuosoStore({ totalCount: 100 })
    const itemSize = 50
    itemHeights([{ start: 0, end: 0, size: itemSize }])
    viewportHeight(820)

    scrollTo(offset => {
      expect(offset).toEqual(itemSize * 20 - 820 + itemSize)
      done()
    })

    scrollToIndex({ index: 20, align: 'end' })
  })

  it('scrolls to display the item at the center of the visible viewport', done => {
    const { viewportHeight, itemHeights, scrollToIndex, scrollTo } = VirtuosoStore({ totalCount: 100 })
    const itemSize = 50
    itemHeights([{ start: 0, end: 0, size: itemSize }])
    viewportHeight(820)

    scrollTo(offset => {
      expect(offset).toEqual(itemSize * 20 - 820 / 2 + itemSize / 2)
      done()
    })

    scrollToIndex({ index: 20, align: 'center' })
  })

  it('takes into account the top list height when scrolling to a given location', done => {
    const { topItemCount, itemHeights, scrollToIndex, scrollTo } = VirtuosoStore({ totalCount: 100 })
    itemHeights([{ start: 0, end: 0, size: 50 }])
    topItemCount(3)

    scrollTo(offset => {
      expect(offset).toEqual(50 * 10 - 3 * 50)
      done()
    })

    scrollToIndex(10)
  })

  it('scrolls to display the first item in the group', done => {
    const { itemHeights, scrollToIndex, scrollTo, groupCounts } = VirtuosoStore({})
    groupCounts([10, 10, 10])
    itemHeights([{ start: 0, end: 0, size: 50 }])
    itemHeights([{ start: 1, end: 1, size: 20 }])

    scrollTo(offset => {
      expect(offset).toEqual(50 * 2 + 20 * 20)
      done()
    })

    scrollToIndex(22)
  })
})
