import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const App = () => {
  return (
    <Virtuoso
      computeItemKey={key => `item-${key}`}
      initialItemCount={30}
      totalCount={100}
      initialScrollTop={50}
      itemContent={index => <div style={{ height: 30 }}>Item {index}</div>}
      style={{ height: 300 }}
    />
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
