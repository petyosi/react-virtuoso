import { describe, expect, it, vi } from 'vitest'

import { gridSystem, itemsPerRow } from '../src/gridSystem'
import { getValue, init, publish, subscribe } from '../src/urx'

describe('grid system', () => {
  it('outputs a single probe item once totalCount is set', () => {
    const { gridState, scrollTop, totalCount, viewportDimensions } = init(gridSystem)
    expect(getValue(gridState).items).toHaveLength(0)
    publish(totalCount, 200)
    publish(scrollTop, 0)
    publish(viewportDimensions, {
      height: 200,
      width: 300,
    })
    expect(getValue(gridState).items).toHaveLength(1)
  })

  it('outputs enough items to fill in the screen', () => {
    const { gridState, itemDimensions, scrollTop, totalCount, viewportDimensions } = init(gridSystem)

    publish(totalCount, 2000)

    publish(viewportDimensions, {
      height: 500,
      width: 1000,
    })

    publish(scrollTop, 0)

    expect(getValue(gridState).items).toHaveLength(1)

    publish(viewportDimensions, {
      height: 500,
      width: 1000,
    })

    publish(itemDimensions, {
      height: 200,
      width: 300,
    })

    const itemCount = Math.floor(1000 / 300) * Math.ceil(500 / 200)

    expect(getValue(gridState).items).toHaveLength(itemCount)

    publish(viewportDimensions, {
      height: 500,
      width: 2000,
    })

    const newItemCount = Math.floor(2000 / 300) * Math.ceil(500 / 200)

    expect(getValue(gridState).items).toHaveLength(newItemCount)
  })

  it('reuses currently rendered items if possible', () => {
    const { gridState, itemDimensions, scrollTop, totalCount, viewportDimensions } = init(gridSystem)

    publish(totalCount, 2000)

    publish(viewportDimensions, {
      height: 500,
      width: 1000,
    })

    publish(scrollTop, 0)

    expect(getValue(gridState).items).toHaveLength(1)

    publish(viewportDimensions, {
      height: 500,
      width: 1000,
    })

    publish(itemDimensions, {
      height: 200,
      width: 300,
    })

    const sub = vi.fn()
    subscribe(gridState, sub)

    publish(scrollTop, 50)
    expect(sub).toHaveBeenCalledTimes(1)
  })

  it('offsets the item list when scrolling', () => {
    const { gridState, itemDimensions, scrollTop, totalCount, viewportDimensions } = init(gridSystem)

    publish(totalCount, 2000)

    publish(viewportDimensions, {
      height: 500,
      width: 1000,
    })

    publish(scrollTop, 0)

    publish(viewportDimensions, {
      height: 500,
      width: 1000,
    })

    publish(itemDimensions, {
      height: 200,
      width: 300,
    })

    publish(scrollTop, 300)
    expect(getValue(gridState).items[0]).toMatchObject({ index: 3 })
  })

  it('calculates the offsets correctly', () => {
    const { gridState, itemDimensions, scrollTop, totalCount, viewportDimensions } = init(gridSystem)

    publish(totalCount, 2000)

    publish(viewportDimensions, {
      height: 500,
      width: 1000,
    })

    publish(scrollTop, 0)

    publish(viewportDimensions, {
      height: 500,
      width: 1000,
    })

    publish(itemDimensions, {
      height: 200,
      width: 300,
    })

    publish(scrollTop, 300)

    const rows = Math.ceil(2000 / 3)
    const totalHeight = rows * 200
    const listHeight = 3 * 200
    expect(getValue(gridState)).toMatchObject({
      offsetBottom: totalHeight - 200 - listHeight,
      offsetTop: 200,
    })
  })

  it('does not overflow past the last item', () => {
    const { gridState, itemDimensions, overscan, scrollTop, totalCount, viewportDimensions } = init(gridSystem)
    publish(overscan, 4)
    publish(totalCount, 39)
    publish(viewportDimensions, {
      height: 6,
      width: 9,
    })

    publish(itemDimensions, {
      height: 2,
      width: 3,
    })
    publish(scrollTop, 20)
    const items = getValue(gridState).items
    expect(items[0]!.index).toBe(30)
    expect(items[items.length - 1]!.index).toBe(38)
  })

  it('does not overflow past the first item', () => {
    const { gridState, itemDimensions, overscan, scrollTop, totalCount, viewportDimensions } = init(gridSystem)
    publish(scrollTop, 0)
    publish(overscan, 2)
    publish(totalCount, 30)
    publish(viewportDimensions, {
      height: 5,
      width: 10,
    })
    publish(itemDimensions, {
      height: 2,
      width: 3,
    })
    const sub = vi.fn()
    subscribe(gridState, sub)
    publish(scrollTop, 8)
    publish(scrollTop, 2)
    const items = getValue(gridState).items
    expect(items[0]!.index).toBe(0)
    expect(items[items.length - 1]!.index).toBe(11)
  })

  it('correctly calculates items per row', () => {
    const { gap, gridState, itemDimensions, scrollTop, totalCount, viewportDimensions } = init(gridSystem)

    publish(totalCount, 2000)

    publish(scrollTop, 0)

    publish(gap, {
      column: 5,
      row: 5,
    })

    // Experimentally-determined values that create a rounding error

    publish(viewportDimensions, {
      height: 335,
      width: 335,
    })

    publish(itemDimensions, {
      height: 80,
      width: 108.33333587646484,
    })

    expect(itemsPerRow(getValue(viewportDimensions).width, getValue(itemDimensions).width, getValue(gap).column)).toBe(3)
    expect(getValue(gridState).items).toHaveLength(12)

    publish(viewportDimensions, {
      height: 505,
      width: 405,
    })

    publish(itemDimensions, {
      height: 80,
      width: 131.6666717529297,
    })

    expect(itemsPerRow(getValue(viewportDimensions).width, getValue(itemDimensions).width, getValue(gap).column)).toBe(3)
    expect(getValue(gridState).items).toHaveLength(18)

    publish(viewportDimensions, {
      height: 770,
      width: 653,
    })

    publish(itemDimensions, {
      height: 150,
      width: 104.66667175292969,
    })

    expect(itemsPerRow(getValue(viewportDimensions).width, getValue(itemDimensions).width, getValue(gap).column)).toBe(6)
    expect(getValue(gridState).items).toHaveLength(30)
  })
})

describe('grid endReached', () => {
  const items = (length: number, prefix: string) => Array.from({ length }, (_, index) => ({ id: `${prefix}${index}` }))

  // 10 items per row, two 100px rows visible, so 20 items fill the viewport exactly.
  function setup(initialData: unknown[], { scrolled = false } = {}) {
    const system = init(gridSystem)
    const calls: number[] = []
    subscribe(system.endReached, (index) => calls.push(index))
    publish(system.data, initialData)
    publish(system.viewportDimensions, { height: 200, width: 1000 })
    publish(system.scrollTop, 0)
    publish(system.itemDimensions, { height: 100, width: 100 })
    if (scrolled) {
      publish(system.scrollTop, 1)
      publish(system.scrollTop, 0)
    }
    return { calls, system }
  }

  it('fires again when the data is replaced with the same length', () => {
    const { calls, system } = setup(items(20, 'a'))
    expect(calls).toEqual([19])
    publish(system.data, items(20, 'b'))
    expect(calls).toEqual([19, 19])
  })

  it('fires again when a new array keeps the same items', () => {
    const { calls, system } = setup(items(20, 'a'))
    publish(system.data, [...(getValue(system.data) as unknown[])])
    expect(calls).toEqual([19, 19])
  })

  it('does not fire again when the same data is republished', () => {
    const { calls, system } = setup(items(20, 'a'))
    publish(system.data, getValue(system.data))
    expect(calls).toEqual([19])
  })

  it('reports only the new end index when the data shrinks', () => {
    const { calls, system } = setup(items(20, 'a'), { scrolled: true })
    publish(system.data, items(10, 'b'))
    expect(calls).toEqual([19, 9])
  })

  it('does not report the previous end again when more data is loaded', () => {
    const { calls, system } = setup(items(20, 'a'), { scrolled: true })
    publish(system.data, [...(getValue(system.data) as unknown[]), ...items(20, 'b')])
    expect(calls).toEqual([19])
  })

  it('does not report the previous end again when loaded data has fresh items', () => {
    const { calls, system } = setup(items(20, 'a'), { scrolled: true })
    publish(system.data, items(40, 'a'))
    expect(calls).toEqual([19])
  })

  it('fires once per totalCount when no data is provided', () => {
    const system = init(gridSystem)
    const calls: number[] = []
    subscribe(system.endReached, (index) => calls.push(index))
    publish(system.totalCount, 20)
    publish(system.viewportDimensions, { height: 200, width: 1000 })
    publish(system.scrollTop, 0)
    publish(system.itemDimensions, { height: 100, width: 100 })
    publish(system.totalCount, 20)
    expect(calls).toEqual([19])
  })
})
