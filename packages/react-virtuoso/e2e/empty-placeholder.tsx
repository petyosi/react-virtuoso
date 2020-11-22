import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src'
import { useState } from 'react'

const App = () => {
  const [totalCount, setTotalCount] = useState(1000)
  return (
    <div>
      <button onClick={() => setTotalCount(totalCount === 1000 ? 0 : 1000)}>Toggle</button>
      <Virtuoso
        computeItemKey={key => `item-${key}`}
        components={{
          EmptyPlaceholder: () => <div>Nothing to See here!</div>,
        }}
        totalCount={totalCount}
        isScrolling={isScrolling => console.log({ isScrolling })}
        itemContent={index => <div style={{ height: 30 }}>Item {index}</div>}
        style={{ height: 300 }}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
