import { init, getValue, publish, subscribe } from '../src/urx'
import { gridSystem } from '../src/gridSystem'
import { describe, it, expect, vi } from 'vitest'

describe('grid system', () => {
  it('outputs a single probe item once totalCount is set', () => {
    const { scrollTop, viewportDimensions, gridState, totalCount } = init(gridSystem)
    expect(getValue(gridState).items).toHaveLength(0)
    publish(totalCount, 200)
    publish(scrollTop, 0)
    publish(viewportDimensions, {
      width: 300,
      height: 200,
    })
    expect(getValue(gridState).items).toHaveLength(1)
  })

  it('outputs enough items to fill in the screen', () => {
    const { itemDimensions, scrollTop, viewportDimensions, gridState, totalCount } = init(gridSystem)

    publish(totalCount, 2000)

    publish(viewportDimensions, {
      width: 1000,
      height: 500,
    })

    publish(scrollTop, 0)

    expect(getValue(gridState).items).toHaveLength(1)

    publish(viewportDimensions, {
      width: 1000,
      height: 500,
    })

    publish(itemDimensions, {
      width: 300,
      height: 200,
    })

    const itemCount = Math.floor(1000 / 300) * Math.ceil(500 / 200)

    expect(getValue(gridState).items).toHaveLength(itemCount)
  })

  it('reuses currently rendered items if possible', () => {
    const { scrollTop, itemDimensions, viewportDimensions, gridState, totalCount } = init(gridSystem)

    publish(totalCount, 2000)

    publish(viewportDimensions, {
      width: 1000,
      height: 500,
    })

    publish(scrollTop, 0)

    expect(getValue(gridState).items).toHaveLength(1)

    publish(viewportDimensions, {
      width: 1000,
      height: 500,
    })

    publish(itemDimensions, {
      width: 300,
      height: 200,
    })

    const sub = vi.fn()
    subscribe(gridState, sub)

    publish(scrollTop, 50)
    expect(sub).toHaveBeenCalledTimes(1)
  })

  it('offsets the item list when scrolling', () => {
    const { scrollTop, itemDimensions, viewportDimensions, gridState, totalCount } = init(gridSystem)

    publish(totalCount, 2000)

    publish(viewportDimensions, {
      width: 1000,
      height: 500,
    })

    publish(scrollTop, 0)

    publish(viewportDimensions, {
      width: 1000,
      height: 500,
    })

    publish(itemDimensions, {
      width: 300,
      height: 200,
    })

    publish(scrollTop, 300)
    expect(getValue(gridState).items[0]).toMatchObject({ index: 3 })
  })

  it('calculates the offsets correctly', () => {
    const { itemDimensions, scrollTop, viewportDimensions, gridState, totalCount } = init(gridSystem)

    publish(totalCount, 2000)

    publish(viewportDimensions, {
      width: 1000,
      height: 500,
    })

    publish(scrollTop, 0)

    publish(viewportDimensions, {
      width: 1000,
      height: 500,
    })

    publish(itemDimensions, {
      width: 300,
      height: 200,
    })

    publish(scrollTop, 300)

    const rows = Math.ceil(2000 / 3)
    const totalHeight = rows * 200
    const listHeight = 3 * 200
    expect(getValue(gridState)).toMatchObject({
      offsetTop: 200,
      offsetBottom: totalHeight - 200 - listHeight,
    })
  })

  it('does not overflow past the last item', () => {
    const { itemDimensions, scrollTop, totalCount, viewportDimensions, gridState, overscan } = init(gridSystem)
    publish(overscan, 4)
    publish(totalCount, 39)
    publish(viewportDimensions, {
      width: 9,
      height: 6,
    })

    publish(itemDimensions, {
      width: 3,
      height: 2,
    })
    publish(scrollTop, 20)
    const items = getValue(gridState).items
    expect(items[0].index).toBe(30)
    expect(items[items.length - 1].index).toBe(38)
  })

  it('does not overflow past the first item', () => {
    const { scrollTop, totalCount, itemDimensions, viewportDimensions, gridState, overscan } = init(gridSystem)
    publish(scrollTop, 0)
    publish(overscan, 2)
    publish(totalCount, 30)
    publish(viewportDimensions, {
      width: 10,
      height: 5,
    })
    publish(itemDimensions, {
      width: 3,
      height: 2,
    })
    const sub = vi.fn()
    subscribe(gridState, sub)
    publish(scrollTop, 8)
    publish(scrollTop, 2)
    const items = getValue(gridState).items
    expect(items[0].index).toBe(0)
    expect(items[items.length - 1].index).toBe(11)
  })
})
