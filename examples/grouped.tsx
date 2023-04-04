import * as React from 'react'
import { GroupedVirtuoso } from '../src'

export function Example() {
  return (
    <GroupedVirtuoso
      groupCounts={Array.from({ length: 20 }).fill(3) as number[]}
      itemContent={(index) => <div style={{ height: '20px' }}>Item {index}</div>}
      groupContent={(index) => <div style={{ height: '30px', backgroundColor: 'gray' }}>Group {index}</div>}
      style={{ height: '300px' }}
    />
  )
}

const ITEMS_PER_GROUP = 3
export function Unshifting() {
  const [firstItemIndex, setFirstItemIndex] = React.useState(4000)
  const [groupCounts, setGroupCounts] = React.useState(() => {
    return Array.from({ length: 20 }, () => ITEMS_PER_GROUP)
  })

  const prepend = React.useCallback(
    (amount: number) => () => {
      setFirstItemIndex((val) => val - amount)
      setGroupCounts((prevGroups) => {
        if (amount > 0) {
          const leftOver = amount % ITEMS_PER_GROUP
          // we will extend the first group with the leftover unshift value, so that we can make our life harder.
          const firstGroupNewCount = prevGroups.shift()! + leftOver

          // the rest will be distributed into groups of 3
          const newGroupCount = Math.floor(amount / ITEMS_PER_GROUP)
          const newGroups = Array.from({ length: newGroupCount }, () => ITEMS_PER_GROUP)

          return [...newGroups, firstGroupNewCount, ...prevGroups]
        } else {
          let removedItems = 0
          while (true) {
            const firstGroup = prevGroups.shift()!
            if (removedItems + firstGroup < -amount) {
              removedItems += firstGroup
            } else {
              const newFirstGroup = firstGroup + amount + removedItems
              if (newFirstGroup === 0) {
                return prevGroups
              } else {
                return [newFirstGroup, ...prevGroups]
              }
            }
          }
        }
      })
    },
    []
  )

  return (
    <div>
      <button data-test-id="prepend-10" onClick={prepend(10)}>
        Prepend 10 Items
      </button>
      <button data-test-id="shift-2" onClick={prepend(-2)}>
        Shift 2 Items
      </button>

      <GroupedVirtuoso
        firstItemIndex={firstItemIndex}
        groupCounts={groupCounts}
        itemContent={(index) => <div style={{ height: '20px' }}>Item {index}</div>}
        groupContent={(index) => <div style={{ height: '30px', backgroundColor: 'gray' }}>Group {index}</div>}
        style={{ height: '300px' }}
      />
    </div>
  )
}
