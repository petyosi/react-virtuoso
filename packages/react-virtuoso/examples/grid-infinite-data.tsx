import * as React from 'react'
import { useState } from 'react'
import { VirtuosoGrid } from '../src'

function generateItems(length: number) {
  return Array.from({ length }, (_, index) => `My Item ${index}`)
}

const itemContent = (_: number, data: string) => {
  return <div style={{ height: 30 }}>{data}</div>
}
export function Example() {
  const [data, setData] = useState(() => generateItems(5))

  const loadMore = () => {
    setTimeout(() => {
      setData((prevData) => {
        return generateItems(prevData.length + 5)
      })
    }, 100)
  }

  return (
    <div
      style={{
        border: '1px solid',
      }}
    >
      <VirtuosoGrid data={data} itemContent={itemContent} style={{ height: 300 }} endReached={loadMore} />
    </div>
  )
}
