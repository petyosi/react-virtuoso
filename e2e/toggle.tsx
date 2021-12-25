import * as React from 'react'
import { Virtuoso } from '../src/'

export default function App() {
  const [toggle, setToggle] = React.useState<Record<number, boolean | undefined>>({})
  const [count, setCount] = React.useState(100)
  const itemContent = React.useCallback(
    (index: number) => {
      return (
        <div>
          <div>Item {index}</div>
          <button style={{ height: !!toggle[index] ? 100 : 50 }} onClick={() => setToggle((map) => ({ ...map, [index]: !map[index] }))}>
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
        onClick={() => {
          toggleSize(99)
          toggleSize(98)
        }}
      >
        Add + shrink
      </button>

      <button
        onClick={() => {
          toggleSize(99)
          toggleSize(98)
          toggleSize(90)
        }}
      >
        Add + shrink
      </button>

      <button
        onClick={() => {
          setCount((count) => count + 2)
          toggleSize(90)
        }}
      >
        Add + shrink
      </button>

      <Virtuoso
        computeItemKey={(key: number) => `item-${key.toString()}`}
        totalCount={count}
        itemContent={itemContent}
        followOutput={'auto'}
        increaseViewportBy={{ top: 0, bottom: 30 }}
        initialTopMostItemIndex={99}
        defaultItemHeight={100}
        style={{ height: 800 }}
      />
    </div>
  )
}
