import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { List } from '../src/List'
import faker from 'faker'

const contents = Array.from({ length: 20000 }).map((_, index) => (
  // `Item ${index}`
  // index % 2 ? ( <div style={{ height: 28, background: 'red' }}>Item {index}</div>) : ( <div style={{ height: 78, background: 'blue' }}>Item {index}</div>)
  <div style={{ background: index % 2 ? 'red' : 'blue' }}>
    Item {index}:<span style={{ visibility: 'hidden' }}>{faker.lorem.paragraphs(Math.round(Math.random() * 3 + 2))}</span>
  </div>
))

const App = () => {
  return (
    <div style={{ height: '100%' }}>
      <List
        initialTopMostItemIndex={4}
        groupCounts={Array.from({ length: 20 }).fill(3) as number[]}
        itemContent={index => <div style={{ boxSizing: 'border-box', border: '1px solid red' }}>{contents[index]}</div>}
        groupContent={index => <div style={{ background: 'white' }}>Group {index}</div>}
        style={{ height: 'calc(100% - 2rem)', boxSizing: 'border-box', margin: '1rem' }}
        id="my-id"
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
