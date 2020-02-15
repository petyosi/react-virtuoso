import React, { useRef, useState } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const App = () => {
  let seekIndexDelta = useRef(0)
  let prevRange = useRef({ startIndex: 0, endIndex: 0 })
  let [multiplier, setMultiplier] = useState(1)

  return (
    <div style={{ display: 'flex' }}>
      <Virtuoso
        style={{ width: '300px', height: '400px' }}
        totalCount={20000}
        item={index => <div style={{ height: 40 }}>Item {index}</div>}
      />
      <div>Multiplier: {multiplier}</div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
