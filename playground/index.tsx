import React, { useRef } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const App = () => {
  const virtuoso = useRef(null)

  /*
  let seekIndexDelta = useRef(0)
  let prevRange = useRef({ startIndex: 0, endIndex: 0 })
  let [multiplier, setMultiplier] = useState(1)
   */

  return (
    <div>
      <button
        onClick={() => {
          virtuoso.current.scrollToIndex({
            index: 499,
          })
          return false
        }}
      >
        Scroll To 500
      </button>
      <div style={{ display: 'flex' }}>
        <Virtuoso
          ref={virtuoso}
          style={{ width: '300px', height: '400px' }}
          totalCount={1000}
          scrollingStateChange={isScrolling => console.log({ isScrolling })}
          item={index => (
            <div>
              Item {index} {index % 2 ? new Array(40).fill(' aaa aa ').join('') : ''}
            </div>
          )}
        />
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
