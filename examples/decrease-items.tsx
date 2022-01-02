import * as React from 'react'
import { useState } from 'react'
import { Virtuoso } from '../src'

const itemContent = (index: number) => <div style={{ border: '1px solid black', height: index % 2 ? 20 : 55 }}>Item {index}</div>
const style = { height: 300 }
export default function App() {
  const [count, setCount] = useState(100)
  return (
    <div>
      <button
        onClick={() => {
          setCount((val) => val - 2)
        }}
      >
        Delete last item
      </button>

      <Virtuoso totalCount={count} initialTopMostItemIndex={99} itemContent={itemContent} style={style} />
    </div>
  )
}
