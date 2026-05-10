const cachedRtlElements = new WeakMap<HTMLElement, boolean>()

function scrollerElement(scroller: HTMLElement | Window) {
  return 'self' in scroller ? scroller.document.documentElement : scroller
}

function isRtl(scroller: HTMLElement | Window) {
  const element = scrollerElement(scroller)
  const cached = cachedRtlElements.get(element)

  if (cached !== undefined) {
    return cached
  }

  const value = element.ownerDocument.defaultView!.getComputedStyle(element).direction === 'rtl'
  cachedRtlElements.set(element, value)
  return value
}

export function clearHorizontalScrollDirectionCache(scroller: HTMLElement | Window) {
  cachedRtlElements.delete(scrollerElement(scroller))
}

function convertHorizontalScrollLeft(scroller: HTMLElement | Window, scrollLeft: number) {
  // Supported browsers expose RTL horizontal scrolling as 0 at the right edge
  // and negative values while scrolling left, making the conversion symmetric.
  return isRtl(scroller) ? -scrollLeft : scrollLeft
}

export const getLogicalScrollLeft = convertHorizontalScrollLeft
export function getPhysicalScrollLeft(scroller: HTMLElement | Window, scrollLeft: number) {
  return convertHorizontalScrollLeft(scroller, scrollLeft)
}
