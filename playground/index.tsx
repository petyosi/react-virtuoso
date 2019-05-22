import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const App = () => {
  const [total, setTotal] = useState(0)
  const items = useRef([])
  const loading = useRef(false)

  // the setTimeout below simulates a network request.
  // In the real world, you can fetch data from a service.
  // the setTotal call will trigger a refresh for the list,
  // so make sure you call it last
  const loadMore = useCallback(() => {
    if (loading.current) {
      return
    }
    loading.current = true

    setTimeout(() => {
      for (let index = total; index < total + total + 100; index++) {
        items.current = [...items.current, { index }]
      }
      loading.current = false
      setTotal(items.current.length)
    }, 200)
  }, [])

  useEffect(() => {
    loadMore()
  }, [])

  return (
    <div>
      <Virtuoso
        totalCount={total}
        overscan={100}
        item={index => <div>Item {index}</div>}
        style={{ height: '400px', width: '80%', maxWidth: '600px' }}
        endReached={(idx: number) => {
          if (idx > total - 20) {
            console.log('loading more', idx)
            loadMore()
          }
        }}
        footer={() => {
          return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        }}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
