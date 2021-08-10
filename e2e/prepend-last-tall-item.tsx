import * as React from 'react'
import { Virtuoso } from '../src/'

function itemContent(index: number) {
  const height = index === 1099 ? 120 : 30
  const backgroundColor = index === 1099 ? 'red' : 'transparent'
  return <div style={{ height, backgroundColor }}>Item {index}</div>
}

export default function App() {
  const [fii] = React.useState(1000)
  return (
    <Virtuoso
      totalCount={100}
      defaultItemHeight={30}
      firstItemIndex={fii}
      initialTopMostItemIndex={99}
      itemContent={itemContent}
      style={{ height: 800 }}
    />
  )
}
