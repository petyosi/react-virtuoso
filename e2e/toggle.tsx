import * as React from 'react'
import { Virtuoso } from '../src/'

export default function App() {
  const [toggle, setToggle] = React.useState({})
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
              setCount((count) => count + 1)
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
