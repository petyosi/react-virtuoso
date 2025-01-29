import { useCallback, useState } from 'react'

import { Virtuoso } from '../src'

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
          border: '1px solid #ccc',
          padding: '1rem 0.5rem',
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
          Header: () => <div style={{ padding: '1rem', textAlign: 'center' }}>Loading...</div>,
        }}
        data={items}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={INITIAL_ITEM_COUNT - 1}
        itemContent={itemContent}
        startReached={prependItems}
        style={{ height: '600px', width: '200px' }}
      />
    </div>
  )
}
