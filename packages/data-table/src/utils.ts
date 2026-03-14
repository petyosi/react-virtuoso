import type { Operator } from '@virtuoso.dev/reactive-engine-core'

export function approximatelyEqual(num1: number, num2: number) {
  return Math.abs(num1 - num2) < 1.01
}

export function simpleMemoize<T extends () => unknown>(func: T): T {
  let called = false
  let result: unknown

  return (() => {
    if (!called) {
      called = true
      result = func()
    }
    return result
  }) as T
}

export function isMobileSafari() {
  if (typeof navigator === 'undefined') {
    return false
  }

  const isIpad = /Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1

  return isIpad || (/iP(ad|od|hone)/i.test(navigator.userAgent) && /WebKit/i.test(navigator.userAgent))
}

export function isFalse(value: boolean) {
  return !value
}

export function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - 2 ** (-10 * x)
}

export function delayWithAnimationFrame<I>(frames = 1) {
  return ((source, e) => {
    const sink = e.streamInstance<I>()
    e.sub(source, (value) => {
      let remainingFrames = frames
      function frame() {
        if (remainingFrames > 0) {
          remainingFrames--
          requestAnimationFrame(frame)
        } else {
          e.pub(sink, value)
        }
      }
      frame()
    })
    return sink
  }) as Operator<I, I>
}
