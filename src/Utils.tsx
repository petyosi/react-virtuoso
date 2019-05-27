import { useRef, useState, useLayoutEffect } from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import { TInput, TOutput } from './rxio'

type UseHeight = (
  input: TInput<number>,
  onMount?: (ref: CallbackRefParam) => void,
  onResize?: (ref: HTMLElement) => void
) => (ref: CallbackRefParam) => void

export type CallbackRefParam = HTMLElement | null

export const useHeight: UseHeight = (input, onMount, onResize) => {
  const ref = useRef<CallbackRefParam>(null)
  const currentHeight = useRef(0)
  const observer = new ResizeObserver(entries => {
    const newHeight = entries[0].contentRect.height
    if (currentHeight.current !== newHeight) {
      currentHeight.current = newHeight
      if (onResize) {
        onResize(entries[0].target as HTMLElement)
      }
      input(newHeight)
    }
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
  return callbackRef
}

export function useOutput<T>(output: TOutput<T>, initialValue: T): T {
  const [value, setValue] = useState(initialValue)

  useLayoutEffect(() => {
    output(setValue)
    return () => {
      output(undefined)
    }
  }, [])
  return value
}

const START_CHAR = 97
const END_CHAR = 122

const randomChar = () => String.fromCharCode(Math.round(Math.random() * (END_CHAR - START_CHAR) + START_CHAR))

export const randomClassName = () =>
  new Array(12)
    .fill(0)
    .map(randomChar)
    .join('')
