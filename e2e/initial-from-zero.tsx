import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const App = () => {
  const [items, setItems] = React.useState(Array.from({ length: 0 }).map(() => 'item'))
  const initialTopMostItemIndex = Math.max(0, items.length - 1)
  // set the initialTopMostItemIndex to 999 to have the list start at the bottom
  return (
    <div>
      <h3>virtualized</h3>
      <div>initialTopMostItemIndex = {initialTopMostItemIndex}</div>
      <Virtuoso
        data={items}
        initialTopMostItemIndex={initialTopMostItemIndex}
        itemContent={(index, item) => (
          <div>
            {item} {index}
          </div>
        )}
        style={{ height: '50px', width: '350px', border: 'solid thin gray' }}
      />

      <button onClick={() => setItems([...items, 'another'])}>add item</button>

      <h3>non virtualized</h3>
      <div style={{ height: '50px', width: '350px', border: 'solid thin gray' }}>
        {items.map((item, index) => (
          <div key={index}>
            {item} {index}
          </div>
        ))}
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
