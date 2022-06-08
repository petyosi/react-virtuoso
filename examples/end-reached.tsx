import * as React from 'react'
import { useState } from 'react'
import { Virtuoso } from '../src'

function generateItems(length: number, iter: number) {
  return Array.from({ length }, (_, index) => `My Item ${index}, gen: ${iter}`)
}

const itemContent = (_: number, data: string) => {
  return <div style={{ height: 30 }}>{data}</div>
}

export default function App() {
  const [data, setData] = useState(() => generateItems(100, 1))
  const [iter, setIter] = useState(1)

  return (
    <div>
      <button
        onClick={() => {
          setIter((val) => val + 1)
          setData((prevData) => {
            return generateItems(prevData.length, iter + 1)
          })
        }}
      >
        Refresh items
      </button>
      <Virtuoso data={data} itemContent={itemContent} style={{ height: 300 }} />
    </div>
  )
}
