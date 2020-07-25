import { VirtuosoStore } from '../src/VirtuosoStore'

describe('Virtuoso Store', () => {
  it('calculates the total height of the list', done => {
    const { totalHeight, itemHeights } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    let i = 0

    totalHeight(val => {
      if (i === 0) {
        expect(val).toBe(0)
      } else {
        expect(val).toBe(5000)
        done()
      }
      i++
    })

    itemHeights([{ start: 0, end: 0, size: 50 }])
  })

  it('leaves space for the header', done => {
    const { totalHeight, headerHeight, itemHeights } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    itemHeights([{ start: 0, end: 0, size: 50 }])
    headerHeight(50)

    totalHeight(val => {
      expect(val).toBe(5050)
      done()
    })
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
    const { scrollTop, totalCount, itemHeights, viewportHeight, list } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    viewportHeight(230)
    itemHeights([{ start: 0, end: 0, size: 50 }])
    scrollTop(0)

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
      expect(items).toHaveLength(6)
      expect(items[0].index).toEqual(2)
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
    const { scrollTop, viewportHeight, totalHeight, groupCounts, itemHeights } = VirtuosoStore({
      overscan: 0,
    })

    groupCounts([10, 90, 100])
    scrollTop(0)
    viewportHeight(200)
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

    scrollTo(location => {
      expect(location.top).toEqual(500)
      done()
    })

    scrollToIndex(10)
  })

  it('retries the scroll if new heights are reported', done => {
    const { scrollTop, itemHeights, scrollToIndex, scrollTo } = VirtuosoStore({ totalCount: 100 })
    itemHeights([{ start: 0, end: 0, size: 50 }])

    scrollToIndex(10)

    scrollTop(500)

    scrollTo(location => {
      expect(location.top).toEqual(510)
      done()
    })

    itemHeights([{ start: 8, end: 8, size: 60 }])
  })

  it('scrolls to display the item at the bottom of the visible viewport', done => {
    const { viewportHeight, itemHeights, scrollToIndex, scrollTo } = VirtuosoStore({ totalCount: 100 })
    const itemSize = 50

    itemHeights([{ start: 0, end: 0, size: itemSize }])
    viewportHeight(820)

    scrollTo(location => {
      expect(location.top).toEqual(itemSize * 20 - 820 + itemSize)
      done()
    })

    scrollToIndex({ index: 20, align: 'end' })
  })

  it('scrolls to display the item at the center of the visible viewport', done => {
    const { viewportHeight, itemHeights, scrollToIndex, scrollTo } = VirtuosoStore({ totalCount: 100 })
    const itemSize = 50
    itemHeights([{ start: 0, end: 0, size: itemSize }])
    viewportHeight(820)

    scrollTo(location => {
      expect(location.top).toEqual(itemSize * 20 - 820 / 2 + itemSize / 2)
      done()
    })

    scrollToIndex({ index: 20, align: 'center' })
  })

  it('takes into account the top list height when scrolling to a given location', done => {
    const { topItemCount, itemHeights, scrollToIndex, scrollTo, viewportHeight } = VirtuosoStore({ totalCount: 100 })
    itemHeights([{ start: 0, end: 0, size: 50 }])
    topItemCount(3)
    viewportHeight(2000)

    scrollTo(location => {
      expect(location.top).toEqual(50 * 10 - 3 * 50)
      done()
    })

    scrollToIndex(10)
  })

  it('scrolls to display the first item in the group', done => {
    const { scrollTop, viewportHeight, itemHeights, scrollToIndex, scrollTo, groupCounts } = VirtuosoStore({})
    groupCounts([10, 10, 10])

    scrollTop(0)
    viewportHeight(200)
    itemHeights([{ start: 0, end: 0, size: 50 }])
    itemHeights([{ start: 1, end: 1, size: 20 }])

    scrollTo(location => {
      expect(location.top).toEqual(50 * 2 + 20 * 20)
      done()
    })

    scrollToIndex(22)
  })

  it('resets the offset list if it gets too large', done => {
    const { scrollTo, scrollTop, maxRangeSize, list, viewportHeight, itemHeights } = VirtuosoStore({ totalCount: 100 })
    viewportHeight(30)
    maxRangeSize(6)

    list(_list => {
      // console.log(list)
    })

    itemHeights([
      { size: 5, start: 0, end: 0 },
      { size: 6, start: 1, end: 1 },
      { size: 5, start: 2, end: 2 },
      { size: 6, start: 3, end: 3 },
    ])

    scrollTop(120)

    itemHeights([{ size: 5, start: 4, end: 4 }])
    itemHeights([{ size: 6, start: 5, end: 5 }])

    scrollTo(scrollToLocation => {
      expect(scrollToLocation.top).toEqual(117)
      done()
    })

    // this line will exceed the range size of the list.
    // the new list will default to size of 5, and accept size 7.
    // The three 6 records from above will be lost, so we need to readjust with 3.
    itemHeights([{ size: 7, start: 6, end: 6 }])
  })
})
