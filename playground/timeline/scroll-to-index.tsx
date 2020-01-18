import React, { useRef, useEffect, useState } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../../src/'

const App = () => {
  const ref = useRef<Virtuoso>(null)
  const [initialTopMostItemIndex, setInitialTopMostItemIndex] = useState(10)
  const [totalCount, setTotalCount] = useState(600)
  const [prependCount, setPrependCount] = useState(0)

  return (
    <div>
      <button
        onClick={() => {
          setInitialTopMostItemIndex(40)
        }}
      >
        Scroll to 40
      </button>

      <button
        onClick={() => {
          setInitialTopMostItemIndex(10)
        }}
      >
        Scroll to 10
      </button>
      <button
        onClick={() => {
          setInitialTopMostItemIndex(59)
        }}
      >
        Scroll to 59
      </button>
      <button
        onClick={() => {
          setTotalCount(totalCount + 10)
        }}
      >
        Append 3 more items
      </button>

      <button
        onClick={() => {
          setTotalCount(totalCount + 10)
          ref.current.adjustForPrependedItems(10)
          setPrependCount(prependCount + 10)
        }}
      >
        Prepend 10 items
      </button>

      <Virtuoso
        ref={ref}
        style={{ height: '400px', width: '350px' }}
        totalCount={totalCount}
        followOutput={true}
        initialTopMostItemIndex={initialTopMostItemIndex}
        atBottomStateChange={atBottom => void atBottom}
        maxHeightCacheSize={500}
        prependItemCount={prependCount}
        item={index => {
          return (
            <div
              style={{
                height: index % 2 ? '60px' : '40px',
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
