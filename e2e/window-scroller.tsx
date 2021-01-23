import * as React from 'react'
import { Virtuoso } from '../src/'

export default function App() {
  return (
    <div style={{ padding: '20px' }}>
      <Virtuoso
        computeItemKey={key => `item-${key}`}
        initialItemCount={30}
        totalCount={100}
        topItemCount={3}
        itemContent={index => <div style={{ height: 30 }}>Item {index}</div>}
        style={{ border: '1px solid red', height: '300px' }}
        useWindowScroll={true}
        initialTopMostItemIndex={40}
      />
    </div>
  )
}
