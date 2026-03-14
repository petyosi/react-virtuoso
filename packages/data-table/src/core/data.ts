// oxlint-disable require-hook
import { e, Cell, DerivedCell } from '@virtuoso.dev/reactive-engine-core'

import { processStickyConfig } from '../sizing/stickyItems'

import type { DataArray } from '../interfaces'
import type { ProcessedStickyGroup, StickyItemsConfig } from '../sizing/stickyItems'

export const totalCount$ = Cell(0)
export const context$ = Cell<unknown>(null)

export const data$ = Cell<DataArray | null>(null)

e.link(
  e.pipe(
    data$,
    e.filter<DataArray | null, DataArray>((data) => data !== null),
    e.map((data) => data.length)
  ),
  totalCount$
)

export const groupIndices$ = Cell<{ index: number; level: number }[]>([])

export const groupStickyConfig$ = DerivedCell<ProcessedStickyGroup[]>(
  [],
  e.pipe(
    groupIndices$,
    e.map((groups) => {
      if (groups.length === 0) {
        return []
      }

      const uniqueLevels = [...new Set(groups.map((g) => g.level))].toSorted((a, b) => a - b)

      const config: StickyItemsConfig = {
        items: groups.map((g) => ({
          index: g.index,
          align: 'start' as const,
          groupId: g.level,
        })),
        groupLevels: uniqueLevels,
      }

      return processStickyConfig(config)
    })
  )
)

export const groupIndexSet$ = DerivedCell<Set<number>>(
  new Set(),
  e.pipe(
    groupIndices$,
    e.map((groups) => new Set(groups.map((g) => g.index)))
  )
)

export const groupLevelMap$ = DerivedCell<Map<number, number>>(
  new Map(),
  e.pipe(
    groupIndices$,
    e.map((groups) => new Map(groups.map((g) => [g.index, g.level])))
  )
)
