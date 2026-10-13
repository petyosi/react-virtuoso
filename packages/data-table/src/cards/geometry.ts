export interface CardMeasurement {
  width: number
  height: number
  containerWidth: number
  columnGap: number
  rowGap: number
  gridColumns?: number
}

export const EMPTY_CARD_MEASUREMENT: CardMeasurement = { width: 0, height: 0, containerWidth: 0, columnGap: 0, rowGap: 0 }

export function cardGeometry(measurement: CardMeasurement, count: number) {
  const { width, height, containerWidth, columnGap, rowGap } = measurement
  const ready = width > 0 && height > 0 && containerWidth > 0
  const gridColumns = measurement.gridColumns ?? 0
  const columns = ready ? (gridColumns > 0 ? gridColumns : Math.max(1, Math.floor((containerWidth + columnGap) / (width + columnGap)))) : 1
  const rows = Math.ceil(count / columns)
  return { ready, columns, height, stride: height + rowGap, totalHeight: ready ? Math.max(0, rows * (height + rowGap) - rowGap) : 0 }
}

export function cardWindow(measurement: CardMeasurement, count: number, top: number, viewport: number, overscan: number) {
  const geometry = cardGeometry(measurement, count)
  if (!geometry.ready || count === 0) {
    return { start: 0, end: Math.min(1, count), paddingTop: 0, paddingBottom: 0 }
  }
  if (viewport <= 0) {
    // Keep the measured extent when an external scroller has not reached the list.
    return { start: 0, end: 1, paddingTop: 0, paddingBottom: Math.max(0, geometry.totalHeight - geometry.height) }
  }
  const { columns, stride, totalHeight } = geometry
  const firstRow = Math.min(Math.max(0, Math.ceil(count / columns) - 1), Math.floor(Math.max(0, top - overscan) / stride))
  const start = firstRow * columns
  const end = Math.min(count, Math.max(start + columns, Math.ceil((Math.max(0, top) + viewport + overscan) / stride) * columns))
  const paddingTop = firstRow * stride
  const bottom = Math.ceil(end / columns) * stride - measurement.rowGap
  return { start, end, paddingTop, paddingBottom: Math.max(0, totalHeight - bottom) }
}
