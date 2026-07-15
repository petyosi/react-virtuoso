function scrollerElement(scroller: HTMLElement | Window) {
  return 'self' in scroller ? scroller.document.documentElement : scroller
}

function isRtl(scroller: HTMLElement | Window) {
  const element = scrollerElement(scroller)
  return element.ownerDocument.defaultView!.getComputedStyle(element).direction === 'rtl'
}

export function getLogicalScrollLeft(_scroller: HTMLElement | Window, scrollLeft: number) {
  // Supported browsers expose RTL horizontal scrolling as 0 at the right edge
  // and negative values while scrolling left.
  return Math.abs(scrollLeft)
}

export function getPhysicalScrollLeft(scroller: HTMLElement | Window, scrollLeft: number) {
  return isRtl(scroller) ? -scrollLeft : scrollLeft
}
