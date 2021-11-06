import * as React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { Virtuoso } from '../src'

const getRandomArbitrary = (min: number, max: number) => {
  return Math.random() * (max - min) + min
}

// globalThis['VIRTUOSO_LOG_LEVEL'] = 0

const ITEM_INDEX = 99999

const getItems = (count: number) => {
  const temp = []
  for (let i = 0; i < count; i++) {
    temp.push(i)
  }
  return temp
}

export default function App() {
  const [items, setItems] = useState<number[]>([])
  const [firstItemIndex, setFirstItemIndex] = useState(ITEM_INDEX)
  const [id, setID] = useState(0)
  const [, setVisibleRange] = useState({
    startIndex: 0,
    endIndex: 0,
  })

  const triggerChange = () => {
    let newID: number
    do {
      newID = getRandomArbitrary(10, 20)
    } while (newID === id)
    setID(newID)
  }

  useEffect(() => {
    setTimeout(() => {
      setItems(getItems(Number(id)))
      setFirstItemIndex(ITEM_INDEX)
    }, 200)

    return () => {
      setItems([])
    }
  }, [id])

  const _rowRenderer = useCallback((_, item) => {
    return <div style={{ padding: 20 }}>{item}</div>
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <button onClick={triggerChange}>Change item set</button>
      <p>Item size: {items.length}</p>
      <div style={{ height: 300 }}>
        {items.length > 0 && (
          <Virtuoso
            firstItemIndex={firstItemIndex}
            data={items}
            components={{ Header: () => <div style={{ height: 10 }} /> }}
            initialTopMostItemIndex={Math.max(0, items.length - 1)}
            itemContent={_rowRenderer}
            followOutput={'smooth'}
            rangeChanged={setVisibleRange}
          />
        )}
      </div>
    </div>
  )
}
