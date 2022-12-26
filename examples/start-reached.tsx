import * as React from 'react'
import { Virtuoso } from '../src'
import { useState, useCallback } from 'react'

const START_INDEX = 10000
const INITIAL_ITEM_COUNT = 100

export function Example() {
  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX)
  const [items, setItems] = useState(() => Array.from({ length: INITIAL_ITEM_COUNT }))

  const prependItems = useCallback(() => {
    const itemsToPrepend = 20
    const nextFirstItemIndex = firstItemIndex - itemsToPrepend

    setTimeout(() => {
      setFirstItemIndex(() => nextFirstItemIndex)
      setItems((items) => [...Array.from({ length: itemsToPrepend }), ...items])
    }, 500)

    return false
  }, [firstItemIndex, setItems])

  const itemContent = useCallback((index: number) => {
    return (
      <div
        style={{
          padding: '1rem 0.5rem',
          border: '1px solid #ccc',
        }}
      >
        Item {index + 1}
      </div>
    )
  }, [])

  return (
    <div>
      <Virtuoso
        components={{
          Header: () => <div style={{ textAlign: 'center', padding: '1rem' }}>Loading...</div>,
        }}
        style={{ width: '200px', height: '600px' }}
        data={items}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={INITIAL_ITEM_COUNT - 1}
        startReached={prependItems}
        itemContent={itemContent}
      />
    </div>
  )
}
