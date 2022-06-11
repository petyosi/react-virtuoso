import * as React from 'react'
import { Virtuoso } from '../src'
import { generateUsers } from './example-data'
import { useState, useCallback } from 'react'

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
    }, 100)

    return false
  }, [firstItemIndex, users, setUsers])

  return (
    <Virtuoso
      style={{ height: 400 }}
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={INITIAL_ITEM_COUNT - 1}
      data={users}
      startReached={prependItems}
      increaseViewportBy={{ top: 1500, bottom: 0 }}
      itemContent={(_, user) => {
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
