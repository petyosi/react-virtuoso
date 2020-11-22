import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src'

const App = () => {
  return (
    <Virtuoso
      initialTopMostItemIndex={10}
      groupCounts={Array.from({ length: 20 }).fill(3) as number[]}
      itemContent={index => <div style={{ height: '20px' }}>Item {index}</div>}
      groupContent={index => <div style={{ height: '30px' }}>Group {index}</div>}
      style={{ height: '300px' }}
    />
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
