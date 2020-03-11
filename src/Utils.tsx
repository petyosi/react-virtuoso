import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import { TInput, TOutput } from './rxio'

export type CallbackRefParam = HTMLElement | null
export type CallbackRef = (ref: CallbackRefParam) => void

type UseHeight = (
  input: TInput<number>,
  onMount?: (ref: CallbackRefParam) => void,
  onResize?: (ref: HTMLElement) => void
) => CallbackRef

export const useHeight: UseHeight = (input, onMount, onResize) => {
  const ref = useRef<CallbackRefParam>(null)
  const animationFrameID = useRef<number>(0)
  const observer = new ResizeObserver(entries => {
    const newHeight = Math.round(entries[0].contentRect.height)
    if (onResize) {
      animationFrameID.current = window.requestAnimationFrame(() => onResize(entries[0].target as HTMLElement))
    }
    input(newHeight)
  })

  const callbackRef = (elRef: CallbackRefParam) => {
    if (elRef) {
      observer.observe(elRef)
      if (onMount) {
        onMount(elRef)
      }
      ref.current = elRef
    } else {
      observer.unobserve(ref.current!)
      ref.current = null
    }
  }

  useEffect(() => () => window.cancelAnimationFrame(animationFrameID.current), [])
  return callbackRef
}

function callbackToValue<T>(output: (callback: (val: T) => void) => void, defaultValue: T) {
  return () => {
    let result = defaultValue
    output(val => {
      result = val
    })
    return result
  }
}

export function useOutput<T>(output: TOutput<T>, initialValue: T): T {
  const [value, setValue] = useState(callbackToValue<T>(output, initialValue))

  useLayoutEffect(() => {
    output(setValue)
    return () => output(undefined)
  }, [output])
  return value
}

type UseSize = (callback: (params: { element: HTMLElement; width: number; height: number }) => void) => CallbackRef

export const useSize: UseSize = callback => {
  const ref = useRef<CallbackRefParam>(null)
  const currentSize = useRef([0, 0])

  const observer = new ResizeObserver(entries => {
    const { width, height } = entries[0].contentRect
    if (currentSize.current[0] !== width || currentSize.current[1] !== height) {
      currentSize.current = [width, height]
      callback({
        element: entries[0].target as HTMLElement,
        width: Math.round(width),
        height: Math.round(height),
      })
    }
  })

  const callbackRef = (elRef: CallbackRefParam) => {
    if (elRef) {
      observer.observe(elRef)
      ref.current = elRef
    } else {
      observer.unobserve(ref.current!)
      ref.current = null
    }
  }

  return callbackRef
}

export function simpleMemoize<T extends () => any>(func: T): T {
  let called = false
  let result: any

  return (() => {
    if (!called) {
      called = true
      result = func()
    }
    return result
  }) as T
}

const WEBKIT_STICKY = '-webkit-sticky'
const STICKY = 'sticky'

export const positionStickyCssValue = simpleMemoize(() => {
  const node = document.createElement('div')
  node.style.position = WEBKIT_STICKY
  return node.style.position === WEBKIT_STICKY ? WEBKIT_STICKY : STICKY
})
