import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'
import { useState, useCallback } from 'react'

const START_INDEX = 10000
const INITIAL_ITEM_COUNT = 100

const App = () => {
  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX)
  const [items, setItems] = useState(() => new Array(INITIAL_ITEM_COUNT).fill(''))

  const prependItems = useCallback(
    index => {
      console.log(`prepending items, ${index}`)

      const itemsToPrepend = 20
      const nextFirstItemIndex = firstItemIndex - itemsToPrepend

      setTimeout(() => {
        setFirstItemIndex(() => nextFirstItemIndex)

        const newItems = new Array(itemsToPrepend).fill('')
        setItems(items => [...newItems, ...items])
      }, 500)

      return false
    },
    [firstItemIndex, setItems]
  )

  const itemContent = useCallback(index => {
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

ReactDOM.render(<App />, document.getElementById('root'))
