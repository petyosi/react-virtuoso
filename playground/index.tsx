import React, { useState } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const GenerateItem = index => (
  <div style={{ height: '40px' }}>
    Item {index} {Math.random()}
  </div>
)

const App = () => {
  const [data, updateData] = useState({ count: 5, isUpdated: false, dataKey: '1' })

  setTimeout(() => {
    if (!data.isUpdated) {
      console.log('update')
      updateData({
        count: 5,
        isUpdated: true,
        dataKey: '2',
      })
    }
  }, 3000)

  return (
    <div>
      <Virtuoso
        dataKey={data.dataKey}
        totalCount={data.count}
        item={GenerateItem}
        style={{ height: '400px', width: '350px' }}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
