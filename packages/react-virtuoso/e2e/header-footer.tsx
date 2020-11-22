import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src'

const App = () => {
  return (
    <Virtuoso
      totalCount={100}
      topItemCount={2}
      components={{
        Header: () => <div style={{ height: 60 }}>Header</div>,
        Footer: () => <div style={{ height: 60 }}>Footer</div>,
      }}
      itemContent={index => <div style={{ height: 30 }}>Item {index}</div>}
      style={{ height: 300 }}
    />
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
