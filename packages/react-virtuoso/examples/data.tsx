import * as React from 'react'
import { useState } from 'react'
import { Virtuoso } from '../src'

function generateItems(length: number) {
  return Array.from({ length }, (_, index) => `My Item ${index}`)
}

const itemContent = (_: number, data: string) => {
  return <div style={{ height: 30 }}>{data}</div>
}
export function Example() {
  const [data, setData] = useState(() => generateItems(100))

  return (
    <div>
      <button
        onClick={() => {
          setData((prevData) => {
            return generateItems(prevData.length + 20)
          })
        }}
      >
        Append 20 Items
      </button>
      <Virtuoso data={data} itemContent={itemContent} style={{ height: 300 }} />
    </div>
  )
}
