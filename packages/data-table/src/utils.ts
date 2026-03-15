export function approximatelyEqual(num1: number, num2: number) {
  return Math.abs(num1 - num2) < 1.01
}

export function isMobileSafari() {
  if (typeof navigator === 'undefined') {
    return false
  }

  const isIpad = /Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1

  return isIpad || (/iP(ad|od|hone)/i.test(navigator.userAgent) && /WebKit/i.test(navigator.userAgent))
}

export function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - 2 ** (-10 * x)
}
