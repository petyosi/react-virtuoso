import { VirtuosoStore } from '../src/VirtuosoStore'
import { skip, take } from 'rxjs/operators'

describe('Virtuoso Store', () => {
  it('calculates the total height of the list', done => {
    const { totalHeight$, itemHeights$ } = VirtuosoStore(0, 100)

    totalHeight$.pipe(take(1)).subscribe(val => {
      expect(val).toBe(0)
    })

    totalHeight$.pipe(skip(1)).subscribe(val => {
      expect(val).toBe(5000)
      done()
    })

    itemHeights$.next({ index: 0, size: 50 })
  })

  it('leaves space for the footer', done => {
    const { totalHeight$, footerHeight$, itemHeights$ } = VirtuosoStore(0, 100)

    totalHeight$.pipe(skip(2)).subscribe(val => {
      expect(val).toBe(5050)
      done()
    })

    itemHeights$.next({ index: 0, size: 50 })
    footerHeight$.next(50)
  })

  it('recalculates total when item height changes', done => {
    const { totalHeight$, itemHeights$ } = VirtuosoStore(0, 100)

    totalHeight$.pipe(skip(2)).subscribe(val => {
      expect(val).toBe(4980)
      done()
    })

    itemHeights$.next({ index: 0, size: 50 })
    itemHeights$.next({ index: 0, size: 30 })
  })

  it('emits a single item when the size is unknown', done => {
    const { viewportHeight$, list$ } = VirtuosoStore(0, 100)

    list$.pipe().subscribe(items => {
      expect(items).toHaveLength(1)
      done()
    })

    viewportHeight$.next(230)
  })

  it('fills in the space with enough items', done => {
    const { itemHeights$, viewportHeight$, list$ } = VirtuosoStore(0, 100)

    list$.pipe().subscribe(items => {
      expect(items).toHaveLength(5)
      done()
    })

    viewportHeight$.next(230)
    itemHeights$.next({ index: 0, size: 50 })
  })

  it('provides exact items for a given size', done => {
    const { itemHeights$, viewportHeight$, list$ } = VirtuosoStore(0, 100)

    viewportHeight$.next(250)

    list$.pipe().subscribe(items => {
      expect(items).toHaveLength(5)
      done()
    })

    itemHeights$.next({ index: 0, size: 50 })
  })

  it('moves to the correct window', done => {
    const { itemHeights$, viewportHeight$, list$, scrollTop$ } = VirtuosoStore(0, 100)

    viewportHeight$.next(250)
    scrollTop$.next(120)

    list$.pipe().subscribe(items => {
      expect(items[0].index).toEqual(2)
      expect(items).toHaveLength(6)
      done()
    })

    itemHeights$.next({ index: 0, size: 50 })
  })

  it('fills in the overscan', done => {
    const { itemHeights$, viewportHeight$, list$, scrollTop$ } = VirtuosoStore(25, 100)

    viewportHeight$.next(250)
    scrollTop$.next(120)

    list$.pipe().subscribe(items => {
      expect(items[0].index).toEqual(2)
      expect(items).toHaveLength(7)
      done()
    })
    itemHeights$.next({ index: 0, size: 50 })
  })

  it('skips the fixed items', done => {
    const { itemHeights$, viewportHeight$, list$ } = VirtuosoStore(0, 100, 3)

    viewportHeight$.next(250)
    // scrollTop$.next(120);

    list$.pipe().subscribe(items => {
      expect(items[0].index).toEqual(3)
      expect(items).toHaveLength(2)
      done()
    })
    itemHeights$.next({ index: 0, size: 50 })
  })
})
