export function correctItemSize(el: HTMLElement, dimension: 'height' | 'width') {
  return Math.round(el.getBoundingClientRect()[dimension])
}
