import * as React from 'react'
import { useState } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src'

function generateItems(length: number) {
  return Array.from({ length }).map((_, index) => `My Item ${index}`)
}

const itemContent = (_, __, data) => {
  console.log(data)
  return <div style={{ height: 30 }}>{data}</div>
}
const App = () => {
  const [data, setData] = useState(() => generateItems(100))

  return (
    <div>
      <button
        onClick={() => {
          setData(prevData => {
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

ReactDOM.render(<App />, document.getElementById('root'))
