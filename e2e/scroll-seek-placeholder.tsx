import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const App = () => {
  return (
    <Virtuoso
      computeItemKey={key => `item-${key}`}
      totalCount={1000}
      itemContent={index => <div style={{ height: 30 }}>Item {index}</div>}
      style={{ height: 300 }}
      scrollSeekConfiguration={{
        enter: velocity => Math.abs(velocity) > 200,
        exit: velocity => Math.abs(velocity) < 30,
        change: (_, range) => console.log({ range }),
      }}
      components={{
        ScrollSeekPlaceholder: ({ height, index }) => <div style={{ height, color: 'red' }}>Placeholder {index}</div>,
      }}
    />
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
