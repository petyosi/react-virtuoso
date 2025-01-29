import * as React from 'react'

import { Virtuoso } from '../src/'

export function Example() {
  const [toggle, setToggle] = React.useState<Record<number, boolean | undefined>>({})
  const [count, setCount] = React.useState(100)
  const itemContent = React.useCallback(
    (index: number) => {
      return (
        <div>
          <div>Item {index}</div>
          <button
            onClick={() => {
              setToggle((map) => ({ ...map, [index]: !map[index] }))
            }}
            style={{ height: toggle[index] ? 100 : 50 }}
          >
            Toggle
          </button>
        </div>
      )
    },
    [toggle, setToggle]
  )
  return (
    <div>
      <button
        onClick={() => {
          setToggle((toggle) => ({ ...toggle, 88: !toggle[88] }))
          setToggle((toggle) => ({ ...toggle, 99: !toggle[99] }))

          setTimeout(() => {
            setToggle((toggle) => ({ ...toggle, 99: !toggle[99] }))
            setTimeout(() => {
              setToggle((toggle) => ({ ...toggle, 88: !toggle[88] }))
              // setCount((count) => count + 1)
            })
          }, 500)
          // setTimeout(() => {})
          /*
          setTimeout(() => {
            setCount((count) => count + 1)
          })*/
        }}
      >
        Add + shrink
      </button>
      <button
        onClick={() => {
          // setToggle((toggle) => ({ ...toggle, 92: !toggle[92] }))
          setCount((count) => count + 1)
          setTimeout(() => {
            setCount((count) => count + 1)
          })
        }}
      >
        Add two quickly
      </button>
      <Virtuoso
        defaultItemHeight={100}
        followOutput={'auto'}
        increaseViewportBy={{ bottom: 30, top: 0 }}
        initialTopMostItemIndex={99}
        itemContent={itemContent}
        style={{ height: 800 }}
        totalCount={count}
      />
    </div>
  )
}
