import * as React from 'react'
import { useState } from 'react'
import { Virtuoso } from '../src'

export default function App() {
  const [data] = useState([{ msg: 'im a bird' }, { msg: 'im a bird 2' }])
  return (
    <div style={{ height: 475.61, width: '100%' }}>
      <Virtuoso
        data={data}
        initialTopMostItemIndex={1}
        itemContent={(_, data) => {
          return <div>{data.msg}</div>
        }}
      />
    </div>
  )
}
