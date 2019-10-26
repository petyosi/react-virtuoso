import React, { useRef, useState, useEffect } from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso, GroupedVirtuoso, TItemContainer, TListContainer } from '../src/'

const ItemContainer: TItemContainer = ({ children, ...props }) => {
  return <li {...props}>{children}</li>
}

const GroupContainer: TItemContainer = ({ children, ...props }) => {
  return (
    <li {...props}>
      <strong>{children}</strong>
    </li>
  )
}

const ListContainer: TListContainer = ({ children, listRef, style }) => (
  <ul ref={listRef} style={style}>
    {children}
  </ul>
)

const App = () => {
  return (
    <div style={{ display: 'block' }}>
      <Virtuoso
        totalCount={100000}
        overscan={200}
        topItems={1}
        item={i => `Item ${i}`}
        style={{ height: '400px', width: '350px' }}
      />
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
