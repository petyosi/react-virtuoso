import * as React from 'react'

import { Virtuoso, VirtuosoHandle } from '../src'

export function Example() {
  const ref = React.useRef<VirtuosoHandle>(null)
  const [currentItemIndex, setCurrentItemIndex] = React.useState(-1)
  const [count, setCount] = React.useState(100)
  const increment = 50
  const bottomOffset = 10

  return (
    <div>
      <button
        id="add-and-scroll"
        style={{ whiteSpace: 'nowrap' }}
        onClick={() => {
          const newCount = count + increment
          const nextIndex = newCount - bottomOffset
          ref.current?.scrollIntoView({
            align: `start`,
            index: nextIndex,
            behavior: 'auto',
            done: () => {
              setCurrentItemIndex(nextIndex)
            },
            targetsNextRefresh: true,
          })
          setCount(newCount)
          return false
        }}
      >
        Add {increment} and go to {count + (increment - bottomOffset)}
      </button>
      <Virtuoso
        ref={ref}
        totalCount={count}
        context={{ currentItemIndex }}
        itemContent={(index, _, { currentItemIndex }) => (
          <div style={{ background: 'white', color: index === currentItemIndex ? 'red' : 'black', height: 50 }}>Item {index}</div>
        )}
        style={{ height: 300 }}
      />
    </div>
  )
}
