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
})
