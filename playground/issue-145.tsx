import React, { useState } from 'react'
import * as ReactDOM from 'react-dom'

import { GroupedVirtuoso } from '../src/'

export default function App() {
  const [hide, setHide] = useState(false)

  return (
    <div className="App">
      <button onClick={() => setHide(prev => !prev)}>toggle hide</button>
      <div style={{ display: hide ? 'none' : 'block' }}>
        <GroupedVirtuoso group={index => <div>{index}</div>} item={index => <div>{index}</div>} groupCounts={[50]} />
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
