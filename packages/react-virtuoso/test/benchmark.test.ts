import { describe, expect, it } from 'vitest'

import { listSystem } from '../src/listSystem'
import { sizeSystem } from '../src/sizeSystem'
import { gridSystem } from '../src/gridSystem'
import { getValue, init, publish } from '../src/urx'

describe('React Virtuoso Benchmarks', () => {
  // Standard benchmark parameters
  const ITEM_COUNT = 10000
  const ITEM_SIZE = 35
  const RUNS_PER_BENCHMARK = 5

  // Helper function to log benchmark results
  function logBenchmarkResults(name: string, results: number[]) {
    const average = results.reduce((a, b) => a + b, 0) / results.length
    const min = Math.min(...results)
    const max = Math.max(...results)

    // eslint-disable-next-line no-console
    console.log(`${name}:`)
    // eslint-disable-next-line no-console
    console.log(`  Average: ${average.toFixed(4)}ms`)
    // eslint-disable-next-line no-console
    console.log(`  Min: ${min.toFixed(4)}ms`)
    // eslint-disable-next-line no-console
    console.log(`  Max: ${max.toFixed(4)}ms`)
    // eslint-disable-next-line no-console
    console.log(`  Runs: ${RUNS_PER_BENCHMARK}`)

    return { average, min, max }
  }

  describe('Size System Performance', () => {
    it('measures sequential size range insertion performance', () => {
      const results: number[] = []

      for (let run = 0; run < RUNS_PER_BENCHMARK; run++) {
        const t0 = performance.now()
        const { sizeRanges, totalCount } = init(sizeSystem)

        publish(totalCount, ITEM_COUNT)

        // Simulate setting initial size for all items
        publish(sizeRanges, [{ startIndex: 0, endIndex: ITEM_COUNT - 1, size: ITEM_SIZE }])

        const t1 = performance.now()
        results.push(t1 - t0)
      }

      const { average } = logBenchmarkResults(`Sequential size range insertion (${ITEM_COUNT} items, ${ITEM_SIZE}px)`, results)

      // Ensure it completes reasonably fast (should be under 100ms for 10k items)
      expect(average).toBeLessThan(100)
    })

    it('measures random size updates performance', () => {
      const results: number[] = []

      for (let run = 0; run < RUNS_PER_BENCHMARK; run++) {
        const { sizeRanges, totalCount } = init(sizeSystem)
        publish(totalCount, ITEM_COUNT)
        publish(sizeRanges, [{ startIndex: 0, endIndex: ITEM_COUNT - 1, size: ITEM_SIZE }])

        const t0 = performance.now()

        // Simulate random size updates (common in dynamic content)
        const updateCount = Math.floor(ITEM_COUNT * 0.1) // 10% of items
        for (let i = 0; i < updateCount; i++) {
          const randomIndex = Math.floor(Math.random() * ITEM_COUNT)
          const randomSize = ITEM_SIZE + Math.floor(Math.random() * 50) // 35-85px
          publish(sizeRanges, [{ startIndex: randomIndex, endIndex: randomIndex, size: randomSize }])
        }

        const t1 = performance.now()
        results.push(t1 - t0)
      }

      const { average } = logBenchmarkResults(`Random size updates (${Math.floor(ITEM_COUNT * 0.1)} updates)`, results)

      // Should handle 1000 random updates reasonably fast
      expect(average).toBeLessThan(200)
    })

    it('measures jagged list performance', () => {
      const results: number[] = []

      for (let run = 0; run < RUNS_PER_BENCHMARK; run++) {
        const t0 = performance.now()
        const { sizeRanges, totalCount } = init(sizeSystem)

        publish(totalCount, ITEM_COUNT)
        publish(sizeRanges, [{ startIndex: 0, endIndex: 0, size: ITEM_SIZE * 2 }])

        // Create jagged list with varying sizes every 4th item
        const JAGGED_STEP = 4
        for (let index = 1; index < ITEM_COUNT; index += JAGGED_STEP) {
          const size = index % 8 === 0 ? ITEM_SIZE * 2 : ITEM_SIZE
          publish(sizeRanges, [{ startIndex: index, endIndex: index, size }])
        }

        const t1 = performance.now()
        results.push(t1 - t0)
      }

      const { average } = logBenchmarkResults(`Jagged list creation (${ITEM_COUNT} items, varied sizes)`, results)

      expect(average).toBeLessThan(200)
    })
  })

  describe('List System Performance', () => {
    it('measures initial list rendering performance', () => {
      const results: number[] = []

      for (let run = 0; run < RUNS_PER_BENCHMARK; run++) {
        const t0 = performance.now()
        const { listState, propsReady, scrollTop, totalCount, viewportHeight, defaultItemHeight } = init(listSystem)

        publish(totalCount, ITEM_COUNT)
        publish(defaultItemHeight, ITEM_SIZE)
        publish(propsReady, true)
        publish(scrollTop, 0)
        publish(viewportHeight, 600) // Standard viewport height

        // Get initial list state
        const initialState = getValue(listState)

        const t1 = performance.now()
        results.push(t1 - t0)

        // Ensure we got a reasonable number of items for the viewport
        expect(initialState.items.length).toBeGreaterThan(0)
        expect(initialState.items.length).toBeLessThan(50) // Should not render all items
      }

      const { average } = logBenchmarkResults(`Initial list rendering (${ITEM_COUNT} items)`, results)

      expect(average).toBeLessThan(10)
    })

    it('measures scroll performance simulation', () => {
      const results: number[] = []

      for (let run = 0; run < RUNS_PER_BENCHMARK; run++) {
        const { listState, propsReady, scrollTop, totalCount, viewportHeight, defaultItemHeight } = init(listSystem)

        // Setup
        publish(totalCount, ITEM_COUNT)
        publish(defaultItemHeight, ITEM_SIZE)
        publish(propsReady, true)
        publish(viewportHeight, 600)
        publish(scrollTop, 0)

        const t0 = performance.now()

        // Simulate scrolling through the list
        const scrollSteps = 50
        const maxScroll = (ITEM_COUNT - 1) * ITEM_SIZE
        for (let i = 0; i < scrollSteps; i++) {
          const scrollPosition = (i / scrollSteps) * maxScroll
          publish(scrollTop, scrollPosition)
          getValue(listState) // Force calculation
        }

        const t1 = performance.now()
        results.push(t1 - t0)
      }

      const { average } = logBenchmarkResults('Scroll performance simulation (50 scroll updates)', results)

      expect(average).toBeLessThan(100)
    })
  })

  describe('Grid System Performance', () => {
    it('measures grid initialization performance', () => {
      const results: number[] = []
      const GRID_ITEM_COUNT = ITEM_COUNT

      for (let run = 0; run < RUNS_PER_BENCHMARK; run++) {
        const t0 = performance.now()
        const { gridState, scrollTop, totalCount, viewportDimensions, itemDimensions } = init(gridSystem)

        publish(totalCount, GRID_ITEM_COUNT)
        publish(itemDimensions, {
          height: ITEM_SIZE,
          width: 100,
        })
        publish(viewportDimensions, {
          height: 600,
          width: 500,
        })
        publish(scrollTop, 0)

        const initialState = getValue(gridState)

        const t1 = performance.now()
        results.push(t1 - t0)

        // Verify we got grid items
        expect(initialState.items.length).toBeGreaterThan(0)
      }

      const { average } = logBenchmarkResults(`Grid initialization (${GRID_ITEM_COUNT} items)`, results)

      expect(average).toBeLessThan(20)
    })
  })

  describe('Memory and Scale Tests', () => {
    it('measures large list initialization', () => {
      const LARGE_ITEM_COUNT = 50000 // 5x the standard
      const results: number[] = []

      for (let run = 0; run < RUNS_PER_BENCHMARK; run++) {
        const t0 = performance.now()
        const { sizeRanges, totalCount } = init(sizeSystem)

        publish(totalCount, LARGE_ITEM_COUNT)
        publish(sizeRanges, [{ startIndex: 0, endIndex: LARGE_ITEM_COUNT - 1, size: ITEM_SIZE }])

        const t1 = performance.now()
        results.push(t1 - t0)
      }

      const { average } = logBenchmarkResults(`Large list initialization (${LARGE_ITEM_COUNT} items)`, results)

      // Should scale reasonably with 5x more items
      expect(average).toBeLessThan(500)
    })

    it('measures tiny item performance', () => {
      const TINY_ITEM_SIZE = 10 // Much smaller than standard 35px
      const results: number[] = []

      for (let run = 0; run < RUNS_PER_BENCHMARK; run++) {
        const t0 = performance.now()
        const { listState, propsReady, scrollTop, totalCount, viewportHeight, defaultItemHeight } = init(listSystem)

        publish(totalCount, ITEM_COUNT)
        publish(defaultItemHeight, TINY_ITEM_SIZE)
        publish(propsReady, true)
        publish(scrollTop, 0)
        publish(viewportHeight, 600)

        const initialState = getValue(listState)

        const t1 = performance.now()
        results.push(t1 - t0)

        // With tiny items, we should render more items in viewport
        expect(initialState.items.length).toBeGreaterThan(15)
      }

      const { average } = logBenchmarkResults(`Tiny item performance (${TINY_ITEM_SIZE}px items)`, results)

      expect(average).toBeLessThan(15)
    })
  })

  describe('Stress Tests', () => {
    it('measures frequent size changes performance', () => {
      const results: number[] = []

      for (let run = 0; run < RUNS_PER_BENCHMARK; run++) {
        const { sizeRanges, totalCount } = init(sizeSystem)
        publish(totalCount, ITEM_COUNT)
        publish(sizeRanges, [{ startIndex: 0, endIndex: ITEM_COUNT - 1, size: ITEM_SIZE }])

        const t0 = performance.now()

        // Simulate frequent size changes (like dynamic content loading)
        const changeCount = 500
        for (let i = 0; i < changeCount; i++) {
          const randomIndex = Math.floor(Math.random() * ITEM_COUNT)
          const newSize = ITEM_SIZE + (i % 20) // Vary between 35-55px
          publish(sizeRanges, [{ startIndex: randomIndex, endIndex: randomIndex, size: newSize }])
        }

        const t1 = performance.now()
        results.push(t1 - t0)
      }

      const { average } = logBenchmarkResults('Frequent size changes stress test (500 changes)', results)

      expect(average).toBeLessThan(150)
    })
  })
})
