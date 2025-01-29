import * as React from 'react'

import { Virtuoso } from '../src'

export function Example() {
  const [fii] = React.useState(1000)
  return (
    <Virtuoso
      defaultItemHeight={30}
      firstItemIndex={fii}
      initialTopMostItemIndex={99}
      itemContent={itemContent}
      style={{ height: 800 }}
      totalCount={100}
    />
  )
}

function itemContent(index: number) {
  const height = index === 1099 ? 120 : 30
  const backgroundColor = index === 1099 ? 'red' : 'transparent'
  return <div style={{ backgroundColor, height }}>Item {index}</div>
}
