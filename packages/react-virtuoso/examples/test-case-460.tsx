import { useCallback, useEffect, useState } from 'react'

import { Virtuoso, VirtuosoProps } from '../src'

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

export function Example() {
  const [items, setItems] = useState<number[]>([])
  const [firstItemIndex, setFirstItemIndex] = useState(ITEM_INDEX)
  const [id, setID] = useState(0)
  const [, setVisibleRange] = useState({
    endIndex: 0,
    startIndex: 0,
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
      setItems(getItems(id))
      setFirstItemIndex(ITEM_INDEX)
    }, 200)

    return () => {
      setItems([])
    }
  }, [id])

  const _rowRenderer: VirtuosoProps<number, undefined>['itemContent'] = useCallback((_: number, item: number) => {
    return <div style={{ padding: 20 }}>{item}</div>
  }, [])

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
      <button onClick={triggerChange}>Change item set</button>
      <p>Item size: {items.length}</p>
      <div style={{ height: 300 }}>
        {items.length > 0 && (
          <Virtuoso
            components={{ Header: () => <div style={{ height: 10 }} /> }}
            data={items}
            firstItemIndex={firstItemIndex}
            followOutput={'smooth'}
            initialTopMostItemIndex={Math.max(0, items.length - 1)}
            itemContent={_rowRenderer}
            rangeChanged={setVisibleRange}
          />
        )}
      </div>
    </div>
  )
}
