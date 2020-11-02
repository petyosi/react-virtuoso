import * as React from 'react'
import { useState, createRef, useEffect, useRef } from 'react'
import * as ReactDOM from 'react-dom'

import { Virtuoso } from '../src'

export default function App() {
  const [total, setTotal] = useState(100)
  const [appending, setAppending] = useState(true);
  const appendInterval = useRef(null)

  useEffect(() => {
    if (!appending) return () => {};
    function append() {
      console.log('appending items')
      setTotal(old => old + 1)
    }
    const interval = setInterval(append, 50)
    return () => clearInterval(interval)
  }, [appending])

  return (
    <div className="App">
      <div>
        <Virtuoso
          totalCount={total}
          item={index => <div>Item {index}</div>}
          style={{ height: '100vh', width: '350px' }}
          followOutput
        />
      </div>
      <button onClick={() => setAppending(!appending)}>feed {appending ? "on" : "off"}</button>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
