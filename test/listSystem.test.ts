import { listSystem } from '../src/listSystem'
import { init, getValue, publish, subscribe } from '@virtuoso.dev/urx'

describe('list engine', () => {
  describe('basics', () => {
    it('returns empty rows by default', () => {
      const { listState } = init(listSystem)
      expect(getValue(listState)).toMatchObject({ items: [] })
    })

    it('returns a probe row when location / dimensions are reported', () => {
      const { propsReady, listState, scrollTop, viewportHeight, totalCount } = init(listSystem)
      publish(totalCount, 1000)
      publish(propsReady, true)
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      expect(getValue(listState)).toMatchObject({
        items: [{ index: 0, size: 0, offset: 0 }],
      })
    })

    it('returns the full set if a default item height is set', () => {
      const { defaultItemHeight, propsReady, listState, scrollTop, viewportHeight, totalCount } = init(listSystem)

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
      const { fixedItemHeight, propsReady, listState, scrollTop, viewportHeight, totalCount } = init(listSystem)

      publish(scrollTop, 0)
      publish(totalCount, 1000)
      publish(fixedItemHeight, 30)
      publish(propsReady, true)

      publish(viewportHeight, 200)
      expect(getValue(listState).items).toHaveLength(7)
    })

    it('updates the rows when new sizes are reported', () => {
      const { propsReady, sizeRanges, listState, scrollTop, viewportHeight, totalCount } = init(listSystem)

      const sub = jest.fn()
      subscribe(listState, sub)

      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(totalCount, 1000)
      publish(propsReady, true)

      // probe item is sent
      expect(getValue(listState)).toMatchObject({
        items: [{ index: 0, size: 0, offset: 0 }],
      })
      publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: 30 }])

      // 7 items should be rendered
      expect(getValue(listState).items).toHaveLength(7)

      expect(getValue(listState)).toMatchObject({
        offsetTop: 0,
        offsetBottom: 29790,
      })

      // check if we don't render too much due to streams diamond shapes
      expect(sub).toHaveBeenCalledTimes(3)
    })
  })

  describe('initial index', () => {
    it('starts from a specified location', () => {
      const INITIAL_INDEX = 300
      const SIZE = 30
      const { propsReady, initialTopMostItemIndex, listState, scrollTop, scrollTo, viewportHeight, totalCount, sizeRanges } = init(
        listSystem
      )

      publish(initialTopMostItemIndex, INITIAL_INDEX)
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(totalCount, 1000)
      publish(propsReady, true)
      expect(getValue(listState)).toMatchObject({
        items: [{ index: INITIAL_INDEX, size: 0, offset: 0 }],
      })

      const sub = jest.fn()
      subscribe(scrollTo, sub)

      publish(sizeRanges, [{ startIndex: INITIAL_INDEX, endIndex: INITIAL_INDEX, size: SIZE }])

      expect(getValue(listState).items).toHaveLength(0)

      expect(sub).toHaveBeenCalledWith({
        top: INITIAL_INDEX * SIZE,
        behavior: 'auto',
      })

      // the UI responds by publishing back through the scrollTop stream
      publish(scrollTop, INITIAL_INDEX * SIZE)
      expect(getValue(listState).items).toHaveLength(7)
    })
  })

  describe('scroll to index', () => {
    let sub: any
    let sti: any
    let sr: any

    const INDEX = 300
    const SIZE = 30
    const VIEWPORT = 200
    beforeEach(() => {
      const { propsReady, scrollToIndex, scrollTop, scrollTo, viewportHeight, totalCount, sizeRanges } = init(listSystem)

      sti = scrollToIndex
      sr = sizeRanges
      publish(scrollTop, 0)
      publish(viewportHeight, VIEWPORT)
      publish(totalCount, 1000)

      sub = jest.fn()
      subscribe(scrollTo, sub)

      publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: SIZE }])
      publish(scrollToIndex, INDEX)
      publish(propsReady, true)

      expect(sub).toHaveBeenCalledWith({
        top: INDEX * SIZE,
        behavior: 'auto',
      })
    })

    it('navigates to index', () => {
      publish(sti, INDEX)

      expect(sub).toHaveBeenCalledWith({
        top: INDEX * SIZE,
        behavior: 'auto',
      })
    })

    it('navigates to index with center', () => {
      publish(sti, { index: INDEX, align: 'center' })

      expect(sub).toHaveBeenCalledWith({
        top: INDEX * SIZE - VIEWPORT / 2 + SIZE / 2,
        behavior: 'auto',
      })
    })

    it('navigates to index with end', () => {
      publish(sti, { index: INDEX, align: 'end' })

      expect(sub).toHaveBeenCalledWith({
        top: INDEX * SIZE - VIEWPORT + SIZE,
        behavior: 'auto',
      })
    })

    it('readjusts once when new sizes are reported', () => {
      const DEVIATION = 20
      publish(sti, { index: INDEX, align: 'end' })

      expect(sub).toHaveBeenCalledWith({
        top: INDEX * SIZE - VIEWPORT + SIZE,
        behavior: 'auto',
      })

      publish(sr, [{ startIndex: INDEX - 1, endIndex: INDEX - 1, size: SIZE + DEVIATION }])

      expect(sub).toHaveBeenCalledWith({
        top: INDEX * SIZE - VIEWPORT + SIZE + DEVIATION,
        behavior: 'auto',
      })
    })
  })

  describe('scrolling up after a jump', () => {
    it.only('readjusts measurements to avoid jump', (done) => {
      const INITIAL_INDEX = 300
      const SIZE = 30
      const {
        propsReady,
        initialTopMostItemIndex,
        listState,
        scrollTop,
        scrollTo,
        viewportHeight,
        totalCount,
        sizeRanges,
        deviation,
      } = init(listSystem)

      publish(initialTopMostItemIndex, INITIAL_INDEX)
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(totalCount, 1000)
      publish(propsReady, true)
      expect(getValue(listState)).toMatchObject({
        items: [{ index: INITIAL_INDEX, size: 0, offset: 0 }],
      })

      const sub = jest.fn()
      subscribe(scrollTo, sub)

      const scrollBySub = jest.fn()
      subscribe(deviation, scrollBySub)

      publish(sizeRanges, [{ startIndex: INITIAL_INDEX, endIndex: INITIAL_INDEX, size: SIZE }])

      expect(getValue(listState).items).toHaveLength(0)

      expect(sub).toHaveBeenCalledWith({
        top: INITIAL_INDEX * SIZE,
        behavior: 'auto',
      })

      setTimeout(() => {
        publish(scrollTop, INITIAL_INDEX * SIZE)

        publish(scrollTop, INITIAL_INDEX * SIZE - 2)

        publish(sizeRanges, [
          {
            startIndex: INITIAL_INDEX - 1,
            endIndex: INITIAL_INDEX - 1,
            size: SIZE + 40,
          },
        ])

        expect(scrollBySub).toHaveBeenCalledWith(-40)
        done()
      }, 2500)
    })
  })

  describe('top items', () => {
    it('puts the top list items in topItems', () => {
      const { propsReady, listState, topItemsIndexes, scrollTop, viewportHeight, totalCount, sizeRanges } = init(listSystem)
      publish(topItemsIndexes, [0, 1, 2])
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(totalCount, 1000)
      publish(propsReady, true)

      expect(getValue(listState)).toMatchObject({
        topItems: [],
        items: [{ index: 0, size: 0, offset: 0 }],
      })

      publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: 30 }])

      // 4 items should be rendered
      expect(getValue(listState).items).toHaveLength(4)
      expect(getValue(listState)).toMatchObject({
        topListHeight: 90,
        topItems: [
          { index: 0, size: 30, offset: 0 },
          { index: 1, size: 30, offset: 30 },
          { index: 2, size: 30, offset: 60 },
        ],
      })

      expect(getValue(listState)).toMatchObject({
        offsetTop: 90,
        offsetBottom: 29790,
      })
    })
  })

  describe('grouped mode', () => {
    it('creates total count from groupCounts', () => {
      const { totalCount, groupCounts } = init(listSystem)
      const sub = jest.fn()
      subscribe(totalCount, sub)
      publish(groupCounts, [10, 10, 10])
      expect(sub).toHaveBeenCalledWith(33)
    })

    it('probes with a group item / item tuple', () => {
      const { propsReady, scrollTop, viewportHeight, listState, groupCounts } = init(listSystem)
      publish(groupCounts, [10, 10, 10])
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(propsReady, true)

      expect(getValue(listState)).toMatchObject({
        items: [
          { type: 'group', index: 0, size: 0, offset: 0 },
          { index: 0, groupIndex: 0, size: 0, offset: 0 },
        ],
      })
    })

    it('probes with a correct group item / item tuple for initialTopMostItemIndex ', () => {
      const { propsReady, initialTopMostItemIndex, scrollTop, viewportHeight, listState, groupCounts } = init(listSystem)
      publish(initialTopMostItemIndex, 22)
      publish(groupCounts, [10, 10, 10])
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(propsReady, true)

      expect(getValue(listState)).toMatchObject({
        items: [
          { type: 'group', index: 2, size: 0, offset: 0 },
          { index: 22, groupIndex: 2, size: 0, offset: 0 },
        ],
      })
    })

    it('renders groups and items', () => {
      const { propsReady, sizeRanges, scrollTop, viewportHeight, listState, groupCounts } = init(listSystem)
      publish(groupCounts, [3, 3, 3, 10])
      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(propsReady, true)

      publish(sizeRanges, [
        { startIndex: 0, endIndex: 0, size: 30 },
        { startIndex: 1, endIndex: 5, size: 20 },
      ])

      expect(getValue(listState)).toMatchObject({
        topItems: [{ type: 'group', index: 0, size: 30, offset: 0 }],
        topListHeight: 30,
      })

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
    })

    it('takes header height into account', () => {
      const { propsReady, sizeRanges, scrollTop, headerHeight, viewportHeight, listState, groupCounts } = init(listSystem)
      publish(
        groupCounts,
        Array.from({ length: 20 }, () => 3)
      )
      publish(scrollTop, 0)
      publish(viewportHeight, 300)
      publish(propsReady, true)

      publish(sizeRanges, [
        { startIndex: 0, endIndex: 0, size: 30 },
        { startIndex: 1, endIndex: 3, size: 20 },
      ])

      publish(headerHeight, 80)

      expect(getValue(listState)).toMatchObject({
        topItems: [{ type: 'group', index: 0, size: 30, offset: 0 }],
        topListHeight: 30,
      })

      publish(scrollTop, 90)

      expect(getValue(listState)).toMatchObject({
        topItems: [{ type: 'group', index: 0, size: 30, offset: 0 }],
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
      const { propsReady, headerHeight, sizeRanges, listState, scrollTop, viewportHeight, totalCount } = init(listSystem)

      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(totalCount, 1000)
      publish(headerHeight, 50)
      publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: 30 }])
      publish(propsReady, true)

      // 7 items should be rendered
      expect(getValue(listState).items).toHaveLength(5)
    })
  })

  describe('total height changed', () => {
    it('includes the header and the total list height', () => {
      const {
        propsReady,
        footerHeight,
        headerHeight,
        sizeRanges,
        listState,
        scrollTop,
        viewportHeight,
        totalCount,
        totalListHeightChanged,
      } = init(listSystem)

      publish(scrollTop, 0)
      publish(viewportHeight, 200)
      publish(totalCount, 1000)
      publish(headerHeight, 50)
      publish(footerHeight, 40)
      publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: 30 }])
      const sub = jest.fn()
      subscribe(totalListHeightChanged, sub)
      publish(propsReady, true)

      expect(sub).toHaveBeenCalledWith(50 + 40 + 1000 * 30)
      // 7 items should be rendered
      expect(getValue(listState).items).toHaveLength(5)
    })
  })

  describe('align to bottom', () => {
    it('pads the top with the difference of the viewport and the list size', () => {
      const { propsReady, paddingTopAddition, alignToBottom, sizeRanges, scrollTop, viewportHeight, totalCount } = init(listSystem)

      publish(alignToBottom, true)
      publish(scrollTop, 0)
      publish(viewportHeight, 1200)
      publish(totalCount, 5)
      publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: 30 }])
      const sub = jest.fn()
      subscribe(paddingTopAddition, sub)
      publish(propsReady, true)
      expect(sub).toHaveBeenCalledWith(1200 - 5 * 30)
      publish(viewportHeight, 1100)
      expect(sub).toHaveBeenCalledWith(1100 - 5 * 30)
    })
  })
})
