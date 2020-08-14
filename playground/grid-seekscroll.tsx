import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { VirtuosoGrid } from '../src/VirtuosoGrid'
import { getUser } from './fakeData'
import './grid.css'

const GenerateItem = (index: number) => {
  return (
    <div className="item">
      {getUser(index).name} {index}
    </div>
  )
}

const App = () => {
  const items = Array.from({ length: 300 }).map((_, index) => getUser(index))

  return (
    <div>
      <VirtuosoGrid
        style={{ width: '100%', height: '500px' }}
        overscan={200}
        totalCount={items.length}
        item={GenerateItem}
        itemClassName="virtuoso-grid-placeholder-item"
        scrollSeek={{
          enter: velocity => Math.abs(velocity) > 200,
          exit: velocity => Math.abs(velocity) < 30,
          change: (_velocity, { startIndex, endIndex }) => console.log(startIndex, endIndex),
          placeholder: ({ index, height }) => (
            <div style={{ height }} className="placeholder">
              {index}
            </div>
          ),
        }}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
