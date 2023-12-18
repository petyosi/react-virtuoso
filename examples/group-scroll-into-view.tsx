import * as React from 'react'
import { GroupedVirtuoso, GroupedVirtuosoHandle } from '../src'

export default function App() {
  const virutoso = React.useRef<GroupedVirtuosoHandle>(null)
  const g = React.useRef(0)
  const groupCounts = React.useMemo(() => {
    const result = Array.from({ length: 20 }).fill(3) as number[]
    result.splice(13, 0, 0)
    return result
  }, [])
  return (
    <div>
      <button data-test-id="scroll-into-view-button" onClick={() => virutoso.current.scrollIntoView({ index: 9 })}>
        Scroll index 10 into view
      </button>
      <button data-test-id="scroll-to-group" onClick={() => virutoso.current.scrollIntoView({ groupIndex: ++g.current })}>
        Scroll to next group
      </button>
      <GroupedVirtuoso
        ref={virutoso}
        groupCounts={groupCounts}
        itemContent={(index) => <div style={{ height: '20px' }}>Item {index}</div>}
        groupContent={(index) => <div style={{ height: '30px', backgroundColor: 'white' }}>Group {index}</div>}
        style={{ height: '300px' }}
      />
    </div>
  )
}
