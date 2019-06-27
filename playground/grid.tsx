import React, { FC } from 'react'
import * as ReactDOM from 'react-dom'

import { VirtuosoGrid } from '../src/VirtuosoGrid'

const Item: FC<{ index: number }> = React.memo(({ index }) => {
  console.log('rendering', index)
  return <span>Item {index}</span>
})

Item.displayName = 'VirtuosoItem'

const App = () => {
  return (
    <div>
      <VirtuosoGrid totalCount={1000} item={index => <Item index={index} />} />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
