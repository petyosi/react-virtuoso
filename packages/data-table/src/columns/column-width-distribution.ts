import type { ColumnInfo } from './Column'

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

  const extraWidthPerColumn = (viewportWidth - totalBaseWidth) / columns.length

  for (const [key] of columns) {
    realizedWidths.set(key, (realizedWidths.get(key) ?? 0) + extraWidthPerColumn)
  }

  return realizedWidths
}
