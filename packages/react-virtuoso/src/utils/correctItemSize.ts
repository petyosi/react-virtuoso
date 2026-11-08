/**
 * The effective CSS `zoom` of an element (including the zoom of its ancestors), or 1 if the browser does not report it.
 */
export function getCSSZoom(el: Element | null | undefined): number {
  return el?.currentCSSZoom ?? 1
}

/**
 * `getBoundingClientRect()` is scaled by CSS `zoom`, while `scrollTop`, `scrollHeight` and `offsetHeight` are not.
 * Dividing by the zoom of the element's parent gives the size in the same pixels as the scroll position,
 * and still includes any `zoom` set on the element itself, since that changes how much space it takes.
 */
export function unzoomedSize(el: HTMLElement, dimension: 'height' | 'width', zoomSource: Element | null = el.parentElement) {
  return el.getBoundingClientRect()[dimension] / getCSSZoom(zoomSource)
}

export function correctItemSize(el: HTMLElement, dimension: 'height' | 'width', zoomSource: Element | null = el.parentElement) {
  return Math.round(unzoomedSize(el, dimension, zoomSource))
}
