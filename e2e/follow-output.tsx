import * as React from 'react'
import { useState, useRef } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src'

const itemContent = (index: number) => <div style={{ height: index % 2 ? 20 : 30, background: 'white' }}>Item {index}</div>
const App = () => {
  const [count, setCount] = useState(100)
  const appendInterval = useRef(null)
  return (
    <>
      <div>
        <button onClick={() => setCount(count => count + 4)}>Append 10</button>
      </div>
      <Virtuoso
        totalCount={count}
        initialTopMostItemIndex={99}
        followOutput={true}
        itemContent={itemContent}
        style={{ height: 300 }}
        atBottomStateChange={atBottom => {
          clearInterval(appendInterval.current)
          if (atBottom) {
            appendInterval.current = setInterval(() => {
              setCount(count => count + 3)
            }, 100)
          }
        }}
      />
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
