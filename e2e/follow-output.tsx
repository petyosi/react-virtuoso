import * as React from 'react'
import { useState, useRef, useCallback } from 'react'
import { Virtuoso } from '../src'

export default function App() {
  const [count, setCount] = useState(100)
  const appendInterval = useRef(null)
  const [listHeight, setListHeight] = useState(300)
  const [itemHeights, setItemHeights] = useState({})
  const itemContent = useCallback(
    (index: number) => {
      const height = (itemHeights[index] as number) ?? (index % 2 ? 30 : 40)
      return (
        <div style={{ height, background: 'white' }}>
          Item {index}
          <button
            onClick={() => {
              setItemHeights((heights) => {
                return {
                  ...heights,
                  [index]: 160,
                }
              })
            }}
          >
            *
          </button>
        </div>
      )
    },
    [itemHeights, setItemHeights]
  )

  return (
    <>
      <div>
        <button onClick={() => setCount((count) => count + 4)}>Append Items</button> |{' '}
        <button onClick={() => setListHeight((height) => height + 40)}>Increase container</button> |{' '}
        <button onClick={() => setListHeight((height) => height - 40)}>Decrease container</button>
      </div>
      <Virtuoso
        totalCount={count}
        initialTopMostItemIndex={99}
        followOutput={'smooth'}
        itemContent={itemContent}
        style={{ height: listHeight }}
        atBottomStateChange={(atBottom) => {
          clearInterval(appendInterval.current)
          if (atBottom) {
            appendInterval.current = setInterval(() => {
              // setCount((count) => count + 3)
            }, 100)
          }
        }}
      />
    </>
  )
}
