import React, { useRef, useEffect } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../../src/'

const App = () => {
  const ref = useRef<Virtuoso>(null)

  useEffect(() => {
    setTimeout(() => {
      console.log('foo')
      ref.current.scrollToIndex({ index: 29, align: 'end' })
    }, 200)
  }, [])

  return (
    <div>
      <button
        onClick={() => {
          ref.current.scrollToIndex(40)
        }}
      >
        Scroll to 40
      </button>

      <button
        onClick={() => {
          ref.current.scrollToIndex(10)
        }}
      >
        Scroll to 10
      </button>
      <Virtuoso
        ref={ref}
        style={{ height: '400px', width: '350px' }}
        totalCount={60}
        item={index => {
          return (
            <div
              style={{
                height: [15, 25, 26, 27, 28, 45, 56, 51].includes(index) ? '60px' : '40px',
                paddingTop: '10px',
                borderBottom: '1px solid #ccc',
                boxSizing: 'border-box',
              }}
            >
              Item {index}
            </div>
          )
        }}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
