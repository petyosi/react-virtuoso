import * as React from 'react'
import { useRef, useEffect, useCallback, useState } from 'react'
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
  const [total, setTotal] = useState(0)
  const items = useRef([])
  const loading = useRef(false)

  // the setTimeout below simulates a network request.
  // In the real world, you can fetch data from a service.
  // the setTotal call will trigger a refresh for the list,
  // so make sure you call it last
  const loadMore = useCallback(() => {
    if (loading.current || total >= 300) {
      return
    }

    loading.current = true

    setTimeout(() => {
      for (let index = total; index < total + total + 100; index++) {
        items.current = [...items.current, getUser(index)]
      }
      loading.current = false
      setTotal(items.current.length)
    }, 500)
  }, [total])

  useEffect(() => {
    loadMore()
  }, [])

  return (
    <div>
      <button onClick={() => setTotal(0)}>Set to Zero</button>
      <button onClick={() => setTotal(2)}>Set to 2</button>
      <button onClick={() => setTotal(1000)}>Restore</button>
      <VirtuosoGrid
        style={{ width: '100%', height: '500px' }}
        overscan={200}
        totalCount={total}
        item={GenerateItem}
        endReached={() => loadMore()}
        itemClassName="virtuoso-grid-placeholder-item"
        scrollSeek={{
          enter: velocity => Math.abs(velocity) > 200,
          exit: velocity => {
            const shouldExit = Math.abs(velocity) < 30
            if (shouldExit) {
              // setVisibleRange(['-', '-'])
            }
            return shouldExit
          },
          change: (_velocity, { startIndex, endIndex }) => console.log(startIndex, endIndex),
          // You can use index to randomize
          // and make the placeholder list more organic.
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
