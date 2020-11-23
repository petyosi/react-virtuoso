---
id: prepend-items
title: Prepending Items
sidebar_label: Prepending Items
slug: /prepend-items/
---

Appending items to the list is straightforward - the items at the bottom do not displace the currently rendered ones. 
Prepending items is more complex, because the current items should remain at their location and their indexes should not be offset.

This example shows how to increase the item count and instruct the component that you are prepending items by decreasing the `firstItemIndex` property value when the user scrolls to the top, creating **reverse endless scrolling**.

```jsx live
() => {
  const START_INDEX = 10000
  const INITIAL_ITEM_COUNT = 200
  const generateUsers = useCallback((length, startIndex) => {
      return Array.from({ length }).map((_, index) => getUser(startIndex + index))
  }, [])

  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX)
  const [users, setUsers] = useState(() =>
    generateUsers(INITIAL_ITEM_COUNT, START_INDEX)
  )

  const prependItems = useCallback(() => {
    const usersToPrepend = 100
    const nextFirstItemIndex = firstItemIndex - usersToPrepend

    setFirstItemIndex(() => nextFirstItemIndex)
    setUsers(() => [
      ...generateUsers(usersToPrepend, nextFirstItemIndex),
      ...users,
    ])

    return false
  }, [firstItemIndex, users, setUsers])

  return (
    <Virtuoso
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={INITIAL_ITEM_COUNT - 1}
      data={users}
      startReached={prependItems}
      itemContent={(index, user) => {
        return <div>{index}. {user.name}</div>
      }}
    />
  )
}
```
