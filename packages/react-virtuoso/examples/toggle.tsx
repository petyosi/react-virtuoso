import * as React from 'react'

import { Virtuoso } from '../src'

export function Example() {
  const [toggle, setToggle] = React.useState<Record<number, boolean | undefined>>({})
  const [count, setCount] = React.useState(100)
  const itemContent = React.useCallback(
    (index: number) => {
      return (
        <div>
          <div style={{}}>Item {index}</div>
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

  const toggleSize = React.useCallback(
    (index: number) => {
      setToggle((toggle) => ({ ...toggle, [index]: !toggle[index] }))
    },
    [setToggle]
  )

  return (
    <div>
      <button
        data-testid="toggle-last-two"
        onClick={() => {
          toggleSize(99)
          toggleSize(98)
        }}
      >
        Toggle 99 and 98
      </button>

      <button
        onClick={() => {
          toggleSize(99)
          toggleSize(98)
          toggleSize(90)
        }}
      >
        Toggle 99, 98 and 90
      </button>

      <button
        onClick={() => {
          setCount((count) => count + 2)
          toggleSize(90)
        }}
      >
        Add 2 + toggle 90
      </button>

      <button
        onClick={() => {
          toggleSize(98)
          toggleSize(97)
        }}
      >
        Toggle 98 and 97
      </button>
      <Virtuoso
        computeItemKey={(key: number) => `item-${key.toString()}`}
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
