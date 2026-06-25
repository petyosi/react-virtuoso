import { describe, expect, it } from 'vitest'

import { computeAutoFillColumnWidths } from '../../column-width-distribution'

describe('column width distribution', () => {
  it('keeps base widths when the viewport is narrower than the base total', () => {
    const widths = computeAutoFillColumnWidths(
      [
        ['name', { field: 'name' }],
        ['status', { field: 'status' }],
      ],
      new Map([
        ['name', 180],
        ['status', 120],
      ]),
      240
    )

    expect(widths.get('name')).toBe(180)
    expect(widths.get('status')).toBe(120)
  })

  it('fills the available viewport equally before any manual resize', () => {
    const widths = computeAutoFillColumnWidths(
      [
        ['name', { field: 'name' }],
        ['status', { field: 'status' }],
        ['region', { field: 'region' }],
      ],
      new Map([
        ['name', 80],
        ['status', 80],
        ['region', 80],
      ]),
      600
    )

    expect(widths.get('name')).toBe(200)
    expect(widths.get('status')).toBe(200)
    expect(widths.get('region')).toBe(200)
  })

  it('keeps equal extra-width distribution even when base widths differ', () => {
    const widths = computeAutoFillColumnWidths(
      [
        ['name', { field: 'name' }],
        ['status', { field: 'status' }],
        ['notes', { field: 'notes' }],
      ],
      new Map([
        ['name', 80],
        ['status', 120],
        ['notes', 160],
      ]),
      560
    )

    expect(widths.get('name')).toBeCloseTo(146.67, 2)
    expect(widths.get('status')).toBeCloseTo(186.67, 2)
    expect(widths.get('notes')).toBeCloseTo(226.67, 2)
  })

  it('sends all extra width to a single grow column', () => {
    const widths = computeAutoFillColumnWidths(
      [
        ['name', { field: 'name', grow: 1 }],
        ['status', { field: 'status' }],
      ],
      new Map([
        ['name', 120],
        ['status', 80],
      ]),
      500
    )

    expect(widths.get('name')).toBe(420)
    expect(widths.get('status')).toBe(80)
  })

  it('distributes extra width by grow ratio', () => {
    const widths = computeAutoFillColumnWidths(
      [
        ['name', { field: 'name', grow: 1 }],
        ['description', { field: 'description', grow: 3 }],
        ['status', { field: 'status' }],
      ],
      new Map([
        ['name', 120],
        ['description', 180],
        ['status', 100],
      ]),
      800
    )

    expect(widths.get('name')).toBe(220)
    expect(widths.get('description')).toBe(480)
    expect(widths.get('status')).toBe(100)
  })

  it('keeps base widths when grow columns exist but the viewport is narrower than the base total', () => {
    const widths = computeAutoFillColumnWidths(
      [
        ['name', { field: 'name', grow: 1 }],
        ['description', { field: 'description', grow: 3 }],
        ['status', { field: 'status' }],
      ],
      new Map([
        ['name', 120],
        ['description', 180],
        ['status', 100],
      ]),
      300
    )

    expect(widths.get('name')).toBe(120)
    expect(widths.get('description')).toBe(180)
    expect(widths.get('status')).toBe(100)
  })

  it('ignores invalid grow values', () => {
    const widths = computeAutoFillColumnWidths(
      [
        ['name', { field: 'name', grow: 0 }],
        ['description', { field: 'description', grow: Number.NaN }],
        ['status', { field: 'status', grow: -1 }],
        ['notes', { field: 'notes', grow: Number.POSITIVE_INFINITY }],
      ],
      new Map([
        ['name', 100],
        ['description', 100],
        ['status', 100],
        ['notes', 100],
      ]),
      800
    )

    expect(widths.get('name')).toBe(200)
    expect(widths.get('description')).toBe(200)
    expect(widths.get('status')).toBe(200)
    expect(widths.get('notes')).toBe(200)
  })

  it('keeps invalid grow columns fixed when another column can grow', () => {
    const widths = computeAutoFillColumnWidths(
      [
        ['name', { field: 'name', grow: 1 }],
        ['description', { field: 'description', grow: Number.NaN }],
        ['status', { field: 'status' }],
      ],
      new Map([
        ['name', 100],
        ['description', 100],
        ['status', 100],
      ]),
      600
    )

    expect(widths.get('name')).toBe(400)
    expect(widths.get('description')).toBe(100)
    expect(widths.get('status')).toBe(100)
  })
})
