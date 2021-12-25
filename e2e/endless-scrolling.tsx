import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Virtuoso } from '../src'

function generateItems(length: number, startIndex: number) {
  return Array.from({ length }, (_, index) => `My Item ${index + startIndex}, gen: ${startIndex}`)
}

const itemContent = (_: number, data: string) => {
  return <div style={{ height: 30 }}>{data}</div>
}

export default function App() {
  const [items, setItems] = useState<string[]>(() => [])

  const loadMore = useCallback(() => {
    return setTimeout(() => {
      setItems((items) => [...items, ...generateItems(100, items.length)])
    }, 0)
  }, [setItems])

  useEffect(() => {
    const timeout = loadMore()
    return () => clearTimeout(timeout)
  }, [loadMore])

  return (
    <div>
      {items.length ? (
        <Virtuoso data={items} initialItemCount={items.length} endReached={loadMore} itemContent={itemContent} style={{ height: 300 }} />
      ) : (
        <div>Loading</div>
      )}
    </div>
  )
}
