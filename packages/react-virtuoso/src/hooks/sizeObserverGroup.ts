import ReactDOM from 'react-dom'

export interface SizeObserverGroup {
  callbacks: Set<() => void>
  measure: () => void
}

// One group per grid: either observer must read both the viewport and item
// dimensions, even if the other observer has not delivered its notification.
export function createSizeObserverGroup(): SizeObserverGroup {
  const callbacks = new Set<() => void>()
  return {
    callbacks,
    measure() {
      // Commit padding and the rendered range before the browser paints the
      // new CSS columns. Separate RAF callbacks can expose mixed geometry.
      ReactDOM.flushSync(() => {
        Array.from(callbacks).forEach((callback) => callback())
      })
    },
  }
}
