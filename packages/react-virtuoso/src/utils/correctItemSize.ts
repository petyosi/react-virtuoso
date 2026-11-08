/**
 * The effective CSS `zoom` of an element (including the zoom of its ancestors), or 1 if the browser does not report it.
 */
export function getCSSZoom(el: Element | null | undefined): number {
  return el?.currentCSSZoom ?? 1
}

/**
 * Converts a value between pixel spaces that differ by CSS `zoom`.
 *
 * Browsers report `currentCSSZoom` as a float32 (`1.1` reads as `1.100000023841858`), so a 100px item measured at that zoom comes
 * out as `99.99999`, which breaks the `floor()` and `=== 0` checks downstream. Layout uses 1/64 px units, so snapping to them removes
 * the noise and keeps later sums exact. A factor of 1 returns the value untouched, so lists without zoom are not affected.
 */
export function scaleForZoom(value: number, factor: number) {
  return factor === 1 ? value : Math.round(value * factor * 64) / 64
}

/**
 * `getBoundingClientRect()` is scaled by CSS `zoom`, while `scrollTop`, `scrollHeight` and `offsetHeight` are not.
 * Dividing by the zoom of the element's parent gives the size in the same pixels as the scroll position,
 * and still includes any `zoom` set on the element itself, since that changes how much space it takes.
 */
export function unzoomedSize(el: HTMLElement, dimension: 'height' | 'width', zoomSource: Element | null = el.parentElement) {
  return scaleForZoom(el.getBoundingClientRect()[dimension], 1 / getCSSZoom(zoomSource))
}

export function correctItemSize(el: HTMLElement, dimension: 'height' | 'width', zoomSource: Element | null = el.parentElement) {
  return Math.round(unzoomedSize(el, dimension, zoomSource))
}
