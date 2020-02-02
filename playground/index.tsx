import React, { useRef, useState } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/'

const App = () => {
  let seekIndexDelta = useRef(0)
  let prevRange = useRef({ startIndex: 0, endIndex: 0 })
  let [multiplier, setMultiplier] = useState(1)

  return (
    <div style={{ display: 'flex' }}>
      <Virtuoso
        style={{ width: '300px', height: '400px' }}
        totalCount={20000}
        initialTopMostItemIndex={19999}
        scrollSeek={{
          enter: (velocity, range) => {
            let shouldEnter = Math.abs(velocity) > 200
            if (shouldEnter) {
              seekIndexDelta.current = 0
              prevRange.current = range
            }
            return shouldEnter
          },

          change: (velocity, range) => {
            const absVelocity = Math.abs(velocity)
            let newMultiplier: number
            if (absVelocity > 400) {
              newMultiplier = 10
            } else if (absVelocity > 300) {
              newMultiplier = 5
            } else if (absVelocity > 200) {
              newMultiplier = 2
            } else {
              newMultiplier = 1
            }

            // scrolling up
            if (prevRange.current.startIndex < range.startIndex) {
              seekIndexDelta.current -= (range.startIndex - prevRange.current.startIndex) * newMultiplier
            } else {
              seekIndexDelta.current += (range.endIndex - prevRange.current.endIndex) * newMultiplier
            }

            prevRange.current = range
            setMultiplier(newMultiplier)
            console.log('changing with ', seekIndexDelta.current)
          },

          exit: (velocity, _) => {
            const shouldExit = Math.abs(velocity) < 7
            setMultiplier(1)
            return shouldExit
          },

          placeholder: ({ height }) => {
            return <div style={{ height, background: 'red' }}>-----</div>
          },
        }}
        item={index => <div style={{ height: 40 }}>Item {index}</div>}
      />
      <div>Multiplier: {multiplier}</div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
