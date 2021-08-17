export function correctItemSize(el: HTMLElement, dimension: 'height' | 'width') {
  return el.getBoundingClientRect()[dimension]
}
