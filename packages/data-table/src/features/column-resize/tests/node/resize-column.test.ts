import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it } from 'vitest'

import { columnWidthOverrides$ } from '../../../../columns/column-width-overrides'
import { clearColumnWidthOverride$, resizeColumn$, resetColumnWidthOverrides$ } from '../../index'

describe('column resize feature', () => {
  let engine!: Engine

  beforeEach(() => {
    engine = new Engine()
    engine.register(columnWidthOverrides$)
  })

  it('applies a width override', () => {
    engine.pub(resizeColumn$, { key: 'name', width: 240 })

    expect(engine.getValue(columnWidthOverrides$).get('name')).toBe(240)
  })

  it('overwrites an existing width override', () => {
    engine.pub(columnWidthOverrides$, new Map([['name', 180]]))

    engine.pub(resizeColumn$, { key: 'name', width: 320 })

    expect(engine.getValue(columnWidthOverrides$).get('name')).toBe(320)
  })

  it('leaves other columns untouched', () => {
    engine.pub(
      columnWidthOverrides$,
      new Map([
        ['id', 120],
        ['status', 200],
      ])
    )

    engine.pub(resizeColumn$, { key: 'name', width: 280 })

    expect(engine.getValue(columnWidthOverrides$)).toStrictEqual(
      new Map([
        ['id', 120],
        ['status', 200],
        ['name', 280],
      ])
    )
  })

  it('clears a single width override', () => {
    engine.pub(
      columnWidthOverrides$,
      new Map([
        ['name', 180],
        ['status', 220],
      ])
    )

    engine.pub(clearColumnWidthOverride$, { key: 'name' })

    expect(engine.getValue(columnWidthOverrides$)).toStrictEqual(new Map([['status', 220]]))
  })

  it('clears all width overrides', () => {
    engine.pub(
      columnWidthOverrides$,
      new Map([
        ['name', 180],
        ['status', 220],
      ])
    )

    engine.pub(resetColumnWidthOverrides$)

    expect(engine.getValue(columnWidthOverrides$)).toStrictEqual(new Map())
  })
})
