import * as React from 'react'
import { useState } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const GenerateItem = (index: number) => <div style={{ height: '40px' }}>{index}</div>

const App = () => {
  const [count, setCount] = useState(20)

  return (
    <div>
      <button onClick={() => setCount(count + 10)}>Add 10</button>
      <Virtuoso
        totalCount={count}
        item={GenerateItem}
        style={{ height: '400px', width: '350px' }}
        scrollingStateChange={scrollState => console.log({ scrollState })}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
