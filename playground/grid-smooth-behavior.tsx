import * as React from 'react'
import { useRef, useEffect, useCallback, useState } from 'react'
import * as ReactDOM from 'react-dom'

import { VirtuosoGrid } from '../src/VirtuosoGrid'
import { getUser } from './fakeData'
// import { UserItem } from '../../site/src/examples/ExampleComponents'
import './grid.css'

const GenerateItem = (index: number) => {
  return (
    <div>
      {getUser(index).name} {index}
    </div>
  )
}

const App = () => {
  const [total, setTotal] = useState(1000)
  const [align, setAlign] = useState('center')
  const items = useRef([])
  const loading = useRef(false)
  const virtuoso = useRef<VirtuosoGrid>(false)

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

  console.log(total)

  return (
    <div>
      <button
        onClick={() => virtuoso.current && virtuoso.current.scrollToIndex({ index: 500, align, behavior: 'smooth' })}
      >
        Move to center
      </button>
      <select value={align} onChange={e => setAlign(e.target.value)}>
        <option value="start">Start</option>
        <option value="center">Center</option>
        <option value="end">End</option>
      </select>
      <VirtuosoGrid
        ref={virtuoso}
        style={{ width: '100%', height: '500px' }}
        overscan={200}
        totalCount={total}
        item={GenerateItem}
        endReached={() => loadMore()}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
