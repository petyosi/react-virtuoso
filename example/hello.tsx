import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { List } from '../src/List'
import faker from 'faker'

const contents = Array.from({ length: 20000 }).map((_, index) => (
  // `Item ${index}`
  // index % 2 ? ( <div style={{ height: 28, background: 'red' }}>Item {index}</div>) : ( <div style={{ height: 78, background: 'blue' }}>Item {index}</div>)
  <div style={{ background: index % 2 ? 'red' : 'blue' }}>
    Item {index}:<span style={{ visibility: 'hidden' }}>{faker.lorem.paragraphs(Math.round(Math.random() * 10 + 2))}</span>
  </div>
))

const App = () => {
  return (
    <List
      totalCount={20000}
      itemContent={index => <div style={{ boxSizing: 'border-box', border: '1px solid red' }}>{contents[index]}</div>}
      style={{ border: '10px solid black', height: '100%' }}
      id="my-id"
    />
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
