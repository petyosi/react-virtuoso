import type { SizeRange } from '../interfaces'

export function accumulateSizeRange(results: SizeRange[], element: HTMLElement, size: number): void {
  if (element.dataset.index === undefined) {
    return
  }

  const index = Number.parseInt(element.dataset.index, 10)
  const knownSize = Number.parseFloat(element.dataset.knownSize ?? '')

  if (size === knownSize) {
    return
  }

  const lastResult = results.at(-1)
  if (results.length === 0 || lastResult?.size !== size || lastResult.endIndex !== index - 1) {
    results.push({ endIndex: index, size, startIndex: index })
  } else {
    lastResult.endIndex++
  }
}
