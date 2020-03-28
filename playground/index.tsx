import React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const App = () => {
  return (
    <div>
      <Virtuoso
        totalCount={1000000}
        item={index => <div style={{ height: '40px' }}>Item {index}</div>}
        style={{ height: '400px', width: '350px' }}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
