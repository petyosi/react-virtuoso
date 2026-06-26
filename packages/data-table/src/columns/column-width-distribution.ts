import type { ColumnInfo } from './Column'

export function isValidColumnGrow(grow: unknown): grow is number {
  return typeof grow === 'number' && Number.isFinite(grow) && grow > 0
}

export function computeAutoFillColumnWidths(
  columns: readonly (readonly [string, ColumnInfo])[],
  baseWidths: ReadonlyMap<string, number>,
  viewportWidth: number
) {
  const realizedWidths = new Map<string, number>()

  let totalBaseWidth = 0

  for (const [key] of columns) {
    const baseWidth = baseWidths.get(key) ?? 0
    realizedWidths.set(key, baseWidth)
    totalBaseWidth += baseWidth
  }

  if (viewportWidth <= totalBaseWidth || columns.length === 0) {
    return realizedWidths
  }

  const growColumns: [string, number][] = []
  for (const [key, column] of columns) {
    if (isValidColumnGrow(column.grow)) {
      growColumns.push([key, column.grow])
    }
  }
  const extraWidth = viewportWidth - totalBaseWidth

  if (growColumns.length === 0) {
    const extraWidthPerColumn = extraWidth / columns.length

    for (const [key] of columns) {
      realizedWidths.set(key, (realizedWidths.get(key) ?? 0) + extraWidthPerColumn)
    }

    return realizedWidths
  }

  const totalGrow = growColumns.reduce((sum, [, grow]) => sum + grow, 0)

  for (const [key, grow] of growColumns) {
    realizedWidths.set(key, (realizedWidths.get(key) ?? 0) + (extraWidth * grow) / totalGrow)
  }

  return realizedWidths
}
