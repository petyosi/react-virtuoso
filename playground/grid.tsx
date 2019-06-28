import React, { FC, useRef } from 'react'
import * as ReactDOM from 'react-dom'

import { VirtuosoGrid } from '../src/VirtuosoGrid'

const Item: FC<{ index: number }> = React.memo(({ index }) => {
  console.log('rendering', index)
  return <span>Item {index}</span>
})

Item.displayName = 'VirtuosoItem'

const App = () => {
  const ref = useRef<VirtuosoGrid>(null)
  return (
    <div>
      <button onClick={() => ref.current.scrollToIndex(300)}>Scroll to 300</button>

      <VirtuosoGrid
        ref={ref}
        totalCount={100}
        scrollingStateChange={scrolling => console.log({ scrolling })}
        endReached={end => console.log({ end })}
        item={index => <Item index={index} />}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
