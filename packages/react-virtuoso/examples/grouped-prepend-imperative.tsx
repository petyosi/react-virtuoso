import * as React from 'react'
import { GroupedVirtuoso, GroupedVirtuosoHandle } from '../src'

const ITEMS_PER_GROUP = 10
const INITIAL_GROUP_COUNT = 21
const FIRST_ITEM_INDEX = 20000
const ITEMS_PER_PREPEND = 100

export function GroupedPrependImperative() {
  const virtuosoRef = React.useRef<GroupedVirtuosoHandle>(null)
  const [firstItemIndex, setFirstItemIndex] = React.useState(FIRST_ITEM_INDEX)
  const [groupCounts, setGroupCounts] = React.useState(() => {
    return Array.from({ length: INITIAL_GROUP_COUNT }, () => ITEMS_PER_GROUP)
  })

  const prepend = React.useCallback(() => {
    virtuosoRef.current?.prependItems?.({ groupIndex: 0, count: ITEMS_PER_PREPEND })

    setFirstItemIndex((val) => val - ITEMS_PER_PREPEND)
    setGroupCounts((prev) => {
      const result = [...prev]
      result[0] = (result[0] || 0) + ITEMS_PER_PREPEND
      return result
    })
  }, [])

  return (
    <div>
      <button onClick={prepend} style={{ marginBottom: '10px', padding: '10px', background: 'blue', color: 'white' }}>
        Prepend {ITEMS_PER_PREPEND} items (Imperative API - No Flicker)
      </button>
      <GroupedVirtuoso
        ref={virtuosoRef}
        firstItemIndex={firstItemIndex}
        groupCounts={groupCounts}
        groupContent={(index) => <div style={{ backgroundColor: '#f5f5f5', height: '30px', padding: '5px' }}>Group {index}</div>}
        itemContent={(index) => <div style={{ height: '20px', padding: '2px' }}>Item {index}</div>}
        style={{ height: '400px', border: '1px solid #ccc' }}
      />
    </div>
  )
}
export function GroupedPrependAndShift() {
  const ref = React.useRef<GroupedVirtuosoHandle>(null)
  const [firstItemIndex, setFirstItemIndex] = React.useState(20000)
  const [groupCounts, setGroupCounts] = React.useState<number[]>(() => Array(21).fill(10))

  const prepend = () => {
    ref.current?.prependItems?.({ groupIndex: 0, count: 100 })

    setFirstItemIndex((v) => v - 100)
    setGroupCounts((p) => {
      const result = [...p]
      result[0] = (result[0] || 0) + 100
      return result
    })
  }

  const shift = () => {
    const removeCount = Math.min(100, groupCounts[0] || 0)
    if (removeCount === 0) return

    ref.current?.shiftItems?.({ groupIndex: 0, count: removeCount })

    setFirstItemIndex((v) => v + removeCount)
    setGroupCounts((p) => {
      const result = [...p]
      result[0] = Math.max(0, result[0] - removeCount)
      return result
    })
  }

  return (
    <div>
      <button onClick={prepend}>Prepend 100</button>
      <button onClick={shift}>Remove 100 from start</button>
      <GroupedVirtuoso
        ref={ref}
        firstItemIndex={firstItemIndex}
        groupCounts={groupCounts}
        groupContent={(i) => <div style={{ background: '#f5f5f5', height: '30px' }}>Group {i}</div>}
        itemContent={(i) => <div style={{ height: '20px' }}>Item {i}</div>}
        style={{ height: '400px' }}
      />
    </div>
  )
}
