import * as React from 'react'
import { useState } from 'react'
import { Virtuoso } from '../src'

const itemContent = (index: number) => <div style={{ height: index % 2 ? 20 : 55 }}>Item {index}</div>
const style = { height: 300 }
export default function App() {
  const [count, setCount] = useState(100)
  const [firstItemIndex, setFirstItemIndex] = useState(200)
  return (
    <div>
      <button
        onClick={() => {
          setCount(val => val + 2)
          setFirstItemIndex(val => val - 2)
        }}
      >
        Prepend 5 Items
      </button>

      <Virtuoso totalCount={count} firstItemIndex={firstItemIndex} itemContent={itemContent} style={style} />
    </div>
  )
}
