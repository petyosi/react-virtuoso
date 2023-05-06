---
id: prepend-items
title: Prepending Items
sidebar_label: Prepending Items
slug: /prepend-items/
---

Appending items to the list is straightforward - the items at the bottom do not displace the currently rendered ones.
Prepending items is more complex because the current items should remain at their location, and their indexes should not be offset.

This example shows how to increase the item count and instruct the component that you are prepending items by decreasing the `firstItemIndex` property
value when the user scrolls to the top, creating **reverse endless scrolling**.

```jsx live include-data
import { Virtuoso } from 'react-virtuoso'
import { generateUsers } from './data'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'

export default function App() {
  const START_INDEX = 10000
  const INITIAL_ITEM_COUNT = 100

  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX)
  const [users, setUsers] = useState(() => generateUsers(INITIAL_ITEM_COUNT, START_INDEX))

  const prependItems = useCallback(() => {
    const usersToPrepend = 20
    const nextFirstItemIndex = firstItemIndex - usersToPrepend

    setTimeout(() => {
      setFirstItemIndex(() => nextFirstItemIndex)
      setUsers(() => [...generateUsers(usersToPrepend, nextFirstItemIndex), ...users])
    }, 500)

    return false
  }, [firstItemIndex, users, setUsers])

  return (
    <Virtuoso
      style={{ height: 400 }}
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={INITIAL_ITEM_COUNT - 1}
      data={users}
      startReached={prependItems}
      itemContent={(index, user) => {
        return (
          <div style={{ backgroundColor: user.bgColor, padding: '1rem 0.5rem' }}>
            <h4>
              {user.index}. {user.name}
            </h4>
            <div style={{ marginTop: '1rem' }}>{user.description}</div>
          </div>
        )
      }}
    />
  )
}
```

Prepending items in grouped mode works in a similar fashion. You need to ensure that the `firstItemIndex` is decreased with the amount of items **exclding the groups themselves** added to the `groupCounts` property.
Follow the example below for further details

```jsx live include-data
import React from 'react'
import { GroupedVirtuoso } from 'react-virtuoso'

function generateRandomString(length) {
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

export default function App() {
  const [firstItemIndex, setFirstItemIndex] = React.useState(FIRST_ITEM_INDEX)

  const [groupCounts, setGroupCounts] = React.useState(() => {
    return Array.from({ length: INITIAL_GROUP_COUNT }, () => ITEMS_PER_GROUP)
  })

  // As items and groups get prepended, the groups change. We need to maintain an additional data structure to keep track of the group titles.
  const [groupTitles, setGroupTitles] = React.useState(() => {
    return Array.from({ length: INITIAL_GROUP_COUNT }, () => generateRandomString(5))
  })

  const prepend = React.useCallback(
    (amount) => () => {
      setFirstItemIndex((val) => val - amount)
      setGroupCounts((prevGroups) => {
        // this is just an example calculation so that the example validates the option to extend the first group
        // in reality, you may don't need to do that.
        const itemsToPrependToFirstGroup = amount % ITEMS_PER_GROUP

        // we will extend the first group with the leftover unshift value,
        // exact groups would also work, of course.
        const firstGroupNewCount = [...prevGroups].shift() + itemsToPrependToFirstGroup

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
        groupContent={(index, { groupTitles }) => <div style={{ height: '30px', backgroundColor: 'blue' }}>Group {groupTitles[index]}</div>}
        style={{ height: '300px' }}
      />
    </div>
  )
}
```
