import React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const App = () => {
  const groupCounts = []
  for (let index = 0; index < 1000; index++) {
    groupCounts.push(1)
  }

  return (
    <div>
      <Virtuoso
        style={{ width: '100%', height: '400px' }}
        totalCount={600}
        item={index => {
          return <div style={{ height: index < 100 ? 200 : 20 }}>test {index}</div>
        }}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))

/*
      <GroupedVirtuoso
        style={{ height: '400px', width: '350px' }}
        groupCounts={groupCounts}
        group={index => {
          return (
            <div style={{ height: 100 }}>
              Group {index * 10} &ndash; {index * 10 + 10}
            </div>
          )
        }}
        overscan={200}
        item={(index, groupIndex) => {
          return (
            <div>
              {index} (group {groupIndex})
            </div>
          )
        }}
      />
   */
