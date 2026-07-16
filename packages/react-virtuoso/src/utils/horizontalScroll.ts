function scrollerElement(scroller: HTMLElement | Window) {
  return 'self' in scroller ? scroller.document.documentElement : scroller
}

function isRtl(scroller: HTMLElement | Window) {
  const element = scrollerElement(scroller)
  return element.ownerDocument.defaultView!.getComputedStyle(element).direction === 'rtl'
}

export function getLogicalScrollLeft(scroller: HTMLElement | Window, scrollLeft: number) {
  // Supported browsers expose RTL horizontal scrolling as 0 at the right edge
  // and negative values while scrolling left. Safari can expose values beyond
  // the normal range during elastic overscroll, so the direction is required
  // to distinguish those values from regular RTL offsets.
  return isRtl(scroller) ? -scrollLeft : scrollLeft
}

export function getPhysicalScrollLeft(scroller: HTMLElement | Window, scrollLeft: number) {
  return isRtl(scroller) ? -scrollLeft : scrollLeft
}
