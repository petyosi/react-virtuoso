import { GridVirtuosoEngine } from '../src/GridVirtuosoEngine'

describe('Grid Virtuoso Engine', () => {
  it('outputs a single probe item initially', () => {
    const { itemRange, gridDimensions } = GridVirtuosoEngine()

    const itemRangeCallback = jest.fn()

    gridDimensions([1000, 500, undefined, undefined])

    itemRange(itemRangeCallback)
    expect(itemRangeCallback).toHaveBeenCalledWith([0, 0])
  })

  it('outputs enough items to fill in the screen', () => {
    const { itemRange, gridDimensions, totalCount } = GridVirtuosoEngine()

    totalCount(2000)
    gridDimensions([1000, 500, 300, 200])

    const itemCount = Math.floor(1000 / 300) * Math.ceil(500 / 200)

    const itemRangeCallback = jest.fn()
    itemRange(itemRangeCallback)

    expect(itemRangeCallback).toHaveBeenCalledWith([0, itemCount - 1])
  })

  it('reuses currently rendered items if possible', () => {
    const { totalCount, itemRange, gridDimensions, scrollTop } = GridVirtuosoEngine()

    totalCount(2000)
    gridDimensions([1000, 500, 300, 200])
    const itemRangeCallback = jest.fn()
    itemRange(itemRangeCallback)

    scrollTop(50)

    expect(itemRangeCallback).toHaveBeenCalledWith([0, 8])
    expect(itemRangeCallback).toHaveBeenCalledTimes(1)
  })

  it('offsets the range when scrolling', () => {
    const { totalCount, itemRange, gridDimensions, scrollTop } = GridVirtuosoEngine()

    totalCount(2000)
    gridDimensions([1000, 500, 300, 200])
    scrollTop(300)

    const itemCount = Math.floor(1000 / 300) * Math.ceil(500 / 200)

    const itemRangeCallback = jest.fn()
    itemRange(itemRangeCallback)

    expect(itemRangeCallback).toHaveBeenCalledWith([3, itemCount - 1 + 3])
  })

  it('calculates the total height', () => {
    const { totalCount, gridDimensions, totalHeight } = GridVirtuosoEngine()
    gridDimensions([10, 5, 3, 2])
    totalCount(20)
    const totalHeightCallback = jest.fn()
    totalHeight(totalHeightCallback)

    expect(totalHeightCallback).toHaveBeenCalledWith(14)
  })

  it('takes overscan into account', () => {
    const { totalCount, itemRange, gridDimensions, overscan } = GridVirtuosoEngine()

    totalCount(2000)
    gridDimensions([1000, 500, 300, 200])
    const OVERSCAN = 200
    overscan(OVERSCAN)

    const itemCount = Math.floor(1000 / 300) * Math.ceil((500 + OVERSCAN * 2) / 200)

    const itemRangeCallback = jest.fn()
    itemRange(itemRangeCallback)

    expect(itemRangeCallback).toHaveBeenCalledWith([0, itemCount - 1])
  })

  it('does not overflow from the total and the first item', () => {})

  it('does not overflow past the last item', () => {
    const { scrollTop, totalCount, gridDimensions, itemRange, overscan } = GridVirtuosoEngine()
    gridDimensions([10, 5, 3, 2])
    overscan(5)
    totalCount(20)
    scrollTop(4)
    const itemRangeCallback = jest.fn()
    itemRange(itemRangeCallback)
    expect(itemRangeCallback).toHaveBeenCalledWith([6, 19])
  })

  it('does not overflow past the first item', () => {
    const { scrollTop, totalCount, gridDimensions, itemRange, overscan } = GridVirtuosoEngine()
    gridDimensions([10, 5, 3, 2])
    overscan(2)
    totalCount(30)
    let call = 0
    const itemRangeCallback = (range: [number, number]) => {
      call++
      if (call == 3) {
        expect(range).toEqual([0, 11])
      }
    }
    itemRange(itemRangeCallback)
    scrollTop(8)
    scrollTop(2)
  })
})
