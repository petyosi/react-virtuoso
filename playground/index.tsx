import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'
import { useState } from 'react'

const App = () => {
  const [total, setTotal] = useState(100)

  return (
    <div>
      <div>
        <button onClick={() => setTotal(0)}>Set to 0</button>
        <button onClick={() => setTotal(1)}>Set to 1</button>
        <button onClick={() => setTotal(100)}>Set to 100</button>
      </div>
      <Virtuoso
        totalCount={total}
        overscan={100}
        item={index => <div>Item {index}</div>}
        style={{ height: '400px', width: '80%', maxWidth: '600px' }}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
