import * as React from 'react'
import { GroupedVirtuoso } from '../src'

export default function App() {
  const [visible, setVisible] = React.useState(true)
  return (
    <>
      <button onClick={() => setVisible((val: boolean) => !val)}>Toggle</button>
      <GroupedVirtuoso
        style={{ display: visible ? 'block' : 'none', height: '300px' }}
        groupCounts={Array.from({ length: 20 }).fill(3) as number[]}
        itemContent={(index) => <div style={{ height: '20px' }}>Item {index}</div>}
        groupContent={(index) => <div style={{ height: '30px' }}>Group {index}</div>}
      />
    </>
  )
}
