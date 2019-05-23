import React from 'react'
import * as ReactDOM from 'react-dom'
import { GroupedVirtuoso } from '../src/'

const App = () => {
  const groupCounts = []
  for (let index = 0; index < 10; index++) {
    groupCounts.push(10)
  }
  return (
    <div>
      <GroupedVirtuoso
        style={{ height: '400px', width: '350px' }}
        groupCounts={groupCounts}
        group={index => {
          return (
            <div style={{ height: '20px' }}>
              Group {index * 10} &ndash; {index * 10 + 10}
            </div>
          )
        }}
        item={(index, groupIndex) => {
          return (
            <div style={{ height: '40px' }}>
              {index} (group {groupIndex})
            </div>
          )
        }}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
