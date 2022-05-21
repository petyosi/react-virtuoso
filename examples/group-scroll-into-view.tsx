import * as React from 'react'
import { GroupedVirtuoso, VirtuosoHandle } from '../src'

export default function App() {
  const virutoso = React.useRef<VirtuosoHandle>(null)
  return (
    <div>
      <button data-test-id="scroll-into-view-button" onClick={() => virutoso.current.scrollIntoView({ index: 9 })}>
        Scroll index 10 into view
      </button>
      <GroupedVirtuoso
        ref={virutoso}
        groupCounts={Array.from({ length: 20 }).fill(3) as number[]}
        itemContent={(index) => <div style={{ height: '20px' }}>Item {index}</div>}
        groupContent={(index) => <div style={{ height: '30px' }}>Group {index}</div>}
        style={{ height: '300px' }}
      />
    </div>
  )
}
