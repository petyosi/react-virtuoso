import { useCallback, useRef, useState } from 'react'

import { Virtuoso } from '../src'

export function Example() {
  const [count, setCount] = useState(100)
  const appendInterval = useRef<NodeJS.Timeout>(null)
  const [listHeight, setListHeight] = useState(300)
  const [itemHeights, setItemHeights] = useState<Record<number, number>>({})
  const itemContent = useCallback(
    (index: number) => {
      const height = itemHeights[index] ?? (index % 2 ? 30 : 40)
      return (
        <div style={{ background: 'white', height }}>
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
        <button
          onClick={() => {
            setCount((count) => count + 4)
          }}
        >
          Append Items
        </button>{' '}
        |{' '}
        <button
          onClick={() => {
            setListHeight((height) => height + 40)
          }}
        >
          Increase container
        </button>{' '}
        |{' '}
        <button
          onClick={() => {
            setListHeight((height) => height - 40)
          }}
        >
          Decrease container
        </button>
      </div>
      <Virtuoso
        atBottomStateChange={(atBottom) => {
          appendInterval.current && clearInterval(appendInterval.current)
          if (atBottom) {
            appendInterval.current = setInterval(() => {
              // setCount((count) => count + 3)
            }, 100)
          }
        }}
        followOutput={'smooth'}
        initialTopMostItemIndex={99}
        itemContent={itemContent}
        style={{ height: listHeight }}
        totalCount={count}
      />
    </>
  )
}

export function FixedItemHeight() {
  const [count, setCount] = useState(100)
  const itemContent = useCallback((index: number) => {
    const height = 30
    return <div style={{ background: 'white', height }}>Item {index} </div>
  }, [])

  return (
    <>
      <div>
        <button
          onClick={() => {
            setCount((count) => count + 4)
          }}
        >
          Append Items
        </button>
      </div>
      <Virtuoso
        style={{ height: 300 }}
        followOutput={'smooth'}
        initialTopMostItemIndex={99}
        itemContent={itemContent}
        fixedItemHeight={30}
        totalCount={count}
      />
    </>
  )
}
