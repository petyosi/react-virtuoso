import * as React from 'react'
import { useState, createRef, useEffect } from 'react'
import * as ReactDOM from 'react-dom'

import { Virtuoso } from '../src/'

export default function App() {
  const [hide, setHide] = useState(false)
  const ref = createRef<any>()

  useEffect(() => {
    if (!hide) {
      ref.current.scrollToIndex({
        index: 25,
        behavior: 'auto',
        align: 'center',
      })
    }
  }, [hide, ref])

  return (
    <div className="App">
      <button onClick={() => setHide(prev => !prev)}>toggle hide</button>
      <div style={{ display: hide ? 'none' : 'block' }}>
        <Virtuoso
          ref={ref}
          totalCount={1000}
          item={index => <div>Item {index}</div>}
          style={{ height: '400px', width: '350px' }}
        />
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
