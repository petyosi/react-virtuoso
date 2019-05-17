import { VirtuosoStore } from '../src/VirtuosoStore'
import { skip, take } from 'rxjs/operators'

describe('Virtuoso Store', () => {
  it('calculates the total height of the list', done => {
    const { totalHeight$, itemHeights } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    totalHeight$.pipe(take(1)).subscribe(val => {
      expect(val).toBe(0)
    })

    totalHeight$.pipe(skip(1)).subscribe(val => {
      expect(val).toBe(5000)
      done()
    })

    itemHeights([{ start: 0, end: 0, size: 50 }])
  })

  it('leaves space for the footer', done => {
    const { totalHeight$, footerHeight, itemHeights } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    totalHeight$.pipe(skip(2)).subscribe(val => {
      expect(val).toBe(5050)
      done()
    })

    itemHeights([{ start: 0, end: 0, size: 50 }])
    footerHeight(50)
  })

  it('recalculates total when item height changes', done => {
    const { totalHeight$, itemHeights } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    totalHeight$.pipe(skip(2)).subscribe(val => {
      expect(val).toBe(4980)
      done()
    })

    itemHeights([{ start: 0, end: 0, size: 50 }])
    itemHeights([{ start: 0, end: 0, size: 30 }])
  })

  it('emits a single item when the size is unknown', done => {
    const { viewportHeight, list$ } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    list$.pipe().subscribe(items => {
      expect(items).toHaveLength(1)
      done()
    })

    viewportHeight(230)
  })

  it('fills in the space with enough items', done => {
    const { itemHeights, viewportHeight, list$ } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    list$.pipe().subscribe(items => {
      expect(items).toHaveLength(5)
      done()
    })

    viewportHeight(230)
    itemHeights([{ start: 0, end: 0, size: 50 }])
  })

  it('provides exact items for a given size', done => {
    const { itemHeights, viewportHeight, list$ } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    viewportHeight(250)

    list$.pipe().subscribe(items => {
      expect(items).toHaveLength(5)
      done()
    })

    itemHeights([{ start: 0, end: 0, size: 50 }])
  })

  it('moves to the correct window', done => {
    const { itemHeights, viewportHeight, list$, scrollTop } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    viewportHeight(250)
    scrollTop(120)

    list$.pipe().subscribe(items => {
      expect(items[0].index).toEqual(2)
      expect(items).toHaveLength(6)
      done()
    })

    itemHeights([{ start: 0, end: 0, size: 50 }])
  })

  it('fills in the overscan', done => {
    const { itemHeights, viewportHeight, list$, scrollTop } = VirtuosoStore({ overscan: 25, totalCount: 100 })

    viewportHeight(250)
    scrollTop(120)

    list$.pipe().subscribe(items => {
      expect(items[0].index).toEqual(2)
      expect(items).toHaveLength(7)
      done()
    })
    itemHeights([{ start: 0, end: 0, size: 50 }])
  })

  it('skips the fixed items', done => {
    const { topItemCount, itemHeights, viewportHeight, list$ } = VirtuosoStore({ overscan: 0, totalCount: 100 })

    topItemCount(3)
    viewportHeight(250)

    list$.pipe().subscribe(items => {
      expect(items[0].index).toEqual(3)
      expect(items).toHaveLength(2)
      done()
    })
    itemHeights([{ start: 0, end: 0, size: 50 }])
  })

  /*
  it('calculates the total count from given groups count', () => {
    const { groupCounts, totalHeight$ } = VirtuosoStore({
      overscan: 0,
    })

    groupCounts([10, 10, 10, 10])
    const subscription = totalCount$.subscribe(val => expect(val).toEqual(44))
    subscription.unsubscribe()

    groupCounts([10, 10, 10, 10, 10, 10])
    totalHeight$.subscribe(val => expect(val).toEqual(66))
  })
  */

  it('picks the sticky items', done => {
    const { topList$, groupCounts, itemHeights, viewportHeight, list$ } = VirtuosoStore({
      overscan: 0,
    })

    groupCounts([10, 90, 100])
    viewportHeight(250)
    itemHeights([{ start: 0, end: 0, size: 50 }])
    itemHeights([{ start: 1, end: 1, size: 50 }])

    topList$.subscribe(topItems => {
      expect(topItems).toHaveLength(1)
      expect(topItems[0]).toMatchObject({ index: 0, size: 50, offset: NaN })
    })

    list$.pipe().subscribe(items => {
      expect(items[0].index).toEqual(1)
      expect(items).toHaveLength(4)
      done()
    })
  })

  it('selects the closest sticky item', done => {
    const { topList$, groupCounts, scrollTop, itemHeights, viewportHeight } = VirtuosoStore({
      overscan: 0,
      totalCount: 100,
    })

    groupCounts([10, 90, 100])
    viewportHeight(250)
    itemHeights([{ start: 0, end: 0, size: 50 }])
    itemHeights([{ start: 1, end: 1, size: 50 }])
    scrollTop(2000) // should scroll past the first item, into the second

    topList$.subscribe(topItems => {
      expect(topItems).toHaveLength(1)
      expect(topItems[0]).toMatchObject({ index: 11, size: 50, offset: NaN })
      done()
    })
  })
})
