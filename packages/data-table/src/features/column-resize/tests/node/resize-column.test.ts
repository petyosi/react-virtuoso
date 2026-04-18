import { Engine } from '@virtuoso.dev/reactive-engine-core'
import { beforeEach, describe, expect, it } from 'vitest'

import { columnWidthOverrides$ } from '../../../../columns/column-width-overrides'
import { resizeColumn$ } from '../../index'

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
})
