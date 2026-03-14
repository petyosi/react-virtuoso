import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it } from 'vitest'

import { groupIndices$, groupStickyConfig$, groupIndexSet$, groupLevelMap$ } from '../../../core/data'

describe('grouped data', () => {
  let engine!: Engine

  beforeEach(() => {
    engine = new Engine()
    engine.register(groupStickyConfig$)
    engine.register(groupIndexSet$)
    engine.register(groupLevelMap$)
  })

  describe(String(groupStickyConfig$), () => {
    it('returns empty array for no groups', () => {
      engine.pub(groupIndices$, [])
      expect(engine.getValue(groupStickyConfig$)).toStrictEqual([])
    })

    it('maps single-level groups to ProcessedStickyGroup[]', () => {
      engine.pub(groupIndices$, [
        { index: 0, level: 0 },
        { index: 5, level: 0 },
        { index: 10, level: 0 },
      ])

      const config = engine.getValue(groupStickyConfig$)
      expect(config.length).toBe(1)
      expect(config[0]!.groupId).toBe(0)
      expect(config[0]!.align).toBe('start')
      expect(config[0]!.level).toBe(0)
      expect(config[0]!.sortedIndices).toStrictEqual([0, 5, 10])
    })

    it('maps multi-level groups to ProcessedStickyGroup[]', () => {
      engine.pub(groupIndices$, [
        { index: 0, level: 0 },
        { index: 1, level: 1 },
        { index: 5, level: 0 },
        { index: 6, level: 1 },
      ])

      const config = engine.getValue(groupStickyConfig$)
      expect(config.length).toBe(2)

      const level0 = config.find((g) => g.groupId === 0)!
      expect(level0.level).toBe(0)
      expect(level0.sortedIndices).toStrictEqual([0, 5])

      const level1 = config.find((g) => g.groupId === 1)!
      expect(level1.level).toBe(1)
      expect(level1.sortedIndices).toStrictEqual([1, 6])
    })

    it('sorts groups by level ascending', () => {
      engine.pub(groupIndices$, [
        { index: 3, level: 2 },
        { index: 0, level: 0 },
        { index: 1, level: 1 },
      ])

      const config = engine.getValue(groupStickyConfig$)
      expect(config.map((g) => g.level)).toStrictEqual([0, 1, 2])
    })
  })

  describe(String(groupIndexSet$), () => {
    it('returns empty set for no groups', () => {
      engine.pub(groupIndices$, [])
      expect(engine.getValue(groupIndexSet$).size).toBe(0)
    })

    it('contains all group indices', () => {
      engine.pub(groupIndices$, [
        { index: 0, level: 0 },
        { index: 5, level: 1 },
        { index: 10, level: 0 },
      ])

      const set = engine.getValue(groupIndexSet$)
      expect(set.size).toBe(3)
      expect(set.has(0)).toBe(true)
      expect(set.has(5)).toBe(true)
      expect(set.has(10)).toBe(true)
      expect(set.has(3)).toBeFalsy()
    })
  })

  describe(String(groupLevelMap$), () => {
    it('returns empty map for no groups', () => {
      engine.pub(groupIndices$, [])
      expect(engine.getValue(groupLevelMap$).size).toBe(0)
    })

    it('maps indices to their levels', () => {
      engine.pub(groupIndices$, [
        { index: 0, level: 0 },
        { index: 5, level: 1 },
        { index: 10, level: 2 },
      ])

      const map = engine.getValue(groupLevelMap$)
      expect(map.size).toBe(3)
      expect(map.get(0)).toBe(0)
      expect(map.get(5)).toBe(1)
      expect(map.get(10)).toBe(2)
    })
  })
})
