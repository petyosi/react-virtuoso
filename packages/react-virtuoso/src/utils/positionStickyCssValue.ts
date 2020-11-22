import { simpleMemoize } from './simpleMemoize'

const WEBKIT_STICKY = '-webkit-sticky'
const STICKY = 'sticky'

export const positionStickyCssValue = simpleMemoize(() => {
  if (typeof document === 'undefined') {
    return STICKY
  }
  const node = document.createElement('div')
  node.style.position = WEBKIT_STICKY
  return node.style.position === WEBKIT_STICKY ? WEBKIT_STICKY : STICKY
})
