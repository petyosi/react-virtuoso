import * as React from 'react'
import { Virtuoso } from '../src'

export default function App() {
  return (
    <Virtuoso
      totalCount={100}
      topItemCount={2}
      components={{
        Header: () => <div style={{ height: 150 }}>Header</div>,
        Footer: () => <div style={{ height: 60 }}>Footer</div>,
      }}
      itemContent={(index) => <div style={{ height: 150, background: 'gray' }}>Item {index}</div>}
      style={{ height: 600 }}
    />
  )
}
