import * as React from 'react'
import { useState } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const App = () => {
  const [count, setCount] = useState(0)
  return (
    <div>
      <button onClick={() => setCount(count === 0 ? 10000 : 0)}>Toggle</button>
      <Virtuoso
        totalCount={count}
        emptyComponent={() => 'No Items'}
        style={{ height: '400px', width: '350px' }}
        item={index => <div>Item {index}</div>}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
