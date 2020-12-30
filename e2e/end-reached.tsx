import * as React from 'react'
import { useState } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src'

function generateItems(length: number, iter: number) {
  return Array.from({ length }, (_, index) => `My Item ${index}, gen: ${iter}`)
}

const itemContent = (_: number, data: string) => {
  return <div style={{ height: 30 }}>{data}</div>
}

const App = () => {
  const [data, setData] = useState(() => generateItems(100, 1))
  const [iter, setIter] = useState(1)

  return (
    <div>
      <button
        onClick={() => {
          setIter(val => val + 1)
          setData(prevData => {
            return generateItems(prevData.length, iter + 1)
          })
        }}
      >
        Refresh items
      </button>
      <Virtuoso data={data} endReached={end => console.log({ end })} itemContent={itemContent} style={{ height: 300 }} />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
