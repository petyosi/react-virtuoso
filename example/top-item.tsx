import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { List } from '../src/List'
import faker from 'faker'

const contents = Array.from({ length: 20000 }).map((_, index) => (
  // `Item ${index}`
  // index % 2 ? ( <div style={{ height: 28, background: 'red' }}>Item {index}</div>) : ( <div style={{ height: 78, background: 'blue' }}>Item {index}</div>)
  <div
    style={{
      background: index % 2 ? '#fcfcfc' : '#f4f4f4',
      borderBottom: '1px solid #ccc',
    }}
  >
    Item {index}:<span style={{ padding: '1rem', display: 'block' }}>{faker.lorem.paragraphs(Math.round(Math.random() * 3 + 1))}</span>
  </div>
))

const App = () => {
  return (
    <div style={{ padding: '4rem' }}>
      <List topItemCount={2} totalCount={20000} itemContent={index => <div style={{ boxSizing: 'border-box' }}>{contents[index]}</div>} />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
