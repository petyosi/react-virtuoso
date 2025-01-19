import * as React from 'react'
import { Virtuoso } from '../src'

export function Example() {
  return (
    <Virtuoso
      totalCount={100}
      topItemCount={1}
      components={{
        Header: () => <div style={{ height: 150 }}>Header</div>,
        Footer: () => <div style={{ height: 60 }}>Footer</div>,
      }}
      itemContent={(index) => <div style={{ height: 100, padding: '100px 0px', background: 'gray' }}>Item {index}</div>}
      style={{ height: 600 }}
      overscan={150}
    />
  )
}
