import * as React from 'react'
import { Virtuoso, VirtuosoHandle } from '../src'

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)
  const [currentItemIndex, setCurrentItemIndex] = React.useState(-1)
  const listRef = React.useRef<HTMLElement>()

  const keyDownCallback = React.useCallback(
    (e: KeyboardEvent) => {
      let nextIndex: number | null = null

      if (e.code === 'ArrowUp') {
        nextIndex = Math.max(0, currentItemIndex - 1)
      } else if (e.code === 'ArrowDown') {
        nextIndex = Math.min(99, currentItemIndex + 1)
      }

      if (nextIndex !== null) {
        ref.current!.scrollIntoView({
          index: nextIndex,
          behavior: 'auto',
          done: () => {
            setCurrentItemIndex(nextIndex!)
          },
        })
        e.preventDefault()
      }
    },
    [currentItemIndex, ref, setCurrentItemIndex]
  )

  const scrollerRef = React.useCallback(
    (element: HTMLElement | Window | null) => {
      if (element) {
        element.addEventListener('keydown', keyDownCallback as any)
        listRef.current = element as HTMLElement
      } else {
        listRef.current!.removeEventListener('keydown', keyDownCallback)
      }
    },
    [keyDownCallback]
  )

  return (
    <Virtuoso
      ref={ref}
      scrollerRef={scrollerRef}
      totalCount={100}
      itemContent={(index) => (
        <div style={{ height: index % 2 ? 30 : 20, background: 'white', color: index === currentItemIndex ? 'red' : 'black' }}>
          Item {index}
        </div>
      )}
      style={{ height: 300 }}
    />
  )
}
