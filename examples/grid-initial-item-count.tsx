import * as React from 'react'
import { VirtuosoGrid } from '../src'

function generateItems(length: number) {
  return Array.from({ length }, (_, index) => `My Item ${index}`)
}

const itemContent = (_: number, data: string) => {
  return <div style={{ height: 30 }}>{data}</div>
}

export function Example() {
  const [data, setData] = React.useState(() => generateItems(100))

  const onEndReached = () => {
    setData((prevData) => {
      return generateItems(prevData.length + 100)
    })
  }

  return (
    <VirtuosoGrid
      useWindowScroll
      initialItemCount={100}
      endReached={onEndReached}
      data={data}
      itemContent={itemContent}
      style={{ height: 300 }}
    />
  )
}
