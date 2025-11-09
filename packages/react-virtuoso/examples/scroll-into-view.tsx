import * as React from 'react'

import { Virtuoso, VirtuosoHandle } from '../src'

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)
  const [currentItemIndex, setCurrentItemIndex] = React.useState(-1)
  const listRef = React.useRef<HTMLElement>(null)

  const keyDownCallback = React.useCallback(
    (e: KeyboardEvent) => {
      let nextIndex: null | number = null

      if (e.code === 'ArrowUp') {
        nextIndex = Math.max(0, currentItemIndex - 1)
      } else if (e.code === 'ArrowDown') {
        nextIndex = Math.min(99, currentItemIndex + 1)
      }

      if (nextIndex !== null) {
        ref.current!.scrollIntoView({
          behavior: 'auto',
          done: () => {
            setCurrentItemIndex(nextIndex)
          },
          index: nextIndex,
        })
        e.preventDefault()
      }
    },
    [currentItemIndex, ref, setCurrentItemIndex]
  )

  const scrollerRef = React.useCallback(
    (element: HTMLElement | null | Window) => {
      if (element) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
      itemContent={(index) => (
        <div style={{ background: 'white', color: index === currentItemIndex ? 'red' : 'black', height: index % 2 ? 30 : 20 }}>
          Item {index}
        </div>
      )}
      ref={ref}
      scrollerRef={scrollerRef}
      style={{ height: 300 }}
      totalCount={100}
    />
  )
}
