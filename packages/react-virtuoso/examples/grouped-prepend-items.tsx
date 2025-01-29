import * as React from 'react'
import { GroupedVirtuoso } from '../src'

function generateRandomString(length: number) {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

const ITEMS_PER_GROUP = 10
const INITIAL_GROUP_COUNT = 21
const INITIAL_TOPMOST_ITEM_INDEX = ITEMS_PER_GROUP * INITIAL_GROUP_COUNT - 1
const FIRST_ITEM_INDEX = 20000
const ITEMS_PER_PREPEND = 100

export function PrependWhenStartReached() {
  const [firstItemIndex, setFirstItemIndex] = React.useState(FIRST_ITEM_INDEX)

  const [groupCounts, setGroupCounts] = React.useState(() => {
    return Array.from({ length: INITIAL_GROUP_COUNT }, () => ITEMS_PER_GROUP)
  })

  // As items and groups get prepended, the groups change. We need to maintain an additional data structure to keep track of the group titles.
  const [groupTitles, setGroupTitles] = React.useState(() => {
    return Array.from({ length: INITIAL_GROUP_COUNT }, () => generateRandomString(5))
  })

  const prepend = React.useCallback(
    (amount: number) => () => {
      setFirstItemIndex((val) => val - amount)
      setGroupCounts((prevGroups) => {
        // this is just an example calculation so that the example validates the option to extend the first group
        // in reality, you may don't need to do that.
        const itemsToPrependToFirstGroup = amount % ITEMS_PER_GROUP

        // we will extend the first group with the leftover unshift value,
        // exact groups would also work, of course.
        const firstGroupNewCount = [...prevGroups].shift()! + itemsToPrependToFirstGroup

        const newGroupCount = Math.floor(amount / ITEMS_PER_GROUP)
        const newGroups = Array.from({ length: newGroupCount }, () => ITEMS_PER_GROUP)

        const result = [...newGroups, firstGroupNewCount, ...prevGroups]

        // prepend the group titles with new random strings based on how many new groups we added
        setGroupTitles((prevTitles) => {
          const newTitles = Array.from({ length: newGroupCount }, () => generateRandomString(5))
          return [...newTitles, ...prevTitles]
        })

        return result
      })
    },
    []
  )

  return (
    <div>
      <GroupedVirtuoso
        firstItemIndex={firstItemIndex}
        startReached={prepend(ITEMS_PER_PREPEND)}
        initialTopMostItemIndex={INITIAL_TOPMOST_ITEM_INDEX}
        context={{ groupTitles }}
        groupCounts={groupCounts}
        itemContent={(index) => <div style={{ height: '20px' }}>Item {index}</div>}
        groupContent={(index, { groupTitles }) => (
          <div style={{ height: '30px', backgroundColor: '#f5f5f5' }}>Group {groupTitles[index]}</div>
        )}
        style={{ height: '300px' }}
      />
    </div>
  )
}
