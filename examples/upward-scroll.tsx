import * as React from 'react'
import { Virtuoso } from '../src'

function itemContent(index: number) {
  const height = index === 7 ? 120 : 30
  const backgroundColor = index === 7 ? 'red' : 'transparent'
  return <div style={{ height, backgroundColor }}>Item {index}</div>
}
export default function App() {
  return <Virtuoso totalCount={12} initialTopMostItemIndex={8} itemContent={itemContent} style={{ height: 100 }} />
}
